import { describe, expect, it } from 'vitest';
import type { AdviceRequest, AdviceResponse } from '../../src/table/advice-service';
import { sharedAdviceClient, type WorkerLike } from '../../src/ui/advice/advice-client';
import { DEFAULT_SESSION_CONFIG, botTurn, dealHand, seatSession } from '../../src/table/session';
import { replayCodeFromWords } from '../../src/engine/deck';

// Its own file: sharedAdviceClient's module state must not leak into the locked advice-worker test (TASK-13.1).

type Listener = (event: Event) => void;

class FakeWorker {
  readonly posted: AdviceRequest[] = [];
  readonly listeners = new Map<string, Set<Listener>>();
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
  terminated = 0;
  terminate(): void {
    this.terminated++;
  }
  emit(type: string, fields: Record<string, unknown> = {}): void {
    const event = { type, ...fields } as unknown as Event;
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
}

describe('shared advice client recovery (TASK-13.1 D-5)', () => {
  it('a failed shared client is replaced by one fresh client and a healthy one is kept', async () => {
    const fakes: FakeWorker[] = [];
    const create = (): WorkerLike => {
      const fake = new FakeWorker();
      fakes.push(fake);
      return fake as unknown as WorkerLike;
    };

    const first = sharedAdviceClient(create);
    expect(sharedAdviceClient(create)).toBe(first);
    expect(sharedAdviceClient(create)).toBe(first);
    expect(fakes).toHaveLength(1);
    expect(first.failed).toBe(false);

    fakes[0]?.emit('error', { message: 'Injected worker failure' });
    expect(first.failed).toBe(true);
    expect(fakes[0]?.terminated).toBe(1);

    const second = sharedAdviceClient(create);
    expect(second).not.toBe(first);
    expect(second.failed).toBe(false);
    expect(fakes).toHaveLength(2);

    const table = dealHand(seatSession(DEFAULT_SESSION_CONFIG), replayCodeFromWords([1, 2, 3, 4]));
    const turn = botTurn(table);
    const decided = second.decideBot(turn.view, turn.style, turn.seed);
    const request = fakes[1]?.posted[0];
    expect(request?.kind).toBe('bot');
    const action = { type: 'fold', seat: turn.view.seat };
    const reply: AdviceResponse = {
      id: request?.id ?? 0,
      ok: true,
      value: action,
    } as AdviceResponse;
    fakes[1]?.emit('message', { data: reply });
    await expect(decided).resolves.toEqual(action);

    expect(sharedAdviceClient(create)).toBe(second);
    expect(sharedAdviceClient(create)).toBe(second);
    expect(fakes).toHaveLength(2);
  });
});
