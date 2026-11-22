import { spawnSync } from 'node:child_process';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { checkStep } from '../../src/engine/invariants';
import { formatReport, main } from '../../src/playtest/cli';
import {
  runPlaytest,
  type ActionHook,
  type PlayedHand,
  type PlaytestOptions,
  type PlaytestSeams,
} from '../../src/playtest/runner';
import { formatBotResults, winRate } from '../../src/playtest/winrate';
import { REPO_ROOT, sandboxEnv } from '../support/sandbox';

const TEST_TIMEOUT_MS = 120_000;
const CASH_HEADER =
  'Bot results: BB/100 = big bets won per 100 hands (big bet $8), with 95% confidence interval';
const ROW =
  /^Bot: (.+), (TAG|Random|Calling station|Maniac|Rock), seat (\d+), (\d+) hands, (-?\d+\.\d\d) BB\/100, 95% CI (?:(-?\d+\.\d\d) to (-?\d+\.\d\d)|n\/a)$/;

interface Row {
  name: string;
  style: string;
  seat: number;
  hands: number;
  bb: number;
  lower: number | null;
  upper: number | null;
}

function capture(argv: string[], seams?: PlaytestSeams) {
  let out = '';
  let err = '';
  const code = main(argv, { out: (t) => (out += t), err: (t) => (err += t) }, seams);
  return { code, out, err };
}

const botLines = (out: string) => out.split('\n').filter((line) => line.startsWith('Bot: '));

function rows(out: string): Row[] {
  return botLines(out).map((line) => {
    const m = ROW.exec(line);
    expect(m, line).not.toBeNull();
    const [, name, style, seat, hands, bb, lower, upper] = m as RegExpExecArray;
    return {
      name: name as string,
      style: style as string,
      seat: Number(seat),
      hands: Number(hands),
      bb: Number(bb),
      lower: lower === undefined ? null : Number(lower),
      upper: upper === undefined ? null : Number(upper),
    };
  });
}

/** The output without the `Bot results` and `Bot:` lines. */
const withoutBlock = (out: string) =>
  out
    .split('\n')
    .filter((line) => !line.startsWith('Bot results: ') && !line.startsWith('Bot: '))
    .join('\n');

/** checkStep, plus a 'test' violation on the first player action of hand `target` (counted from 1). */
function flagFirstActionOfHand(target: number): ActionHook {
  let hand = 0;
  return (step) => {
    const playerActions = step.before.actions.filter(
      (a) => a.type !== 'small-blind' && a.type !== 'big-blind',
    );
    if (playerActions.length === 0) hand++;
    return hand === target && playerActions.length === 0
      ? [{ invariant: 'test', message: 'flagged' }]
      : checkStep(step);
  };
}

/** Two-pass mean and sample SD. */
function direct(results: readonly number[]) {
  const n = results.length;
  const m = results.reduce((s, x) => s + x, 0) / n;
  const s = Math.sqrt(results.reduce((acc, x) => acc + (x - m) ** 2, 0) / (n - 1));
  return { m, s, n };
}

describe('per-bot BB/100 with a 95% confidence interval', () => {
  it(
    "every playtest run prints each bot's name, style, hands, BB/100 and 95% interval",
    () => {
      const run = capture(['--hands', '2000', '--seed', '42']);
      expect(run.code).toBe(0);
      const lines = run.out.split('\n');
      const block = lines.indexOf(CASH_HEADER);
      expect(block).toBeGreaterThan(lines.findIndex((l) => l.startsWith('Table: ')));
      expect(lines[block + 7]).toBe('Hands played: 2000');
      const pattern =
        /^Bot: Seat (\d+), TAG, seat \1, 2000 hands, -?\d+\.\d\d BB\/100, 95% CI -?\d+\.\d\d to -?\d+\.\d\d$/;
      const found = rows(run.out);
      expect(found.map((r) => r.seat)).toEqual([1, 2, 3, 4, 5, 6]);
      for (let i = 1; i <= 6; i++) expect(lines[block + i]).toMatch(pattern);
      for (const r of found) {
        expect(r.lower as number).toBeLessThanOrEqual(r.bb);
        expect(r.bb).toBeLessThanOrEqual(r.upper as number);
      }
      expect(Math.abs(found.reduce((s, r) => s + r.bb, 0))).toBeLessThanOrEqual(0.03);

      const nine = spawnSync(
        'npm',
        ['run', '-s', 'playtest', '--', '--hands', '500', '--seed', '9', '--size', '9'],
        { cwd: REPO_ROOT, env: sandboxEnv(), encoding: 'utf8', timeout: TEST_TIMEOUT_MS },
      );
      expect(nine.status).toBe(0);
      expect(nine.stdout).toContain(`${CASH_HEADER}\n`);
      expect(rows(nine.stdout).map((r) => [r.name, r.style, r.seat])).toEqual(
        Array.from({ length: 9 }, (_, i) => [`Seat ${i + 1}`, 'TAG', i + 1]),
      );

      const tough = capture([
        '--hands',
        '1000',
        '--seed',
        '42',
        '--lineup',
        'tough',
        '--size',
        '6',
      ]);
      expect(tough.code).toBe(0);
      const toughRows = rows(tough.out);
      expect(toughRows[0]).toMatchObject({ name: 'User', style: 'TAG', seat: 1, hands: 1000 });
      const lineUp = tough.out.split('\n').find((l) => l.startsWith('Line-up: ')) as string;
      for (const [, seat, name, style] of lineUp.matchAll(/seat (\d+) (\w+) \(([^)]+)\)/g)) {
        expect(toughRows).toContainEqual(
          expect.objectContaining({ seat: Number(seat), name, style }),
        );
      }

      const sng = capture(['--game', 'sng', '--hands', '1000']);
      expect(sng.code).toBe(0);
      expect(sng.out).toContain(
        'Bot results: BB/100 = big bets won per 100 hands (big bet 40 chips), with 95% confidence interval\n',
      );
      expect(rows(sng.out)).toHaveLength(6);
    },
    TEST_TIMEOUT_MS,
  );

  it('a bot that won $80 over 100 hands at $4/$8 wins 10.00 BB/100', () => {
    const rate = winRate([80, ...Array<number>(99).fill(0)], 8);
    expect(rate.hands).toBe(100);
    expect(Math.abs(rate.bbPer100 - 10)).toBeLessThanOrEqual(1e-9);
    const text = formatBotResults([{ seat: 2, name: 'Ava', style: 'TAG', rate }], 'cash');
    expect(text).toContain(', 100 hands, 10.00 BB/100, 95% CI -9.60 to 29.60\n');
  });

  it('the 95% interval is mean ± 1.96 × sample SD / √n in BB/100', () => {
    const rate = winRate([8, -4, 0, 16, -8], 8);
    expect(Math.abs(rate.bbPer100 - 30)).toBeLessThanOrEqual(0.005);
    expect(Math.abs((rate.lower as number) + 75.55)).toBeLessThanOrEqual(0.01);
    expect(Math.abs((rate.upper as number) - 135.55)).toBeLessThanOrEqual(0.01);
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: -864, max: 864 }), { minLength: 2, maxLength: 200 }),
        fc.constantFrom(8, 40),
        (results, bb) => {
          const { m, s, n } = direct(results);
          const got = winRate(results, bb);
          const half = (1.96 * s) / Math.sqrt(n);
          expect(got.hands).toBe(n);
          expect(Math.abs(got.bbPer100 - (m / bb) * 100)).toBeLessThanOrEqual(0.005);
          expect(Math.abs((got.lower as number) - ((m - half) / bb) * 100)).toBeLessThanOrEqual(
            0.005,
          );
          expect(Math.abs((got.upper as number) - ((m + half) / bb) * 100)).toBeLessThanOrEqual(
            0.005,
          );
        },
      ),
    );
  });

  it(
    'a busted bot and its replacement appear as separate rows with their own hands',
    () => {
      const argv = ['--hands', '2000', '--seed', '42', '--lineup', 'mixed'];
      const run = capture(argv);
      expect(run.code).toBe(0);
      const replaced = Number(/^Bots replaced: (\d+)$/m.exec(run.out)?.[1]);
      expect(replaced).toBeGreaterThan(0);

      const results = new Map<
        string,
        { seat: number; name: string; style: string; xs: number[] }
      >();
      const departures: { seat: number; before: string; after: string }[] = [];
      let previous: PlayedHand | undefined;
      runPlaytest({ hands: 2000, seed: 42, size: 6, lineUp: 'Mixed' }, (hand) => {
        for (const seat of hand.replaced ?? []) {
          departures.push({
            seat,
            before: String(previous?.lineUp?.[seat - 1]?.name),
            after: String(hand.lineUp?.[seat - 1]?.name),
          });
        }
        previous = hand;
        if (hand.final.result === null) return;
        for (const p of hand.final.players) {
          const s = hand.lineUp?.[p.seat - 1];
          const name = s?.kind === 'user' ? 'User' : String(s?.name);
          const style = s?.kind === 'user' ? 'TAG' : String(s?.style);
          const key = `${p.seat}|${name}|${style}`;
          const entry = results.get(key) ?? { seat: p.seat, name, style, xs: [] };
          entry.xs.push(p.stack - p.startingStack);
          results.set(key, entry);
        }
      });
      expect(departures).toHaveLength(replaced);

      // Rows by seat, then first hand (Map insertion order is first-hand order; sort is stable).
      const expected = [...results.values()]
        .sort((a, b) => a.seat - b.seat)
        .map(({ seat, name, style, xs }) => {
          const rate = winRate(xs, 8);
          const f = (v: number) => (v.toFixed(2) === '-0.00' ? '0.00' : v.toFixed(2));
          const ci = rate.lower === null ? 'n/a' : `${f(rate.lower)} to ${f(rate.upper as number)}`;
          return `Bot: ${name}, ${style}, seat ${seat}, ${xs.length} hands, ${f(rate.bbPer100)} BB/100, 95% CI ${ci}`;
        });
      expect(botLines(run.out)).toEqual(expected);

      const found = rows(run.out);
      for (const { seat, before, after } of departures) {
        expect(found.some((r) => r.seat === seat && r.name === before)).toBe(true);
        expect(found.some((r) => r.seat === seat && r.name === after)).toBe(true);
      }
      for (let seat = 1; seat <= 6; seat++) {
        const total = found.filter((r) => r.seat === seat).reduce((s, r) => s + r.hands, 0);
        expect(total).toBe(2000);
      }
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'the bot block leaves every other report line unchanged and output deterministic',
    () => {
      const cases: [string[], PlaytestOptions, string | undefined][] = [
        [['--hands', '2000', '--seed', '42'], { hands: 2000, seed: 42, size: 6 }, undefined],
        [
          ['--hands', '2000', '--seed', '42', '--lineup', 'mixed'],
          { hands: 2000, seed: 42, size: 6, lineUp: 'Mixed' },
          'mixed',
        ],
      ];
      for (const [argv, options, lineUp] of cases) {
        const first = capture(argv);
        expect(capture(argv).out).toBe(first.out);
        const rest = withoutBlock(first.out);
        const header = rest.slice(0, rest.indexOf('Hands played: '));
        let replaced = 0;
        const summary = runPlaytest(options, (hand) => (replaced += hand.replaced?.length ?? 0));
        expect(rest).toBe(
          formatReport(header, summary, 'run', lineUp, lineUp === undefined ? undefined : replaced),
        );
        if (lineUp !== undefined) {
          expect(first.out.endsWith(`Invariant violations: 0\nBots replaced: ${replaced}\n`)).toBe(
            true,
          );
        }
      }
    },
    TEST_TIMEOUT_MS,
  );

  it('a hand stopped by a violation counts toward no bot', () => {
    const run = capture(['--hands', '3', '--seed', '42'], { onAction: flagFirstActionOfHand(2) });
    expect(run.code).toBe(1);
    const found = rows(run.out);
    expect(found).toHaveLength(6);
    for (const r of found) expect(r.hands).toBe(2);
    expect(run.out).toContain('Invariant violations: 1\nViolations by invariant: ');
    expect(run.out).toContain('First violation: hand 2, player action 1 (');
    expect(run.out.endsWith('Result: abandoned (invariant violation)\n')).toBe(true);
  });
});
