import { describe, expect, it } from 'vitest';
import {
  configForLineUp,
  configWithSeatStyles,
  DEFAULT_SESSION_CONFIG,
  randomBotStyles,
} from '../../src/table/session';

const recording = (words: readonly number[]) => {
  const calls: number[] = [];
  let i = 0;
  const source = (): number => {
    const w = words[i++ % words.length] as number;
    calls.push(w);
    return w;
  };
  return { source, calls };
};

describe('randomBotStyles / configWithSeatStyles (TASK-2.9)', () => {
  it('randomBotStyles draws one word per bot in clockwise order and maps it modulo four', () => {
    const six = configForLineUp(DEFAULT_SESSION_CONFIG, 6, 'Mixed');
    const rec = recording([0, 1, 2, 3, 4294967295]);
    const styles = randomBotStyles(six, rec.source);
    expect(rec.calls).toHaveLength(5);
    // Words go to seats in botsClockwise order 6, 1, 2, 3, 4.
    expect(styles).toEqual({
      6: 'TAG',
      1: 'Calling station',
      2: 'Maniac',
      3: 'Rock',
      4: 'Rock',
    });
    expect(Object.isFrozen(styles)).toBe(true);

    const two = configForLineUp(DEFAULT_SESSION_CONFIG, 2, 'Mixed');
    const one = recording([4]);
    const headsUp = randomBotStyles(two, one.source);
    expect(one.calls).toHaveLength(1);
    const botSeat = two.seats.find((s) => s.kind === 'bot')?.seat;
    expect(headsUp).toEqual({ [String(botSeat)]: 'TAG' });

    const ten = configForLineUp(DEFAULT_SESSION_CONFIG, 10, 'Mixed');
    const full = randomBotStyles(ten, recording([7]).source);
    expect(Object.keys(full)).toHaveLength(9);
    expect(Object.keys(full)).not.toContain(String(ten.userSeat));
    expect(Object.values(full).every((s) => s === 'Rock')).toBe(true);
  });

  it('rejects words that are not 32-bit unsigned integers', () => {
    const six = configForLineUp(DEFAULT_SESSION_CONFIG, 6, 'Mixed');
    for (const [w, text] of [
      [-1, '-1'],
      [1.5, '1.5'],
      [4294967296, '4294967296'],
      [Number.NaN, 'NaN'],
    ] as const) {
      expect(() => randomBotStyles(six, () => w)).toThrow(
        new RangeError(`Random word out of range: ${text}`),
      );
    }
  });

  it('configWithSeatStyles returns the config for no edits and rejects the user seat', () => {
    const c = configForLineUp(DEFAULT_SESSION_CONFIG, 6, 'Mixed');
    expect(configWithSeatStyles(c, 'Mixed', {})).toBe(c);
    expect(() => configWithSeatStyles(c, 'Mixed', { 5: 'Rock' })).toThrow(
      new RangeError('Seat 5 is not a bot seat'),
    );
    const edited = configWithSeatStyles(c, 'Mixed', { 2: 'Rock', 6: 'Maniac' });
    expect(edited.seats.find((s) => s.seat === 2)?.style).toBe('Rock');
    expect(edited.seats.find((s) => s.seat === 6)?.style).toBe('Maniac');
    expect(edited.lineUp).toBe('Custom');
  });
});
