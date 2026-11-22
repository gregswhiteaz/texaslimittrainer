import { describe, expect, it } from 'vitest';
import {
  LINE_UP_PRESETS,
  lineUpSessionConfig,
  resolveLineUpName,
  seatLineUp,
  type LineUpSeat,
} from '../../src/bots/lineup';
import type { StyleName } from '../../src/bots/style';
import { DEFAULT_SESSION_CONFIG } from '../../src/table/session';

const withStyle = (seats: readonly LineUpSeat[], seat: number, style: StyleName): LineUpSeat[] =>
  seats.map((s) => (s.seat === seat ? { ...s, style } : s));

describe('line-up name: preset or Custom', () => {
  it('AC#1 Mixed at 6 seats with seat 4 changed from Maniac to Rock is Custom', () => {
    const preset = seatLineUp('Mixed', 6, 1);
    expect(preset[3]?.style).toBe('Maniac');
    const seats = withStyle(preset, 4, 'Rock');
    expect(resolveLineUpName('Mixed', seats)).toBe('Custom');
    const config = lineUpSessionConfig(DEFAULT_SESSION_CONFIG, 'Mixed', seats);
    expect(config.lineUp).toBe('Custom');
    expect(config.seats.map((s) => s.style)).toEqual([
      null,
      'TAG',
      'Calling station',
      'Rock',
      'Rock',
      'TAG',
    ]);
  });

  it('AC#2 every unedited preset at every size resolves to the preset name', () => {
    let count = 0;
    for (const preset of LINE_UP_PRESETS) {
      for (let size = 2; size <= 10; size++) {
        for (let user = 1; user <= size; user++) {
          expect(resolveLineUpName(preset, seatLineUp(preset, size, user))).toBe(preset);
          count++;
        }
      }
    }
    expect(count).toBe(162);
  });

  it('AC#3 Soft with one seat changed to TAG and back is Soft', () => {
    const preset = seatLineUp('Soft', 6, 1);
    expect(preset[2]?.style).toBe('Rock');
    const edited = withStyle(preset, 3, 'TAG');
    expect(resolveLineUpName('Soft', edited)).toBe('Custom');
    expect(resolveLineUpName('Soft', withStyle(edited, 3, 'Rock'))).toBe('Soft');
  });

  it('AC#4 Start game config carries Custom and every edited style', () => {
    const base = { ...DEFAULT_SESSION_CONFIG, button: 3 };
    const unedited = seatLineUp('Mixed', 6, 1);
    const seats = withStyle(withStyle(unedited, 4, 'Rock'), 6, 'Calling station');
    expect(lineUpSessionConfig(base, 'Mixed', seats)).toEqual({
      gameType: 'cash',
      stake: { smallBet: 4, bigBet: 8 },
      speed: 'rapid',
      button: 3,
      players: 6,
      userSeat: 1,
      lineUp: 'Custom',
      seats: [
        { seat: 1, name: 'You', kind: 'user', style: null },
        { seat: 2, name: 'Ava', kind: 'bot', style: 'TAG' },
        { seat: 3, name: 'Ben', kind: 'bot', style: 'Calling station' },
        { seat: 4, name: 'Cal', kind: 'bot', style: 'Rock' },
        { seat: 5, name: 'Dee', kind: 'bot', style: 'Rock' },
        { seat: 6, name: 'Eli', kind: 'bot', style: 'Calling station' },
      ],
    });
    expect(lineUpSessionConfig(base, 'Mixed', unedited).lineUp).toBe('Mixed');
  });
});
