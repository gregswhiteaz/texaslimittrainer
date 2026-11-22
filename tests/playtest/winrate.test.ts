import { describe, expect, it } from 'vitest';
import type { LineUpSeat } from '../../src/bots/lineup';
import { main } from '../../src/playtest/cli';
import { handReplayCode, type PlayedHand } from '../../src/playtest/runner';
import {
  addResult,
  BotResults,
  formatBotResults,
  newTally,
  winRate,
  winRateOfTally,
  type WinRate,
} from '../../src/playtest/winrate';

function capture(argv: string[]) {
  let out = '';
  const code = main(argv, { out: (t) => (out += t), err: () => undefined });
  return { code, out };
}

/** A hand numbered `number` whose seats ended `results[seat]` chips up or down (seat → result). */
function hand(
  number: number,
  results: Readonly<Record<number, number>>,
  lineUp?: readonly LineUpSeat[],
  complete = true,
  violations = 0,
): PlayedHand {
  const players = Object.entries(results).map(([seat, result]) => ({
    seat: Number(seat),
    startingStack: 160,
    stack: 160 + result,
  }));
  return {
    number,
    violations,
    final: { players, result: complete ? {} : null },
    ...(lineUp === undefined ? {} : { lineUp }),
  } as unknown as PlayedHand;
}

const user: LineUpSeat = { seat: 1, kind: 'user', name: null, style: null };
const bot = (seat: number, name: string, style: LineUpSeat['style']): LineUpSeat => ({
  seat,
  kind: 'bot',
  name,
  style,
});

const rate = (bbPer100: number, lower: number | null, upper: number | null): WinRate => ({
  hands: lower === null ? 1 : 10,
  bbPer100,
  lower,
  upper,
});

describe('winrate', () => {
  it('fewer than two hands, empty and zero-variance inputs', () => {
    expect(winRate([-16], 8)).toEqual({ hands: 1, bbPer100: -200, lower: null, upper: null });
    expect(
      formatBotResults(
        [{ seat: 3, name: 'Jay', style: 'Maniac', rate: winRate([-16], 8) }],
        'cash',
      ),
    ).toBe(
      'Bot results: BB/100 = big bets won per 100 hands (big bet $8), with 95% confidence interval\n' +
        'Bot: Jay, Maniac, seat 3, 1 hands, -200.00 BB/100, 95% CI n/a\n',
    );
    const one = capture(['--hands', '1']);
    expect(one.code).toBe(0);
    const rows = one.out.split('\n').filter((line) => line.startsWith('Bot: '));
    expect(rows).toHaveLength(6);
    for (const row of rows) expect(row).toMatch(/, 1 hands, .*, 95% CI n\/a$/);
    expect(() => winRate([], 8)).toThrow(new RangeError('No hands to rate'));
    expect(() => winRateOfTally(newTally(), 8)).toThrow(new RangeError('No hands to rate'));
    expect(winRate([4, 4, 4], 8)).toEqual({ hands: 3, bbPer100: 50, lower: 50, upper: 50 });
    expect(formatBotResults([], 'cash')).toBe('');
  });

  it('values are shown to 0.01 without negative zero', () => {
    const text = formatBotResults(
      [
        { seat: 1, name: 'A', style: 'TAG', rate: rate(-0.001, -1.236, 1.234) },
        { seat: 2, name: 'B', style: 'Rock', rate: rate(1.234, null, null) },
      ],
      'sng',
    );
    expect(text).toBe(
      'Bot results: BB/100 = big bets won per 100 hands (big bet 40 chips), with 95% confidence interval\n' +
        'Bot: A, TAG, seat 1, 10 hands, 0.00 BB/100, 95% CI -1.24 to 1.23\n' +
        'Bot: B, Rock, seat 2, 1 hands, 1.23 BB/100, 95% CI n/a\n',
    );
  });

  it('bot identity, ordering and per-hand results', () => {
    const seats = [user, bot(2, 'Ava', 'TAG'), bot(3, 'Ben', 'Rock')];
    const swapped = [user, bot(2, 'Jay', 'Maniac'), seats[2] as LineUpSeat];
    const lineUp = new BotResults('cash');
    lineUp.add(hand(1, { 1: 8, 2: -8, 3: 0 }, seats));
    lineUp.add(hand(2, { 1: 4, 2: -4, 3: 0 }, swapped));
    lineUp.add(hand(3, { 1: 100, 2: -100 }, seats, false));
    // Completed (result non-null) but flagged on its final action: still not counted (A-1).
    lineUp.add(hand(5, { 1: 50, 2: -50, 3: 0 }, seats, true, 1));
    lineUp.add(hand(4, { 1: -16, 2: 16, 3: 0 }, seats));
    const rows = lineUp.rows();
    expect(rows.map((r) => [r.seat, r.name, r.style, r.rate.hands])).toEqual([
      [1, 'User', 'TAG', 3],
      [2, 'Ava', 'TAG', 2],
      [2, 'Jay', 'Maniac', 1],
      [3, 'Ben', 'Rock', 3],
    ]);
    expect(rows[1]?.rate.bbPer100).toBeCloseTo(50, 9);

    const six = new BotResults('cash');
    six.add(hand(1, { 1: 8, 2: -8 }));
    expect(six.rows().map((r) => [r.name, r.style])).toEqual([
      ['Seat 1', 'TAG'],
      ['Seat 2', 'TAG'],
    ]);
    const sng = new BotResults('sng');
    sng.add(hand(1, { 1: 40, 2: -20, 3: -20 }));
    sng.add(hand(2, { 1: 40, 3: -40 }));
    const sngRows = sng.rows();
    expect(sngRows.map((r) => [r.name, r.style, r.rate.hands])).toEqual([
      ['Seat 1', 'TAG', 2],
      ['Seat 2', 'TAG', 1],
      ['Seat 3', 'TAG', 2],
    ]);
    expect(sngRows[0]?.rate.bbPer100).toBe(100);

    // Welford matches a two-pass mean and variance on 10,000 integer results.
    let x = 12345;
    const results = Array.from({ length: 10_000 }, () => {
      x = (x * 1103515245 + 12345) % 2 ** 31;
      return (x % 1729) - 864 + 750_000;
    });
    const tally = newTally();
    for (const r of results) addResult(tally, r);
    const mean = results.reduce((s, r) => s + r, 0) / results.length;
    const variance = results.reduce((s, r) => s + (r - mean) ** 2, 0) / (results.length - 1);
    expect(Math.abs(tally.mean - mean) / Math.abs(mean)).toBeLessThan(1e-9);
    expect(Math.abs(tally.m2 / (tally.hands - 1) - variance) / variance).toBeLessThan(1e-9);
  });

  it('replay mode prints no bot block', () => {
    const replay = capture(['--replay-code', handReplayCode(42, 1), '--size', '6']);
    expect(replay.code).toBe(0);
    expect(replay.out.split('\n').some((line) => line.startsWith('Bot'))).toBe(false);
  });
});
