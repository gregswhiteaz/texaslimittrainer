import { describe, expect, it } from 'vitest';
import {
  BOT_NAMES,
  nextReplacementName,
  REPLACEMENT_NAMES,
  replacementName,
  replacementStyles,
} from '../../src/bots/lineup';
import type { StyleName } from '../../src/bots/style';
import { replayCodeFromWords } from '../../src/engine/deck';
import { drawReplacementStyle, type LineUpName } from '../../src/table/session';

const DRAWS = 10_000;
const CODES = Array.from({ length: DRAWS }, (_, i) => replayCodeFromWords([i + 1, 6, 8, 3]));

/** How often each style is drawn over the 10,000 codes at seat 2. */
function tally(lineUp: LineUpName, size: number): Map<StyleName, number> {
  const counts = new Map<StyleName, number>();
  for (const code of CODES) {
    const style = drawReplacementStyle(lineUp, size, code, 2);
    counts.set(style, (counts.get(style) ?? 0) + 1);
  }
  return counts;
}

/** The drawn styles in TAG, Calling station, Maniac, Rock order, each drawn at least once. */
function drawn(counts: Map<StyleName, number>): StyleName[] {
  const order: StyleName[] = ['TAG', 'Calling station', 'Maniac', 'Rock'];
  for (const count of counts.values()) expect(count).toBeGreaterThan(0);
  return order.filter((style) => counts.has(style));
}

const ALL: StyleName[] = ['TAG', 'Calling station', 'Maniac', 'Rock'];

describe('replacement bot styles and names', () => {
  it("10,000 replacements at 6 players draw only each preset's styles", () => {
    const expected: [LineUpName, StyleName[]][] = [
      ['Mixed', ALL],
      ['Tough', ['TAG', 'Maniac']],
      ['Soft', ['Calling station', 'Rock']],
    ];
    for (const [preset, styles] of expected) {
      const counts = tally(preset, 6);
      expect(drawn(counts), preset).toEqual(styles);
      expect([...counts.values()].reduce((a, b) => a + b, 0)).toBe(DRAWS);
      expect(replacementStyles(preset, 6)).toEqual(styles);
    }
  });

  it('a session recorded as Custom draws all four styles', () => {
    for (const size of [6, 2]) {
      expect(drawn(tally('Custom', size)), `size ${size}`).toEqual(ALL);
      expect(replacementStyles('Custom', size)).toEqual(ALL);
    }
  });

  it('Mixed at 3 players draws TAG or Calling station and heads-up Tough draws TAG', () => {
    expect(drawn(tally('Mixed', 3))).toEqual(['TAG', 'Calling station']);
    expect(drawn(tally('Tough', 2))).toEqual(['TAG']);
    expect(replacementStyles('Mixed', 3)).toEqual(['TAG', 'Calling station']);
    expect(replacementStyles('Tough', 2)).toEqual(['TAG']);
  });

  it('replacement names follow Jay to Zed, then numbered rounds, and skip names at the table', () => {
    expect(REPLACEMENT_NAMES).toHaveLength(17);
    expect(REPLACEMENT_NAMES.some((name) => BOT_NAMES.includes(name))).toBe(false);
    expect(new Set(REPLACEMENT_NAMES.map((name) => name[0])).size).toBe(17);
    expect([0, 1, 16, 17, 18, 34].map(replacementName)).toEqual([
      'Jay',
      'Kit',
      'Zed',
      'Jay 2',
      'Kit 2',
      'Jay 3',
    ]);
    expect(nextReplacementName(0, ['Ava', 'You'])).toEqual({ name: 'Jay', next: 1 });
    expect(nextReplacementName(0, ['Jay', 'Ben'])).toEqual({ name: 'Kit', next: 2 });
    expect(nextReplacementName(16, ['Zed'])).toEqual({ name: 'Jay 2', next: 18 });
  });
});
