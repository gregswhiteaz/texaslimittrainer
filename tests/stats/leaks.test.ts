import { describe, expect, it } from 'vitest';
import type { ActionType, Grade } from '../../src/advice/grade';
import {
  categoryCounts,
  decisionCategory,
  isLeak,
  LEAK_CATEGORIES,
  leakEvidence,
  parseLeakCategories,
  sessionLeaks,
  type CategoryCount,
  type CategoryDecision,
  type LeakStreet,
} from '../../src/stats/leaks';
import data from '../../src/stats/leak-categories.json' with { type: 'json' };

type Json = Record<string, unknown>;

/** A deep copy of the shipped file with `edit` applied. */
function altered(edit: (file: Json) => void): Json {
  const file = structuredClone(data) as unknown as Json;
  edit(file);
  return file;
}
const entry = (file: Json, i: number): Json => (file.categories as Json[])[i] as Json;

const decision = (
  street: 'preflop' | LeakStreet,
  type: ActionType,
  grade: Grade,
  hinted = false,
): CategoryDecision => ({ street, action: { type }, grade: { grade }, hinted });

const count = (decisions: number, errors: number): CategoryCount => ({
  category: 'flop-facing-a-bet-fold',
  decisions,
  errors,
  major: 0,
});

describe('leak categories', () => {
  it('parseLeakCategories rejects malformed category data', () => {
    const cases: [string, (file: Json) => void][] = [
      ['format', (f) => (f.format = 'tlh-healthy-ranges')],
      ['version', (f) => (f.version = 2)],
      ['file.extra', (f) => (f.extra = 1)],
      ['categories', (f) => (f.categories = {})],
      ['categories[0]', (f) => ((f.categories as unknown[])[0] = null)],
      ['categories[2].note', (f) => (entry(f, 2).note = 'x')],
      ['categories[2].justification', (f) => delete entry(f, 2).justification],
      ['categories[1].id', (f) => (entry(f, 1).id = 'flop-facing-a-bet-fold')],
      ['categories[1].id', (f) => (entry(f, 1).id = 'turn-facing-a-bet-call')],
      ['categories[0].action', (f) => (entry(f, 0).action = 'check')],
      ['categories[3].action', (f) => (entry(f, 3).action = 'raise')],
      ['categories[0].street', (f) => (entry(f, 0).street = 'preflop')],
      ['categories[0].facingBet', (f) => (entry(f, 0).facingBet = 'yes')],
      ['categories[4].fix', (f) => (entry(f, 4).fix = 'Fold more. Call less.')],
      ['categories[4].fix', (f) => (entry(f, 4).fix = 'Fold more')],
      ['categories[4].fix', (f) => (entry(f, 4).fix = 'fold more.')],
      ['categories[4].fix', (f) => (entry(f, 4).fix = 'Fold more!')],
      ['categories[4].fix', (f) => (entry(f, 4).fix = ' Fold more.')],
      ['categories[5].title', (f) => (entry(f, 5).title = '')],
      ['categories[5].title', (f) => (entry(f, 5).title = 'Folding too often.')],
      ['categories[5].title', (f) => (entry(f, 5).title = ' Folding')],
      ['categories[6].evidenceName', (f) => (entry(f, 6).evidenceName = 'Turn calls')],
      ['categories[6].evidenceName', (f) => (entry(f, 6).evidenceName = '')],
      ['categories[7].justification', (f) => (entry(f, 7).justification = 'No full stop')],
      ['categories[7].justification', (f) => (entry(f, 7).justification = 3)],
    ];
    for (const [path, edit] of cases) {
      expect(() => parseLeakCategories(altered(edit)), path).toThrow(
        new RangeError(`Invalid leak categories: ${path}`),
      );
    }
    expect(() => parseLeakCategories(null)).toThrow(
      new RangeError('Invalid leak categories: file'),
    );
    expect(() => parseLeakCategories(altered(() => undefined))).not.toThrow();
  });

  it('counts unhinted postflop decisions per category and applies the thresholds', () => {
    expect(decisionCategory('preflop', 'raise')).toBeNull();
    expect(decisionCategory('flop', 'check')).toBe('flop-not-facing-a-bet-check');
    expect(decisionCategory('turn', 'raise')).toBe('turn-facing-a-bet-raise');
    expect(decisionCategory('river', 'bet')).toBe('river-not-facing-a-bet-bet');

    expect(
      categoryCounts([
        decision('river', 'check', 'major'),
        decision('preflop', 'raise', 'major'),
        decision('flop', 'fold', 'correct'),
        decision('flop', 'fold', 'minor'),
        decision('flop', 'fold', 'major'),
        decision('flop', 'fold', 'major', true),
        decision('turn', 'bet', 'major', true),
        decision('river', 'check', 'minor'),
      ]),
    ).toEqual([
      { category: 'flop-facing-a-bet-fold', decisions: 3, errors: 2, major: 1 },
      { category: 'river-not-facing-a-bet-check', decisions: 2, errors: 2, major: 1 },
    ]);
    expect(categoryCounts([])).toEqual([]);

    expect(isLeak(count(8, 3))).toBe(false);
    expect(isLeak(count(8, 4))).toBe(true);
    expect(isLeak(count(20, 8))).toBe(true);
    expect(isLeak(count(7, 7))).toBe(false);
    expect(leakEvidence(count(12, 5))).toBe('5 of 12 flop folds graded as errors');

    const leaks = sessionLeaks([
      { category: 'river-facing-a-bet-call', decisions: 10, errors: 6, major: 1 },
      { category: 'flop-not-facing-a-bet-bet', decisions: 9, errors: 1, major: 0 },
      { category: 'flop-facing-a-bet-raise', decisions: 8, errors: 4, major: 4 },
      { category: 'preflop-raise' as CategoryCount['category'], decisions: 9, errors: 9, major: 9 },
    ]);
    const raise = LEAK_CATEGORIES.find((c) => c.id === 'flop-facing-a-bet-raise');
    expect(leaks.map((l) => l.category)).toEqual([
      'flop-facing-a-bet-raise',
      'river-facing-a-bet-call',
    ]);
    expect(leaks[0]).toEqual({
      category: 'flop-facing-a-bet-raise',
      title: raise?.title,
      evidence: '4 of 8 flop raises graded as errors',
      fix: raise?.fix,
    });
  });
});
