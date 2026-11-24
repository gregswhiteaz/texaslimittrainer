import { describe, expect, it } from 'vitest';
import type { Action } from '../../src/engine/hand';
import { describeAction } from '../../src/engine/invariants';
import { userAdvice, type AdviseFn } from '../../src/playtest/advice-check';
import { main, parseArgs, USAGE } from '../../src/playtest/cli';
import { handReplayCode, runPlaytest } from '../../src/playtest/runner';
import { STYLE_BANDS } from '../../src/playtest/style-check';

const SLOW = process.env.TLH_SLOW_TESTS === '1';
// Each 100-hand run takes seconds plain; coverage instrumentation in `npm test` makes the advice 6-9x slower.
const FAST_TIMEOUT_MS = 300_000;
const SLOW_TIMEOUT_MS = 1_200_000;
const ADVICE_LINE = /^Advice check: (\d+) decision points, (\d+) mismatches$/;

function capture(argv: string[], advise?: AdviseFn) {
  let out = '';
  let err = '';
  const io = { out: (t: string) => (out += t), err: (t: string) => (err += t) };
  const code = main(argv, io, {}, STYLE_BANDS, advise);
  return { code, out, err, lines: out.split('\n') };
}

/** Plain runs shared between tests; the byte-identity check still does a fresh second run. */
const shared = new Map<string, ReturnType<typeof capture>>();
function sharedCapture(argv: string[]) {
  const key = argv.join(' ');
  let run = shared.get(key);
  if (run === undefined) {
    run = capture(argv);
    shared.set(key, run);
  }
  return run;
}

const checkArgv = (hands: number) => ['--hands', String(hands), '--seed', '42', '--check-advice'];

/** Total player actions (every seat) of the plain run. */
function playerActions(hands: number): number {
  let total = 0;
  runPlaytest({ hands, seed: 42, size: 6 }, (hand) => (total += hand.record.actions.length));
  return total;
}

function expectCleanCheck(hands: number, minimum: number) {
  const { code, lines, err } = sharedCapture(checkArgv(hands));
  expect(err).toBe('');
  expect(code).toBe(0);
  expect(lines.find((line) => line.startsWith('Options: '))).toBe(
    `Options: --hands ${hands} --seed 42 --size 6 --check-advice`,
  );
  expect(lines).toContain('Invariant violations: 0');
  const matches = lines.flatMap((line) => {
    const m = ADVICE_LINE.exec(line);
    return m === null ? [] : [m];
  });
  expect(matches).toHaveLength(1);
  const [, decisions, mismatches] = matches[0] as RegExpExecArray;
  expect(mismatches).toBe('0');
  expect(Number(decisions)).toBeGreaterThanOrEqual(minimum);
  expect(Number(decisions)).toBe(playerActions(hands));
  expect(lines.some((line) => line.startsWith('First advice mismatch'))).toBe(false);
}

function expectIdentical(argv: string[]) {
  const first = sharedCapture(argv);
  const second = capture(argv);
  expect(second.out === first.out).toBe(true);
  expect(second.code).toBe(first.code);
}

/** Appends ` #<call count>` to the explanation of every view `varies` accepts. */
function suffixing(varies: (street: string) => boolean): AdviseFn {
  let calls = 0;
  return (view, observed) => {
    calls++;
    const rec = userAdvice(view, observed);
    return varies(view.street) ? { ...rec, explanation: `${rec.explanation} #${calls}` } : rec;
  };
}

describe('--check-advice acceptance', () => {
  it(
    'AC#1 check-advice recomputes every decision point with 0 mismatches',
    () => expectCleanCheck(100, 500),
    FAST_TIMEOUT_MS,
  );
  it.runIf(SLOW)(
    'AC#1 check-advice recomputes every decision point with 0 mismatches (10,000 hands)',
    () => expectCleanCheck(10_000, 10_000),
    SLOW_TIMEOUT_MS,
  );

  it(
    'AC#2 varying advice prints the first mismatch and exits non-zero',
    () => {
      const code1 = handReplayCode(42, 1);
      const every = capture(
        ['--hands', '20', '--seed', '42', '--check-advice'],
        suffixing(() => true),
      );
      expect(every.code).toBe(1);
      const firstLine = every.lines.find((line) => line.startsWith('First advice mismatch: '));
      expect(
        firstLine?.startsWith(
          `First advice mismatch: hand 1, replay code ${code1}, player action 1 (`,
        ),
      ).toBe(true);
      expect(firstLine?.endsWith('), recommendation.explanation differs')).toBe(true);
      expect(every.out).toContain(`Replay: npm run playtest -- --replay-code ${code1}`);
      const counts = every.lines.map((line) => ADVICE_LINE.exec(line)).find((m) => m !== null);
      expect(Number(counts?.[2])).toBeGreaterThanOrEqual(1);
      const byInvariant = every.lines.find((line) => line.startsWith('Violations by invariant: '));
      expect(byInvariant).toMatch(/, advice-determinism [1-9]\d*$/);

      // The run's first postflop decision, found independently.
      let hand = 1;
      let actionNumber = 0;
      let found: { hand: number; actionNumber: number; action: Action } | null = null;
      runPlaytest(
        { hands: 20, seed: 42, size: 6 },
        () => {
          hand++;
          actionNumber = 0;
        },
        {
          onAction: (step, view) => {
            actionNumber++;
            if (found === null && view?.street !== 'preflop') {
              found = { hand, actionNumber, action: step.action };
            }
            return [];
          },
        },
      );
      if (found === null) throw new Error('No postflop decision in 20 hands');
      const expected = found as { hand: number; actionNumber: number; action: Action };
      const postflop = capture(
        ['--hands', '20', '--seed', '42', '--check-advice'],
        suffixing((street) => street !== 'preflop'),
      );
      expect(postflop.code).toBe(1);
      expect(postflop.lines).toContain(
        `First advice mismatch: hand ${expected.hand}, replay code ${handReplayCode(42, expected.hand)}, player action ${expected.actionNumber} (${describeAction(expected.action)}), recommendation.explanation differs`,
      );
      expect(postflop.lines).toContain(
        `First violation: hand ${expected.hand}, player action ${expected.actionNumber} (${describeAction(expected.action)})`,
      );
    },
    FAST_TIMEOUT_MS,
  );

  it(
    'AC#5 check-advice output is byte-identical across runs',
    () => {
      expectIdentical([
        '--hands',
        '100',
        '--seed',
        '42',
        '--lineup',
        'mixed',
        '--check-styles',
        '--check-advice',
      ]);
    },
    FAST_TIMEOUT_MS,
  );
  it.runIf(SLOW)(
    'AC#5 check-advice output is byte-identical across runs (10,000 hands)',
    () => expectIdentical(checkArgv(10_000)),
    SLOW_TIMEOUT_MS,
  );

  it(
    'check-advice flag parsing and unchanged default output',
    () => {
      expect(parseArgs(['--check-advice'])).toEqual({
        kind: 'run',
        options: { hands: 10000, seed: 42, size: 6, game: 'cash' },
        checkAdvice: true,
      });
      expect(parseArgs(['--check-styles', '--check-advice', '--lineup', 'soft'])).toEqual({
        kind: 'run',
        options: { hands: 10000, seed: 42, size: 6, game: 'cash', lineUp: 'Soft' },
        checkStyles: true,
        checkAdvice: true,
      });
      const code = handReplayCode(42, 1);
      for (const [argv, message] of [
        [['--check-advice', '--check-advice'], 'Error: --check-advice given more than once.'],
        [
          ['--replay-code', code, '--check-advice'],
          'Error: --check-advice is only valid without --replay-code.',
        ],
        [['--help', '--check-advice'], 'Error: --help cannot be combined with other options.'],
        [['--check-advice', '--help'], 'Error: --help cannot be combined with other options.'],
      ] as const) {
        expect(capture([...argv])).toEqual({
          code: 2,
          out: '',
          err: `${message}\n${USAGE}`,
          lines: [''],
        });
      }
      expect(capture(['--help']).out).toBe(USAGE);
      expect(USAGE.split('\n')[0]?.endsWith(' [--check-styles] [--check-advice]')).toBe(true);
      expect(USAGE).toContain(
        '\n--check-advice: recompute the advice and grade at every decision point and exit 1 if any recomputation differs from the first\n',
      );

      const plain = capture(['--hands', '100', '--seed', '42']);
      const checked = sharedCapture(checkArgv(100));
      expect(plain.code).toBe(0);
      expect(plain.out).not.toContain('Advice check');
      expect(plain.lines).toContain('Options: --hands 100 --seed 42 --size 6');
      const stripped = checked.lines
        .filter((line) => !ADVICE_LINE.test(line))
        .map((line) =>
          line.startsWith('Options: ') ? line.replace(/ --check-advice$/, '') : line,
        );
      expect(stripped.join('\n')).toBe(plain.out);
    },
    FAST_TIMEOUT_MS,
  );
});
