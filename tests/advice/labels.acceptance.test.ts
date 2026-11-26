import { describe, expect, it } from 'vitest';
import { chartBasisText, positionLabel, situationLabel } from '../../src/advice/explain';
import { SITUATION_LABELS } from '../../src/advice/explanations';
import type { Position, Situation } from '../../src/advice/preflop-chart';

describe('position labels', () => {
  it('labels each 6-max position', () => {
    const ids: Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
    expect(ids.map(positionLabel)).toEqual([
      'an early seat (UTG)',
      'the hijack',
      'the cutoff',
      'the button',
      'the small blind',
      'the big blind',
    ]);
  });

  it('labels the other positions and matches the chart basis', () => {
    const ids: Position[] = ['LJ', 'MP', 'UTG+1'];
    expect(ids.map(positionLabel)).toEqual([
      'the lojack',
      'a middle seat (MP)',
      'an early seat (UTG+1)',
    ]);
    const all: Position[] = ['UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
    for (const position of all) {
      expect(
        chartBasisText({ referenceSize: '6-max', action: 'raise', handClass: 'A9o', position }),
      ).toBe(`From the 6-max chart: raise A9o from ${positionLabel(position)}`);
    }
  });
});

describe('situation labels', () => {
  it('labels each situation', () => {
    const expected: Record<Situation, string> = {
      unopened: 'in an unopened pot',
      limpers: 'facing one or more limpers',
      raise: 'facing a raise',
      'raise-and-calls': 'facing a raise and calls',
      're-raise': 'facing a re-raise',
      'blind-defence': 'defending the blind against a raise',
    };
    expect(Object.keys(SITUATION_LABELS).sort()).toEqual(
      ['blind-defence', 'limpers', 'raise', 'raise-and-calls', 're-raise', 'unopened'].sort(),
    );
    for (const [situation, label] of Object.entries(expected) as [Situation, string][]) {
      expect(situationLabel(situation)).toBe(label);
    }
  });
});
