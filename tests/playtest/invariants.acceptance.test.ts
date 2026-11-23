import { describe, expect, it } from 'vitest';
import {
  checkState,
  checkStep,
  describeAction,
  INVARIANTS,
  type ActionStep,
} from '../../src/engine/invariants';
import { formatHand, main } from '../../src/playtest/cli';
import {
  runPlaytest,
  type ActionHook,
  type PlayedHand,
  type PlaytestSeams,
} from '../../src/playtest/runner';
import { FAULTS } from '../support/faulty-engine';

const SLOW = process.env.TLH_SLOW_TESTS === '1';
const TEST_TIMEOUT_MS = 120_000;

function capture(argv: string[], seams?: PlaytestSeams) {
  let out = '';
  let err = '';
  const code = main(argv, { out: (t) => (out += t), err: (t) => (err += t) }, seams);
  return { code, out, err };
}

const lineValue = (text: string, label: string) =>
  text
    .split('\n')
    .find((line) => line.startsWith(`${label}: `))
    ?.slice(label.length + 2);

/** The `Violations by invariant:` line as [id, count] pairs, in printed order. */
function countsOf(out: string): [string, number][] {
  const line = lineValue(out, 'Violations by invariant') ?? '';
  return line.split(', ').map((entry) => {
    const [id = '', count = ''] = entry.split(' ');
    return [id, Number(count)];
  });
}

const REPORT_LABELS = [
  'Options',
  'Table',
  'Hands played',
  'Ended by fold',
  'Ended at showdown',
  'Player actions',
  'Streets capped at 4 bets',
  'Largest pot',
  'First replay code',
  'Last replay code',
  'Invariant violations',
];

/** Each hook call starts a new hand when `before` holds only the blinds. */
const isFirstAction = (step: ActionStep) => step.before.actions.length === 2;

// The 10,000-hand run is opt-in (TLH_SLOW_TESTS=1); every push runs the same checks with 1,000 hands.
const RUNS = [
  { hands: 10_000, test: it.runIf(SLOW), suffix: '' },
  { hands: 1_000, test: it, suffix: ' (1,000-hand clean run)' },
];

describe('invariant checks in the playtest', () => {
  for (const { hands, test, suffix } of RUNS) {
    test(
      `AC#1 every applied action is checked and a clean run has zero violations${suffix}`,
      () => {
        for (let size = 3; size <= 10; size++) {
          let calls = 0;
          let mismatches = 0;
          let previous: ActionStep | null = null;
          const spy: ActionHook = (step) => {
            calls++;
            const chosenIn =
              previous === null
                ? isFirstAction(step)
                : previous.result.ok && step.before === previous.result.state;
            if (
              !chosenIn ||
              step.action.seat !== step.before.toAct ||
              !step.result.ok ||
              checkState(step.result.state).length > 0
            ) {
              mismatches++;
            }
            previous = step;
            return checkStep(step);
          };
          const summary = runPlaytest(
            { hands: 500, seed: 8, size },
            () => {
              previous = null;
            },
            { onAction: spy },
          );
          expect(calls, `size ${size}`).toBe(summary.playerActions);
          expect(mismatches, `size ${size}`).toBe(0);
          expect(summary.violations, `size ${size}`).toBe(0);
          expect(summary.firstViolation).toBeNull();
          expect(Object.keys(summary.violationCounts)).toEqual(INVARIANTS);
          expect(Object.values(summary.violationCounts).every((n) => n === 0)).toBe(true);
        }

        const big = runPlaytest({ hands, seed: 42, size: 6 });
        expect(big.handsPlayed).toBe(hands);
        expect(big.violations).toBe(0);
      },
      TEST_TIMEOUT_MS,
    );
  }

  it(
    'AC#2 each injected engine fault is reported as its invariant',
    () => {
      const argv = ['--hands', '20', '--seed', '42', '--size', '6'];
      for (const [name, fault] of Object.entries(FAULTS)) {
        const run = capture(argv, fault.seams);
        expect(run.code, name).toBe(1);
        const counts = countsOf(run.out);
        expect(
          counts.map(([id]) => id),
          name,
        ).toEqual(INVARIANTS);
        for (const [id, count] of counts) {
          if (id === fault.invariant) expect(count, name).toBeGreaterThanOrEqual(1);
          else expect(count, `${name}: ${id}`).toBe(0);
        }
        const total = counts.reduce((sum, [, count]) => sum + count, 0);
        expect(lineValue(run.out, 'Invariant violations'), name).toBe(String(total));
      }

      for (const fault of [FAULTS.chipsCreated, FAULTS.ineligibleWinner, FAULTS.duplicateCard]) {
        expect(fault.seams).not.toHaveProperty('makePolicy');
      }
      const control = capture(argv);
      expect(control.code).toBe(0);
      expect(control.out).toContain('Invariant violations: 0\n');
      expect(control.out).not.toContain('Violations by invariant:');
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'AC#3 a violation prints the replay code and full action history and exits 1',
    () => {
      const seams = FAULTS.fifthBet.seams;
      const run = capture(['--hands', '5', '--seed', '1', '--size', '3'], seams);
      expect(run.code).toBe(1);
      const summary = runPlaytest({ hands: 5, seed: 1, size: 3 }, undefined, seams);
      const first = summary.firstViolation as PlayedHand;
      const violation = first.violation;
      expect(violation).not.toBeNull();
      if (violation === null) return;

      const lines = run.out.split('\n');
      const labels = lines
        .map((line) => line.slice(0, line.indexOf(': ')))
        .filter((label) => REPORT_LABELS.includes(label));
      expect(labels).toEqual(REPORT_LABELS);
      const end = lines.indexOf(`Invariant violations: ${summary.violations}`);
      expect(end).toBeGreaterThan(0);
      expect(
        lines
          .slice(1, end + 1)
          .every((line) => REPORT_LABELS.some((l) => line.startsWith(`${l}: `))),
      ).toBe(true);
      const { replayCode, button } = first.record;
      const block =
        [
          lines[end + 1],
          `First violation: hand ${first.number}, player action ${violation.actionNumber} (${describeAction(violation.action)})`,
          `Violation: bet-cap: ${first.final.street} has 5 bets (at most 4)`,
          `Replay: npm run playtest -- --replay-code ${replayCode} --size 3 --button ${button}`,
        ].join('\n') +
        '\n' +
        formatHand(first);
      expect(lines[end + 1]).toMatch(/^Violations by invariant: /);
      expect(run.out.endsWith(`Invariant violations: ${summary.violations}\n${block}`)).toBe(true);

      const history = formatHand(first)
        .split('\n')
        .filter((line) => /^(Preflop|Flop|Turn|River): /.test(line))
        .flatMap((line) => line.slice(line.indexOf(': ') + 2).split(', '));
      expect(history).toHaveLength(first.final.actions.length);
      expect(history.at(-1)).toBe(
        `seat ${violation.action.seat} raises to $${first.final.actions.at(-1)?.amount}`,
      );
      expect(first.final.actions.at(-1)).toMatchObject(violation.action);

      const replay = capture(
        ['--replay-code', '000000000000002a0000000000000004', '--size', '6', '--button', '4'],
        FAULTS.illegalAccepted.seams,
      );
      expect(replay.code).toBe(1);
      expect(replay.out.match(/^Hand \d+: /gm)).toHaveLength(1);
      const tail = replay.out.slice(replay.out.indexOf('Invariant violations: 1\n'));
      expect(replay.out.indexOf('Hand 1: ')).toBeLessThan(replay.out.indexOf('Hands played: '));
      expect(tail.split('\n').slice(1, -1)).toEqual([
        'Violations by invariant: chips 0, legal-action 1, bet-cap 0, pot-eligibility 0, cards 0',
        'First violation: hand 1, player action 1 (seat 1 checks)',
        'Violation: legal-action: seat 1 checks is not in the legal set',
      ]);
      expect(replay.out).not.toContain('Replay:');
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'AC#5 the per-action hook reports a violation with formatHand and exit 1',
    () => {
      const probe = (): ActionHook => {
        let hand = 0;
        let action = 0;
        return (step) => {
          if (isFirstAction(step)) {
            hand++;
            action = 0;
          }
          action++;
          const found = checkStep(step);
          return hand === 2 && action === 3
            ? [...found, { invariant: 'test-probe', message: 'probe fired' }]
            : found;
        };
      };
      const argv = ['--hands', '4', '--seed', '42', '--size', '6'];
      const run = capture(argv, { onAction: probe() });
      expect(run.code).toBe(1);
      expect(run.out).toContain('Invariant violations: 1\n');
      expect(run.out).toContain('Hands played: 4\n');
      expect(lineValue(run.out, 'Violations by invariant')?.endsWith('cards 0, test-probe 1')).toBe(
        true,
      );
      expect(run.out).toMatch(/^First violation: hand 2, player action 3 \(seat \d+ .+\)$/m);
      expect(run.out).toContain('Violation: test-probe: probe fired\n');

      const played: PlayedHand[] = [];
      const summary = runPlaytest({ hands: 4, seed: 42, size: 6 }, (h) => played.push(h), {
        onAction: probe(),
      });
      const second = played[1] as PlayedHand;
      expect(summary.firstViolation).toBe(second);
      expect(second.final.actions).toHaveLength(5);
      expect(run.out.endsWith(formatHand(second))).toBe(true);
    },
    TEST_TIMEOUT_MS,
  );
});
