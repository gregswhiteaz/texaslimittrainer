import { describe, expect, it } from 'vitest';
import type { LineUpPreset } from '../../src/bots/lineup';
import {
  botsClockwise,
  configForGameType,
  configForLineUp,
  DEFAULT_SESSION_CONFIG,
} from '../../src/table/session';

describe('configForLineUp', () => {
  it('configForLineUp keeps game type, stake and speed and rejects bad sizes and presets', () => {
    const cash = configForGameType(DEFAULT_SESSION_CONFIG, 'cash', { smallBet: 10, bigBet: 20 });
    const cashOut = configForLineUp(cash, 8, 'Mixed');
    expect(cashOut.gameType).toBe('cash');
    expect(cashOut.gameType === 'cash' && cashOut.stake).toEqual({ smallBet: 10, bigBet: 20 });
    expect(cashOut.speed).toBe('rapid');

    const sng = configForGameType(DEFAULT_SESSION_CONFIG, 'sit-and-go', {
      smallBet: 10,
      bigBet: 20,
    });
    const sngOut = configForLineUp(sng, 3, 'Tough');
    expect(sngOut.gameType).toBe('sit-and-go');
    expect('stake' in sngOut).toBe(false);
    expect(sngOut.speed).toBe('rapid');

    for (const n of [1, 11, 2.5]) {
      expect(() => configForLineUp(DEFAULT_SESSION_CONFIG, n, 'Mixed')).toThrow(
        new RangeError('Table size must be a whole number from 2 to 10'),
      );
    }
    expect(() =>
      configForLineUp(DEFAULT_SESSION_CONFIG, 6, 'Custom' as unknown as LineUpPreset),
    ).toThrow(/^Unknown line-up preset/);
    expect(() =>
      configForLineUp(DEFAULT_SESSION_CONFIG, 6, 'Custom' as unknown as LineUpPreset),
    ).toThrow(RangeError);

    expect(botsClockwise(DEFAULT_SESSION_CONFIG).map((s) => s.seat)).toEqual([6, 1, 2, 3, 4]);
  });

  it('botsClockwise starts at the first bot after the user and leaves out the user', () => {
    const ten = configForLineUp(DEFAULT_SESSION_CONFIG, 10, 'Soft');
    expect(botsClockwise(ten).map((s) => s.seat)).toEqual([6, 7, 8, 9, 10, 1, 2, 3, 4]);
    expect(botsClockwise(ten).map((s) => s.name)).toEqual([
      'Ava',
      'Ben',
      'Cal',
      'Dee',
      'Eli',
      'Fay',
      'Gus',
      'Hal',
      'Ivy',
    ]);
    const headsUp = configForLineUp(DEFAULT_SESSION_CONFIG, 2, 'Mixed');
    expect(botsClockwise(headsUp)).toEqual([{ seat: 1, name: 'Ava', kind: 'bot', style: 'TAG' }]);
    expect(headsUp.button).toBe(1);
    expect(configForLineUp(DEFAULT_SESSION_CONFIG, 2, 'Soft').seats[0]?.style).toBe(
      'Calling station',
    );
  });

  it('configForLineUp names the line-up after the preset and does not change its input', () => {
    const before = JSON.stringify(DEFAULT_SESSION_CONFIG);
    for (const preset of ['Mixed', 'Tough', 'Soft'] as const) {
      expect(configForLineUp(DEFAULT_SESSION_CONFIG, 6, preset).lineUp).toBe(preset);
    }
    expect(JSON.stringify(DEFAULT_SESSION_CONFIG)).toBe(before);
  });
});
