import { MessageChannel, type MessagePort } from 'node:worker_threads';
import { afterEach, describe, expect, it } from 'vitest';
import { recommend, userAdviceOptions } from '../../src/advice/recommend';
import type { HandState } from '../../src/engine/hand';
import { playerView } from '../../src/engine/player-view';
import { requestHint } from '../../src/table/hint';
import { userObservedSnapshot, type ObservedCounts } from '../../src/table/session';
import { AdviceClient, type WorkerLike } from '../../src/ui/advice/advice-client';
import { installAdviceWorker, type WorkerScope } from '../../src/ui/advice/worker-host';
import { FLOP_BET, PREFLOP, observedStyle } from '../support/table-scenarios';

const ports: MessagePort[] = [];
afterEach(() => {
  for (const port of ports.splice(0)) port.close();
});

/** installAdviceWorker on one port and an AdviceClient on the other (real structured clone); every message
 *  the client posts is recorded. */
function clientOverChannel(): { client: AdviceClient; posted: unknown[] } {
  const { port1, port2 } = new MessageChannel();
  ports.push(port1, port2);
  installAdviceWorker(port1 as unknown as WorkerScope);
  port1.start();
  const posted: unknown[] = [];
  const worker = {
    postMessage: (message: unknown) => {
      posted.push(structuredClone(message));
      port2.postMessage(message);
    },
    addEventListener: (type: string, listener: EventListener) =>
      port2.addEventListener(type, listener),
    removeEventListener: (type: string, listener: EventListener) =>
      port2.removeEventListener(type, listener),
    terminate: () => port2.close(),
  } as unknown as WorkerLike;
  const client = new AdviceClient(worker);
  port2.start();
  return { client, posted };
}

const COUNTS: ObservedCounts = { 2: observedStyle(45, 27, 9), 5: observedStyle(12, 3, 1) };

describe('hint worker (AC#9)', () => {
  it('hint requests go to the advice worker with the snapshot', async () => {
    const { client, posted } = clientOverChannel();
    const view = playerView(FLOP_BET.hand as HandState, FLOP_BET.config.userSeat);
    const observed = userObservedSnapshot(FLOP_BET, COUNTS);
    expect(observed.map((o) => [o.seat, o.hands])).toEqual([
      [2, 45],
      [6, 12],
    ]);

    const rec = await requestHint(client, FLOP_BET, COUNTS);
    expect(posted).toEqual([{ id: 1, kind: 'recommend', view, observed }]);
    expect(rec).toEqual(recommend(view, userAdviceOptions(observed)));

    await expect(requestHint(client, PREFLOP, COUNTS)).rejects.toThrow(
      new RangeError("Not the user's turn"),
    );
    expect(posted).toHaveLength(1);

    // Without a snapshot the request carries no observed key at all (D-4).
    expect(await client.recommend(view)).toEqual(recommend(view, userAdviceOptions()));
    expect(Object.keys(posted[1] as object)).toEqual(['id', 'kind', 'view']);
    client.dispose();
  }, 60_000);
});
