import type { ReplayCode } from '../../src/engine/deck';
import { legalActions, type Action, type HandState } from '../../src/engine/hand';
import { checkState } from '../../src/engine/invariants';
import {
  applyUserAction,
  dealHand,
  nextHand,
  nextStep,
  rebuy,
  stepBot,
  type TableState,
} from '../../src/table/session';

// Headless helpers that play whole hands (TASK-2.6). No test-runner imports: they throw on failure, so both
// Vitest tests and e2e seeding can use them.

/** The user checks when it can, else calls (else takes the first legal action). */
export function checkOrCall(hand: HandState): Action {
  const legal = legalActions(hand);
  return (
    legal.find((a) => a.type === 'check') ??
    legal.find((a) => a.type === 'call') ??
    (legal[0] as Action)
  );
}

/** Deals `table`'s next hand with `code` and plays it to the end: bots by their style, the user by
 *  checkOrCall. Throws if an engine invariant breaks or the hand does not finish. */
export function playHand(table: TableState, code: ReplayCode): TableState {
  let t = dealHand(table, code);
  for (let guard = 0; guard < 500; guard++) {
    const hand = t.hand as HandState;
    const broken = checkState(hand);
    if (broken.length > 0) throw new Error(`Invariant broken: ${JSON.stringify(broken)}`);
    const step = nextStep(t);
    if (step === 'done') return t;
    t = step === 'bot' ? stepBot(t) : applyUserAction(t, checkOrCall(hand));
  }
  throw new Error('Hand did not finish');
}

/** Plays `hands` hands from `table` (ready to deal), hand n with `codeFor(n)`, rebuying a busted user
 *  before the deal. Returns each completed hand's table, in order. */
export function playSession(
  table: TableState,
  hands: number,
  codeFor: (hand: number) => ReplayCode,
): TableState[] {
  const played: TableState[] = [];
  let next = table;
  for (let i = 0; i < hands; i++) {
    if (nextStep(next) === 'rebuy') next = rebuy(next);
    const done = playHand(next, codeFor(next.handNumber));
    played.push(done);
    next = nextHand(done);
  }
  return played;
}
