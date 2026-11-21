import { MessageChannel, type MessagePort } from 'node:worker_threads';
import { afterEach, describe, expect, it } from 'vitest';
import { botDecisionSeed } from '../../src/engine/bot-random';
import { shuffledDeck } from '../../src/engine/deck';
import { applyAction, createHand, type Action } from '../../src/engine/hand';
import { playerView } from '../../src/engine/player-view';
import {
  CASH_BUY_IN,
  handReplayCode,
  playHand,
  PLAYTEST_STAKES,
  toAction,
} from '../../src/playtest/runner';
import type { AdviceRequest, AdviceResponse } from '../../src/table/advice-service';
import {
  AdviceClient,
  sharedAdviceClient,
  type WorkerLike,
} from '../../src/ui/advice/advice-client';
import { installAdviceWorker, type WorkerScope } from '../../src/ui/advice/worker-host';

const ports: MessagePort[] = [];
afterEach(() => {
  for (const port of ports.splice(0)) port.close();
});

/** installAdviceWorker on one port and an AdviceClient on the other: real structured clone, no browser. */
function clientOverChannel(): AdviceClient {
  const { port1, port2 } = new MessageChannel();
  ports.push(port1, port2);
  installAdviceWorker(port1 as unknown as WorkerScope);
  port1.start();
  const worker = {
    postMessage: (message: unknown) => port2.postMessage(message),
    addEventListener: (type: string, listener: EventListener) =>
      port2.addEventListener(type, listener),
    removeEventListener: (type: string, listener: EventListener) =>
      port2.removeEventListener(type, listener),
    terminate: () => port2.close(),
  } as unknown as WorkerLike;
  const client = new AdviceClient(worker);
  port2.start();
  return client;
}

type Listener = (event: Event) => void;

/** A WorkerLike that records posts and lets the test fire events. */
class FakeWorker {
  readonly posted: AdviceRequest[] = [];
  readonly listeners = new Map<string, Set<Listener>>();
  terminated = 0;
  postMessage(message: AdviceRequest): void {
    this.posted.push(message);
  }
  addEventListener(type: string, listener: Listener): void {
    const set = this.listeners.get(type) ?? new Set<Listener>();
    set.add(listener);
    this.listeners.set(type, set);
  }
  removeEventListener(type: string, listener: Listener): void {
    this.listeners.get(type)?.delete(listener);
  }
  terminate(): void {
    this.terminated++;
  }
  emit(type: string, fields: Record<string, unknown> = {}): void {
    const event = { type, ...fields } as unknown as Event;
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
  reply(response: AdviceResponse): void {
    this.emit('message', { data: response });
  }
  listenerCount(): number {
    return [...this.listeners.values()].reduce((n, set) => n + set.size, 0);
  }
}

function fakeClient(): { fake: FakeWorker; client: AdviceClient } {
  const fake = new FakeWorker();
  return { fake, client: new AdviceClient(fake as unknown as WorkerLike) };
}

async function rejection(promise: Promise<unknown>): Promise<Error> {
  try {
    await promise;
  } catch (error) {
    return error as Error;
  }
  throw new Error('expected a rejection');
}

describe('advice worker', () => {
  it('worker-hosted bot decisions equal the headless playtest for 50 hands', async () => {
    const client = clientOverChannel();
    let postflop = 0;
    for (let k = 1; k <= 50; k++) {
      const code = handReplayCode(7, k);
      let state = createHand({
        stakes: PLAYTEST_STAKES,
        seats: Array.from({ length: 6 }, (_, i) => ({ seat: i + 1, stack: CASH_BUY_IN })),
        button: 6,
        deck: shuffledDeck(code),
      });
      while (state.toAct !== null) {
        const view = playerView(state, state.toAct);
        if (view.street !== 'preflop') postflop++;
        const result = applyAction(
          state,
          await client.decideBot(view, 'TAG', botDecisionSeed(code, view)),
        );
        if (!result.ok) throw new Error(result.error.message);
        state = result.state;
      }
      const actions: Action[] = state.actions
        .filter((a) => a.type !== 'small-blind' && a.type !== 'big-blind')
        .map(toAction);
      expect(actions, `hand ${k}`).toEqual(playHand(code, 6, 6, k).record.actions);
    }
    expect(postflop).toBeGreaterThan(0);
    client.dispose();
  });

  it('client correlates replies and rejects on errors, worker failure and dispose', async () => {
    const { fake, client } = fakeClient();
    const view = { seat: 3 } as unknown as Parameters<AdviceClient['decideBot']>[0];
    const first = client.decideBot(view, 'TAG');
    const second = client.recommend(view);
    const third = client.grade(view, 'call');
    expect(fake.posted.map((r) => [r.id, r.kind])).toEqual([
      [1, 'bot'],
      [2, 'recommend'],
      [3, 'grade'],
    ]);
    const fold: Action = { seat: 3, type: 'fold' };
    fake.reply({ id: 99, ok: true, value: fold });
    fake.reply({ id: 2, ok: true, value: { seat: 3, type: 'check' } });
    fake.reply({ id: 1, ok: true, value: fold });
    expect(await second).toEqual({ seat: 3, type: 'check' });
    expect(await first).toEqual(fold);
    fake.reply({ id: 3, ok: false, error: { name: 'RangeError', message: 'call is not legal' } });
    const failed = await rejection(third);
    expect(failed.message).toBe('call is not legal');
    expect(failed.name).toBe('RangeError');

    for (const [type, fields, message] of [
      ['error', { message: 'script failed' }, 'Advice worker failed: script failed'],
      ['messageerror', {}, 'Advice worker failed: messageerror'],
    ] as const) {
      const broken = fakeClient();
      const pending = [broken.client.decideBot(view, 'TAG'), broken.client.recommend(view)];
      broken.fake.emit(type, fields);
      for (const p of pending) expect((await rejection(p)).message).toBe(message);
      expect((await rejection(broken.client.decideBot(view, 'TAG'))).message).toBe(message);
      expect(broken.fake.posted).toHaveLength(2);
    }

    const pending = client.decideBot(view, 'TAG');
    expect(fake.listenerCount()).toBe(3);
    client.dispose();
    client.dispose();
    expect(fake.terminated).toBe(1);
    expect(fake.listenerCount()).toBe(0);
    expect((await rejection(pending)).message).toBe('Advice client disposed');
    const postedBefore = fake.posted.length;
    expect((await rejection(client.recommend(view))).message).toBe('Advice client disposed');
    expect(fake.posted).toHaveLength(postedBefore);
  });

  it('every table shares one app-wide client whose worker is created once', () => {
    const fakes: FakeWorker[] = [];
    const create = (): WorkerLike => {
      const fake = new FakeWorker();
      fakes.push(fake);
      return fake as unknown as WorkerLike;
    };
    const first = sharedAdviceClient(create);
    expect(sharedAdviceClient(create)).toBe(first);
    expect(sharedAdviceClient()).toBe(first);
    expect(fakes).toHaveLength(1);
  });
});
