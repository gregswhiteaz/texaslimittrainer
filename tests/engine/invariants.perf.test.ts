// Real target: <= 2 µs of checker time per player action, enforced only by
//   INVARIANTS_MAX_US_PER_ACTION=2 npx vitest run tests/engine/invariants.perf.test.ts
// run with CI unset on the reference machine (Apple-silicon Mac, Node 22.18.0). Local `npm test`
// enforces only the slack floor below. CI (CI=true) prints the numbers but enforces no speed limit.
// Times are process CPU time (cpuNowMs in tests/support/speed.ts), so other busy processes do not inflate them.
import { describe, expect, it } from 'vitest';
import { checkStep, type Violation } from '../../src/engine/invariants';
import { randomMovePolicy, seatGenerator } from '../../src/playtest/policy';
import { runPlaytest, type ActionHook, type PolicyFactory } from '../../src/playtest/runner';
import { cpuNowMs, SPEED_LIMITS_NOT_ENFORCED, speedLimitsEnforced } from '../support/speed';

const HANDS = 10_000;
const MAX_US_PER_ACTION = Number(process.env.INVARIANTS_MAX_US_PER_ACTION ?? 10);
const ENFORCED = speedLimitsEnforced();
const EMPTY: readonly Violation[] = Object.freeze([]);
// Random moves, not the default TAG bots: bot equity work (TASK-7.8) would swamp the checker's cost in noise.
const makePolicy: PolicyFactory = (code, seat) => randomMovePolicy(seatGenerator(code, seat));

function timed(onAction: ActionHook) {
  const start = cpuNowMs();
  const summary = runPlaytest({ hands: HANDS, seed: 42, size: 6 }, undefined, {
    onAction,
    makePolicy,
  });
  return { ms: cpuNowMs() - start, summary };
}

describe('invariant checker performance', () => {
  it('checker overhead stays within the per-action budget', () => {
    runPlaytest({ hands: 1_000, seed: 42, size: 6 }, undefined, { makePolicy });
    runPlaytest({ hands: 1_000, seed: 42, size: 6 }, undefined, {
      onAction: () => EMPTY,
      makePolicy,
    });

    const unchecked = timed(() => EMPTY);
    const checked = timed(checkStep);
    const actions = checked.summary.playerActions;
    const usPerAction = ((checked.ms - unchecked.ms) * 1000) / actions;

    console.log(
      `invariant checker: ${usPerAction.toFixed(2)} µs/action over ${actions} actions ` +
        `(checked ${checked.ms.toFixed(0)} ms, unchecked ${unchecked.ms.toFixed(0)} ms)` +
        (ENFORCED ? '' : `; ${SPEED_LIMITS_NOT_ENFORCED}`),
    );
    expect(checked.summary.violations).toBe(0);
    expect(unchecked.summary.playerActions).toBe(actions);
    if (ENFORCED) expect(usPerAction).toBeLessThanOrEqual(MAX_US_PER_ACTION);
  }, 60_000);
});
