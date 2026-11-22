import { describe, expect, it } from 'vitest';
import type { HoleCards } from '../../src/advice/equity';
import { comboCount, HAND_CLASSES } from '../../src/advice/hand-class';
import type { Position } from '../../src/advice/preflop-chart';
import {
  classifyCombo,
  defaultRange,
  estimateOpponentRanges,
  expandRange,
  narrowRange,
  parseDefaultRanges,
  parseHandRange,
  preflopLineOf,
  RangeValidationError,
  SIX_MAX_RANGES,
  unseenCombos,
  type PreflopLine,
} from '../../src/advice/ranges';
import { formatCard, parseCards } from '../../src/engine/cards';
import {
  applyAction,
  createHand,
  type Action,
  type HandState,
  type SeatNumber,
} from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';
import sixMaxRaw from '../../src/advice/ranges/six-max.json' with { type: 'json' };

const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const ORDERED_DECK = Array.from({ length: 52 }, (_, i) => i);
type Step = [SeatNumber, Action['type'], number?];

/** Button 1 (SB 2, BB 3, UTG 4, HJ 5, CO 6, BTN 1 at 6 seats); plays `steps`. */
function stateAfter(steps: Step[], seats = 6, stacks: number[] = []): HandState {
  let state = createHand({
    stakes: STAKES_4_8,
    seats: Array.from({ length: seats }, (_, i) => ({ seat: i + 1, stack: stacks[i] ?? 160 })),
    button: 1,
    deck: ORDERED_DECK,
  });
  for (const [seat, type, amount] of steps) {
    const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
    const result = applyAction(state, action);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    state = result.state;
  }
  return state;
}

const viewOf = (steps: Step[], seat: SeatNumber, seats = 6, stacks: number[] = []): PlayerView =>
  playerView(stateAfter(steps, seats, stacks), seat);

const combo = (text: string): HoleCards => parseCards(text) as unknown as HoleCards;
const classify = (hole: string, board: string) => classifyCombo(combo(hole), parseCards(board));
const sorted = (set: ReadonlySet<string>) => [...set].sort();
const width = (classes: ReadonlySet<string>) =>
  ([...classes].reduce((sum, hc) => sum + comboCount(hc), 0) / 1326) * 100;
const words = (text: string) => (text.match(/\p{L}+/gu) ?? []).length;

function problemsOf(raw: unknown): readonly string[] {
  try {
    parseDefaultRanges(raw);
  } catch (error) {
    expect(error).toBeInstanceOf(RangeValidationError);
    expect((error as Error).name).toBe('RangeValidationError');
    return (error as RangeValidationError).problems;
  }
  throw new Error('validation passed');
}

const copyOf = () =>
  JSON.parse(JSON.stringify(sixMaxRaw)) as Record<string, unknown> & {
    ranges: Record<string, unknown>[];
  };

/** Q-2 width bands in percent of 1,326 combos. */
const BANDS: Record<PreflopLine, Partial<Record<Position, [number, number]>>> = {
  'open-raise': {
    UTG: [10, 18],
    HJ: [12, 22],
    CO: [16, 28],
    BTN: [22, 40],
    SB: [18, 35],
    BB: [8, 20],
  },
  limp: { UTG: [5, 22], HJ: [5, 22], CO: [5, 22], BTN: [5, 30], SB: [20, 60] },
  check: { BB: [60, 95] },
  'call-raise': {
    UTG: [6, 25],
    HJ: [6, 25],
    CO: [6, 25],
    BTN: [6, 25],
    SB: [8, 30],
    BB: [25, 60],
  },
  'three-bet': {},
  'call-three-bet': {},
  'four-bet': {},
};
const FLAT_BANDS: Partial<Record<PreflopLine, [number, number]>> = {
  'three-bet': [3, 12],
  'call-three-bet': [5, 25],
  'four-bet': [1.5, 6],
};

describe('range notation, lines and classifier', () => {
  it('notation, lines and classifier edge cases', () => {
    expect(sorted(parseHandRange('TT+'))).toEqual(['AA', 'JJ', 'KK', 'QQ', 'TT']);
    expect(sorted(parseHandRange('A9s+'))).toEqual(['A9s', 'AJs', 'AKs', 'AQs', 'ATs']);
    expect(sorted(parseHandRange('KTo+'))).toEqual(['KJo', 'KQo', 'KTo']);
    expect(sorted(parseHandRange('66-22'))).toEqual(['22', '33', '44', '55', '66']);
    expect(sorted(parseHandRange('22-66'))).toEqual(['22', '33', '44', '55', '66']);
    expect(sorted(parseHandRange('K5s-K9s'))).toEqual(['K5s', 'K6s', 'K7s', 'K8s', 'K9s']);
    expect(sorted(parseHandRange('K9o-K5o'))).toHaveLength(5);
    expect(sorted(parseHandRange(' AA  AKs AA\tT9o '))).toEqual(['AA', 'AKs', 'T9o']);
    for (const bad of ['AAs', 'KAs', 'XX', '', '   ', 'KK+s', 'AKs-QJs', 'K5s-KAs', 'A9x']) {
      expect(() => parseHandRange(bad), bad).toThrow(RangeError);
    }
    expect(() => parseHandRange('AA 2345678901234567890123')).toThrow(
      'Invalid range token "23456789012345678901..."',
    );
    expect(() => parseHandRange('KAs')).toThrow('Invalid range token "KAs"');
    expect(
      parseHandRange('22+ A2s+ K2s+ Q2s+ J2s+ T2s+ 92s+ 82s+ 72s+ 62s+ 52s+ 42s+ 32s').size,
    ).toBe(13 + 78);

    // Lines (button 1: SB 2, BB 3, UTG 4, HJ 5, CO 6, BTN 1).
    const limped: Step[] = [
      [4, 'call', 4],
      [5, 'fold'],
      [6, 'fold'],
      [1, 'fold'],
      [2, 'call', 2],
      [3, 'check'],
    ];
    expect(preflopLineOf(viewOf(limped, 3), 3)).toBe('check');
    expect(preflopLineOf(viewOf(limped, 3), 4)).toBe('limp');
    expect(preflopLineOf(viewOf(limped, 3), 2)).toBe('limp');
    const opened: Step[] = [
      [4, 'raise', 8],
      [5, 'call', 8],
      [6, 'fold'],
      [1, 'raise', 12],
      [2, 'fold'],
      [3, 'raise', 16],
      [4, 'call', 8],
      [5, 'call', 8],
      [1, 'call', 4],
    ];
    const v = viewOf(opened, 4);
    expect(preflopLineOf(v, 5)).toBe('call-three-bet');
    expect(preflopLineOf(v, 3)).toBe('four-bet');
    expect(preflopLineOf(v, 4)).toBe('call-three-bet');
    expect(preflopLineOf(v, 1)).toBe('call-three-bet');
    const threeBet: Step[] = [
      [4, 'raise', 8],
      [5, 'raise', 12],
      [6, 'fold'],
      [1, 'fold'],
      [2, 'fold'],
      [3, 'fold'],
      [4, 'call', 4],
    ];
    expect(preflopLineOf(viewOf(threeBet, 4), 4)).toBe('call-three-bet');
    expect(preflopLineOf(viewOf(threeBet, 4), 5)).toBe('three-bet');
    expect(preflopLineOf(viewOf(threeBet.slice(0, 2), 4), 4)).toBe('open-raise');
    const limpCall: Step[] = [
      [4, 'call', 4],
      [5, 'raise', 8],
      [6, 'fold'],
      [1, 'fold'],
      [2, 'fold'],
      [3, 'fold'],
      [4, 'call', 4],
    ];
    expect(preflopLineOf(viewOf(limpCall, 4), 4)).toBe('call-raise');
    // A blind all in on posting: BB (seat 3) with 4 chips facing one raise; SB with 2 chips and no raise.
    const allInBb = viewOf(
      [
        [4, 'raise', 8],
        [5, 'fold'],
        [6, 'fold'],
        [1, 'fold'],
        [2, 'fold'],
      ],
      4,
      6,
      [160, 160, 4],
    );
    expect(preflopLineOf(allInBb, 3)).toBe('call-raise');
    const allInSb = viewOf(
      [
        [4, 'call', 4],
        [5, 'fold'],
        [6, 'fold'],
        [1, 'fold'],
        [3, 'check'],
      ],
      4,
      6,
      [160, 2],
    );
    expect(preflopLineOf(allInSb, 2)).toBe('limp');
    const allInBbNoRaise = viewOf(
      [
        [4, 'call', 4],
        [5, 'fold'],
        [6, 'fold'],
        [1, 'fold'],
        [2, 'call', 2],
      ],
      4,
      6,
      [160, 160, 4],
    );
    expect(preflopLineOf(allInBbNoRaise, 3)).toBe('check');
    const allInBbTwoRaises = viewOf(
      [
        [4, 'raise', 8],
        [5, 'raise', 12],
        [6, 'fold'],
        [1, 'fold'],
        [2, 'fold'],
        [4, 'call', 4],
      ],
      4,
      6,
      [160, 160, 4],
    );
    expect(preflopLineOf(allInBbTwoRaises, 3)).toBe('call-three-bet');

    // Classifier.
    expect(classify('9h 9d', 'Ks Kd 7c')).toBe('strong');
    expect(classify('Ah Qs', 'Ks Kd 8c 8h')).toBe('air');
    expect(classify('Th Jc', '5s 6d 7c 8h 9s')).toBe('draw');
    expect(classify('As 4d', '2c 3h Kd')).toBe('air');
    expect(classify('Jh Qd', 'Tc 9s 2h')).toBe('draw');
    expect(classify('Ah 3c', 'Kh 9h 2h')).toBe('draw');
    expect(classify('Ac Qd', '2h 5h 9h Kh')).toBe('air');
    expect(classify('Ah 2d', '3c 4s 5h 9d Kc')).toBe('strong');
    expect(classify('Ah 4d', '2c 3h 5d')).toBe('strong');
    expect(classify('Qh 3d', '2c 4s 5h')).toBe('draw');
    expect(classify('Ah Kd', 'Qc Jh Tc')).toBe('strong');
    expect(classify('Ah Kd', 'Qc Jh 4c')).toBe('air');
    expect(classify('7h 7d', '7c 7s 2h')).toBe('strong');
    expect(classify('Ah Kd', '7c 7s 7h')).toBe('air');
    expect(classify('2h 3d', 'Kc Ks Kh Kd')).toBe('air');
    expect(classify('Ah Kd', '9c 9s 4h 4d')).toBe('air');
    expect(classify('Ah 4c', '9c 9s 4h Kd')).toBe('strong');
    expect(classify('5h 5c', '9c 9s 4h 4d')).toBe('pair');
    expect(classify('Ah Qc', '9c 9s 4h Kd')).toBe('air');
    expect(classify('Qh Jd', '9c 9s 4h 4d 2c')).toBe('air');
  });

  it('expands, narrows per street and estimates from the view', () => {
    const aces = expandRange(new Set(['AA']), parseCards('Ah'));
    expect(aces.map((h) => h.map(formatCard).join(''))).toEqual(['AcAd', 'AcAs', 'AdAs']);
    expect(expandRange(new Set(['AKs']), [])).toHaveLength(4);
    expect(unseenCombos(parseCards('2c 3c 4c 5c 6c'))).toHaveLength(1081);
    for (const [a, b] of unseenCombos([])) expect(a).toBeLessThan(b);

    const range = [combo('Kh Kd'), combo('Qh Jh')];
    expect(narrowRange(range, parseCards('Ks 8d 7c'), 'call')).toEqual([]);

    // CO (6) opens, BB (3) calls; flop: 3 checks, 6 bets, 3 raises, 6 calls; turn: 3 bets, 6 calls.
    const pre: Step[] = [
      [4, 'fold'],
      [5, 'fold'],
      [6, 'raise', 8],
      [1, 'fold'],
      [2, 'fold'],
      [3, 'call', 4],
    ];
    const flop: Step[] = [...pre, [3, 'check'], [6, 'bet', 4], [3, 'raise', 8], [6, 'call', 4]];
    const flopView = viewOf(flop, 3);
    const board = flopView.board;
    expect(board).toHaveLength(4);
    const dead = [...flopView.holeCards, ...board];
    const [opp] = estimateOpponentRanges(flopView);
    expect(opp?.seat).toBe(6);
    const start = expandRange(defaultRange(SIX_MAX_RANGES, 'CO', 'open-raise').classes, dead);
    expect(opp?.start).toEqual(start);
    const afterFlop = narrowRange(start, board.slice(0, 3), 'bet');
    const expected = afterFlop.length > 0 ? afterFlop : start;
    expect(opp?.combos).toEqual(expected);

    // River view (board 5d 5h 5s 6d 6s): the river card is dead too and the river has no action yet. On the
    // turn every combo left after the flop bet is Strong, so the turn check would empty the range and is skipped (A-5).
    const riverView = viewOf([...flop, [3, 'check'], [6, 'check']], 3);
    const [seen] = estimateOpponentRanges(riverView);
    const riverDead = [...riverView.holeCards, ...riverView.board];
    const riverStart = expandRange(
      defaultRange(SIX_MAX_RANGES, 'CO', 'open-raise').classes,
      riverDead,
    );
    const afterBet = narrowRange(riverStart, riverView.board.slice(0, 3), 'bet');
    const afterCheck = narrowRange(afterBet, riverView.board.slice(0, 4), 'check');
    expect(afterBet.length).toBeGreaterThan(0);
    expect(afterCheck).toEqual([]);
    expect(seen?.combos).toEqual(afterBet);

    const heroLine = estimateOpponentRanges(viewOf(flop, 6));
    expect(heroLine[0]).toMatchObject({ seat: 3, position: 'BB', line: 'call-raise' });

    expect(() => estimateOpponentRanges(viewOf(pre.slice(0, 3), 1))).toThrow(
      'Range estimation needs a flop, turn or river view, got preflop',
    );
    expect(() => defaultRange({ ...SIX_MAX_RANGES, ranges: [] }, 'CO', 'limp')).toThrow(
      'Ranges 6-max have no range CO limp',
    );
  });

  it('range file validation lists every problem', () => {
    expect(problemsOf(null)).toEqual([
      'Range file: expected format "tlh-default-ranges" version 1',
    ]);
    expect(problemsOf({ ...copyOf(), version: 2 })).toEqual([
      'Range file: expected format "tlh-default-ranges" version 1',
    ]);
    expect(problemsOf({ ...copyOf(), referenceSize: 'full-ring-with-ten-seats' })).toEqual([
      'Range file: unknown reference size "full-ring-with-ten-s..."',
    ]);
    const raw = copyOf();
    raw.justification = 'Too short.';
    const [first, second] = raw.ranges as Record<string, unknown>[];
    (first as Record<string, unknown>).hands = 'AA KAs';
    raw.ranges.push(
      { ...second },
      { position: 'BB', line: 'limp', justification: 'x', hands: 'AA' },
    );
    raw.ranges.push('nonsense' as unknown as Record<string, unknown>);
    (second as Record<string, unknown>).hands = 7;
    expect(problemsOf(raw)).toEqual([
      '6-max ranges: missing plain-English justification (at least 50 words)',
      '6-max ranges: BB check has invalid hands: Invalid range token "KAs"',
      '6-max ranges: UTG limp has no hands',
      '6-max ranges: duplicate range UTG limp',
      '6-max ranges: range BB limp does not apply at 6-max',
      '6-max ranges: range undefined undefined does not apply at 6-max',
    ]);
    expect(problemsOf({ ...copyOf(), ranges: 'none' })).toHaveLength(36);
    const error = new RangeValidationError(['a', 'b']);
    expect(error.message).toBe('Invalid default ranges:\n- a\n- b');
  });

  it('default range content sanity', () => {
    const seen = new Set<string>();
    for (const range of SIX_MAX_RANGES.ranges) {
      const name = `${range.position} ${range.line}`;
      expect(words(range.justification), name).toBeGreaterThanOrEqual(15);
      expect(seen.has(range.justification), name).toBe(false);
      seen.add(range.justification);
      const band = BANDS[range.line][range.position] ?? FLAT_BANDS[range.line];
      if (band === undefined) throw new Error(`no band for ${name}`);
      const pct = width(range.classes);
      expect(pct, name).toBeGreaterThanOrEqual(band[0]);
      expect(pct, name).toBeLessThanOrEqual(band[1]);
      for (const hc of range.classes) expect(HAND_CLASSES).toContain(hc);
    }
    const of = (position: Position, line: PreflopLine) =>
      defaultRange(SIX_MAX_RANGES, position, line).classes;
    for (const position of ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as const) {
      const threeBet = of(position, 'three-bet');
      const fourBet = of(position, 'four-bet');
      expect(width(fourBet), position).toBeLessThanOrEqual(width(threeBet));
      for (const hc of fourBet) expect(threeBet.has(hc), `${position} ${hc}`).toBe(true);
    }
    const opens = (['UTG', 'HJ', 'CO', 'BTN'] as const).map((p) => width(of(p, 'open-raise')));
    expect(opens).toEqual([...opens].sort((a, b) => a - b));
    const bbRaise = of('BB', 'open-raise');
    for (const hc of of('BB', 'check')) expect(bbRaise.has(hc), hc).toBe(false);
  });
});
