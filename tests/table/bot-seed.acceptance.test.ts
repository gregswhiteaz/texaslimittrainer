import { describe, expect, it } from 'vitest';
import { botDecisionIndex, botDecisionSeed } from '../../src/engine/bot-random';
import type { Action } from '../../src/engine/hand';
import {
  applyUserAction,
  botTurn,
  dealHand,
  nextStep,
  seatSession,
  stepBot,
  userActions,
  type BotTurn,
  type TableState,
} from '../../src/table/session';
import type { WorkerLike } from '../../src/ui/advice/advice-client';
import { requestBotDecision } from '../../src/ui/table/useTableSession';
import { SCENARIO_CODE } from '../support/table-scenarios';

const posted: unknown[] = [];
const fakeWorker: WorkerLike = {
  postMessage: (message: unknown) => posted.push(message),
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  terminate: () => undefined,
};

/** Posts `turn` through the app-wide client over the fake worker and returns the posted message. */
async function post(turn: BotTurn): Promise<Record<string, unknown>> {
  const before = posted.length;
  void requestBotDecision(() => fakeWorker, turn);
  await Promise.resolve();
  expect(posted).toHaveLength(before + 1);
  return posted[before] as Record<string, unknown>;
}

function userMove(t: TableState): Action {
  const options = userActions(t);
  return (options.find((a) => a.type === 'check') ??
    options.find((a) => a.type === 'call')) as Action;
}

describe('bot seed (TASK-6.18)', () => {
  it('the bot seed is derived on the main thread and the replay code never crosses', async () => {
    const code = SCENARIO_CODE;
    const words = code.match(/.{8}/g) as string[];
    expect(words).toHaveLength(4);

    let table = dealHand(seatSession(), code);
    expect(nextStep(table)).toBe('bot');
    const first = botTurn(table);
    expect(first.seed).toBe(botDecisionSeed(code, first.view));
    expect(Number.isInteger(first.seed)).toBe(true);
    expect(first.seed).toBeGreaterThanOrEqual(0);
    expect(first.seed).toBeLessThanOrEqual(0xffffffff);

    const message = await post(first);
    expect(Object.keys(message).sort()).toEqual(['id', 'kind', 'seed', 'style', 'view']);
    expect(message).toMatchObject({ kind: 'bot', seed: first.seed, style: first.style });
    const json = JSON.stringify(message);
    expect(json).not.toContain(code);
    for (const word of words) expect(json).not.toContain(word);

    // A later decision by a seat that already acted in this hand posts the seed for k + 1.
    const earlier = new Map<number, BotTurn>([[first.view.seat, first]]);
    table = stepBot(table);
    let pair: readonly [BotTurn, BotTurn] | null = null;
    while (pair === null && nextStep(table) !== 'done') {
      if (nextStep(table) === 'user') {
        table = applyUserAction(table, userMove(table));
      } else {
        const turn = botTurn(table);
        const before = earlier.get(turn.view.seat);
        if (before === undefined) {
          earlier.set(turn.view.seat, turn);
          table = stepBot(table);
        } else {
          pair = [before, turn];
        }
      }
    }
    if (pair === null) throw new Error('no bot acted twice');
    const [previous, again] = pair;
    expect(table.userDecisions.length).toBeGreaterThan(0);
    expect(botDecisionIndex(again.view)).toBe(botDecisionIndex(previous.view) + 1);
    expect(again.seed).toBe(botDecisionSeed(code, again.view));
    expect(again.seed).not.toBe(previous.seed);

    const later = await post(again);
    expect(later.seed).toBe(again.seed);
    const laterJson = JSON.stringify(later);
    for (const word of words) expect(laterJson).not.toContain(word);
  });
});
