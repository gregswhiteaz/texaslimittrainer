import { describe, expect, it } from 'vitest';
import { BOT_NAMES, LINE_UP_PRESETS, seatLineUp, type LineUpSeat } from '../../src/bots/lineup';
import type { StyleName } from '../../src/bots/style';

const SIZES = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const styleAt = (lineUp: readonly LineUpSeat[], seat: number) =>
  lineUp.find((s) => s.seat === seat)?.style;

/** Seats clockwise from the user, skipping the user: [u+1, …, n, 1, …, u-1]. */
function botSeatsClockwise(size: number, userSeat: number): number[] {
  const seats: number[] = [];
  let seat = userSeat;
  for (;;) {
    seat = seat === size ? 1 : seat + 1;
    if (seat === userSeat) return seats;
    seats.push(seat);
  }
}

describe('line-up presets', () => {
  it('AC#1 Mixed at 6 players with the user at seat 4', () => {
    const lineUp = seatLineUp('Mixed', 6, 4);
    expect(lineUp.map((s) => s.seat)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(lineUp.find((s) => s.seat === 4)).toEqual({
      seat: 4,
      kind: 'user',
      style: null,
      name: null,
    });
    expect([5, 6, 1, 2, 3].map((seat) => styleAt(lineUp, seat))).toEqual([
      'TAG',
      'Calling station',
      'Maniac',
      'Rock',
      'TAG',
    ]);
  });

  it('AC#2 Tough at 6 players with the user at seat 4', () => {
    const lineUp = seatLineUp('Tough', 6, 4);
    expect(lineUp.filter((s) => s.style === 'Maniac').map((s) => s.seat)).toEqual([5]);
    for (const seat of [6, 1, 2, 3]) expect(styleAt(lineUp, seat)).toBe('TAG');
    expect(lineUp.find((s) => s.seat === 4)?.kind).toBe('user');
  });

  it('AC#3 every preset, size and user seat follows the preset rule', () => {
    const cycle: StyleName[] = ['TAG', 'Calling station', 'Maniac', 'Rock'];
    let count = 0;
    for (const preset of LINE_UP_PRESETS) {
      for (const n of SIZES) {
        for (let u = 1; u <= n; u++) {
          count++;
          const lineUp = seatLineUp(preset, n, u);
          expect(lineUp.map((s) => s.seat)).toEqual(Array.from({ length: n }, (_, i) => i + 1));
          const users = lineUp.filter((s) => s.kind === 'user');
          expect(users).toEqual([{ seat: u, kind: 'user', style: null, name: null }]);
          const expected = botSeatsClockwise(n, u).map((seat, i): [number, StyleName] => {
            const k = i + 1;
            if (preset === 'Mixed') return [seat, cycle[(k - 1) % 4] as StyleName];
            if (preset === 'Tough') return [seat, n >= 3 && k === 1 ? 'Maniac' : 'TAG'];
            return [seat, k % 2 === 1 ? 'Calling station' : 'Rock'];
          });
          for (const [seat, style] of expected) expect(styleAt(lineUp, seat)).toBe(style);
          if (preset === 'Tough' && n >= 3) {
            expect(lineUp.filter((s) => s.style === 'Maniac')).toHaveLength(1);
          }
        }
      }
    }
    expect(count).toBe(162);
  });

  it('AC#4 heads-up Tough seats a single TAG', () => {
    for (const u of [1, 2]) {
      const bots = seatLineUp('Tough', 2, u).filter((s) => s.kind === 'bot');
      expect(bots.map((s) => s.style)).toEqual(['TAG']);
      expect(bots[0]?.seat).toBe(u === 1 ? 2 : 1);
    }
  });

  it('AC#5 no two bots share a display name', () => {
    expect(new Set(BOT_NAMES).size).toBe(BOT_NAMES.length);
    expect(BOT_NAMES.length).toBeGreaterThanOrEqual(9);
    for (const preset of LINE_UP_PRESETS) {
      for (const n of SIZES) {
        for (let u = 1; u <= n; u++) {
          const names = seatLineUp(preset, n, u)
            .filter((s) => s.kind === 'bot')
            .map((s) => s.name);
          expect(names).toHaveLength(n - 1);
          for (const name of names) {
            expect(typeof name === 'string' && name.length > 0).toBe(true);
            expect(BOT_NAMES).toContain(name);
          }
          expect(new Set(names).size).toBe(n - 1);
        }
      }
    }
  });
});
