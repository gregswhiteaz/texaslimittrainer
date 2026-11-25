import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseSettings } from '../../src/table/settings';

// TASK-12.1 (A-5, A-6): the settings record and its validation.

describe('settings', () => {
  it('parseSettings accepts valid settings and names the first bad field', () => {
    const d = DEFAULT_SETTINGS;
    expect(d).toEqual({
      defaultSpeed: 'rapid',
      autoOpenReview: true,
      showOpponentStyles: true,
      fourColourDeck: false,
      botBanter: true,
    });
    expect(Object.isFrozen(d)).toBe(true);
    expect(parseSettings(d)).toEqual(d);
    expect(parseSettings({ ...d, extra: 1 })).toEqual(d);
    expect(parseSettings({ ...d, extra: 1 })).not.toHaveProperty('extra');
    const other = {
      defaultSpeed: 'realistic',
      autoOpenReview: false,
      showOpponentStyles: false,
      fourColourDeck: true,
      botBanter: false,
    };
    expect(parseSettings(other)).toEqual(other);

    const missingReview: Record<string, unknown> = { ...d };
    delete missingReview.autoOpenReview;
    const rows: [unknown, string][] = [
      [null, 'settings'],
      [[], 'settings'],
      ['settings', 'settings'],
      [{ ...d, defaultSpeed: 'fast' }, 'defaultSpeed'],
      [missingReview, 'autoOpenReview'],
      [{ ...d, showOpponentStyles: 1 }, 'showOpponentStyles'],
      [{ ...d, fourColourDeck: 'no' }, 'fourColourDeck'],
      [{ ...d, botBanter: undefined }, 'botBanter'],
      [{ ...d, defaultSpeed: 'fast', botBanter: 'yes' }, 'defaultSpeed'],
    ];
    for (const [value, field] of rows) {
      expect(() => parseSettings(value), field).toThrow(
        new RangeError(`Invalid settings: ${field}`),
      );
    }
  });
});
