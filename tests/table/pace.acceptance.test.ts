import { describe, expect, it, vi } from 'vitest';
import { replayCodeFromWords } from '../../src/engine/deck';
import { legalActions, type Action } from '../../src/engine/hand';
import {
  applyUserAction,
  botActionDelayMs,
  dealHand,
  NEXT_HAND_DELAY_MS,
  nextHand,
  nextHandDelay,
  nextStep,
  seatSession,
  stepBot,
  type TableState,
} from '../../src/table/session';

vi.setConfig({ testTimeout: 30_000 });

const HANDS = 200;
const HOUR_MS = 3_600_000;
/** REQ-011.1: the most a bot may take per action at Rapid (A-7 worst case). */
const RAPID_BOT_BUDGET_MS = 300;

/** The scripted user (A-2): Fold when it is legal, otherwise Check. */
function foldElseCheck(table: TableState): Action {
  const actions = table.hand === null ? [] : legalActions(table.hand);
  const pick = actions.find((a) => a.type === 'fold') ?? actions.find((a) => a.type === 'check');
  if (pick === undefined) throw new Error('Neither fold nor check is legal');
  return pick;
}

describe('Rapid hands per hour', () => {
  it('200 rapid hands with a folding user fit in 60 minutes including the 1.5 s between hands', () => {
    let t = seatSession();
    expect(t.config.speed).toBe('rapid');
    let scheduled = 0;
    let botActions = 0;
    let done = 0;
    const delays: (number | null)[] = [];
    for (let i = 1; i <= HANDS; i++) {
      const code = replayCodeFromWords([0x9e3779b9, 1, 2, i]);
      t = dealHand(i === 1 ? t : nextHand(t), code);
      for (let step = nextStep(t); step !== 'done'; step = nextStep(t)) {
        if (step === 'bot') {
          t = stepBot(t);
          botActions += 1;
          scheduled += botActionDelayMs(t.config.speed);
        } else {
          t = applyUserAction(t, foldElseCheck(t));
        }
      }
      done += 1;
      const delay = nextHandDelay(t, false);
      delays.push(delay);
      scheduled += delay ?? 0;
    }

    expect(done).toBe(HANDS);
    expect(delays.every((d) => d === 1500)).toBe(true);
    expect(scheduled).toBe(HANDS * NEXT_HAND_DELAY_MS);
    expect(scheduled).toBe(300_000);
    expect(botActions).toBeGreaterThan(0);
    const worstCase = scheduled + RAPID_BOT_BUDGET_MS * botActions;
    expect(worstCase).toBeLessThan(HOUR_MS);
    expect((HANDS * HOUR_MS) / worstCase).toBeGreaterThanOrEqual(200);
  });
});
