import { describe, expect, it } from 'vitest';
import type { EquityInput, EquityResult } from '../../src/advice/equity';
import { recommend } from '../../src/advice/recommend';
import { CALLING_STATION_STYLE } from '../../src/bots/calling-station';
import { MANIAC_STYLE } from '../../src/bots/maniac';
import { ROCK_STYLE, decideRock } from '../../src/bots/rock';
import { StyleValidationError, parseStyle } from '../../src/bots/style';
import { BOT_EQUITY, TAG_STYLE } from '../../src/bots/tag';
import { parseCards, type Card } from '../../src/engine/cards';
import {
  applyAction,
  createHand,
  type Action,
  type HandState,
  type SeatNumber,
} from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';
import rock from '../../src/bots/styles/rock.json' with { type: 'json' };

const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
/** Button 1: SB 2, BB 3, UTG 4, HJ 5, CO 6, BTN 1. Seat s gets deck[i] and deck[i + 6], i = deal index. */
const SEATS: readonly SeatNumber[] = [1, 2, 3, 4, 5, 6];
const DEAL_INDEX: Readonly<Record<number, number>> = { 2: 0, 3: 1, 4: 2, 5: 3, 6: 4, 1: 5 };
const FLOP_POSITIONS = [13, 14, 15];
const ALL_CARDS: readonly Card[] = Array.from({ length: 52 }, (_, i) => i);

type Step = [SeatNumber, Action['type'], number?];
/** Everyone folds to the small blind (2), who completes; the big blind (3) checks. Seat 2 acts first on the flop. */
const HEADS_UP: Step[] = [
  [4, 'fold'],
  [5, 'fold'],
  [6, 'fold'],
  [1, 'fold'],
  [2, 'call', 2],
  [3, 'check'],
];

/** A deck with `seat`'s hole cards and the flop at their deal positions; the rest ascending. */
function spotDeck(seat: SeatNumber, hole: string, flop: string): Card[] {
  const i = DEAL_INDEX[seat] as number;
  const cards = parseCards(`${hole} ${flop}`);
  const positions = [i, i + 6, ...FLOP_POSITIONS];
  const placed = new Map(cards.map((card, j) => [positions[j] as number, card]));
  const filler = ALL_CARDS.filter((card) => !cards.includes(card));
  return Array.from({ length: 52 }, (_, p) => placed.get(p) ?? (filler.shift() as Card));
}

function viewAt(seat: SeatNumber, hole: string, steps: Step[]): PlayerView {
  let state: HandState = createHand({
    stakes: STAKES_4_8,
    seats: SEATS.map((s) => ({ seat: s, stack: 160 })),
    button: 1,
    deck: spotDeck(seat, hole, 'Ks 8d 7c'),
  });
  for (const [s, type, amount] of steps) {
    const action = (amount === undefined ? { seat: s, type } : { seat: s, type, amount }) as Action;
    const result = applyAction(state, action);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    state = result.state;
  }
  return playerView(state, seat);
}

/** Seat 2 first to act on the flop: nothing owed. */
const free = (hole = '8s 8c'): PlayerView => viewAt(2, hole, HEADS_UP);
/** Seat 3 after seat 2 bets 4 on the flop: a bet owed. */
const facing = (): PlayerView => viewAt(3, 'As Kc', [...HEADS_UP, [2, 'bet', 4]]);

/** Every equity run returns `pct` percent for the hero. */
const fixed =
  (pct: number) =>
  (input: EquityInput): EquityResult => ({
    hero: { win: pct / 100, tie: 0, equity: pct / 100 },
    opponents: input.opponents.map(() => ({ win: 0, tie: 0, equity: 0 })),
    method: 'exact',
    trials: 1,
  });

function legal(view: PlayerView, type: Action['type']): Action {
  const move = view.legalActions.find((a) => a.type === type);
  if (move === undefined) throw new Error(`no legal ${type}`);
  return move;
}

interface RawRock {
  postflopValue?: unknown;
  [field: string]: unknown;
}
const raw = (): RawRock => structuredClone(rock) as RawRock;
const withValue = (value: unknown): RawRock => ({ ...raw(), postflopValue: value });
const JUSTIFICATION = (rock as { postflopValue: { justification: string } }).postflopValue
  .justification;

function problemsOf(input: unknown): readonly string[] {
  try {
    parseStyle(input, 'rock.json');
  } catch (error) {
    expect(error).toBeInstanceOf(StyleValidationError);
    return (error as StyleValidationError).problems;
  }
  throw new Error('expected a StyleValidationError');
}

const words = (text: string): number => (text.match(/\p{L}+/gu) ?? []).length;

describe('Rock postflop value bar (TASK-6.16)', () => {
  it('the Rock bets or raises after the flop only above its 75% value bar', () => {
    const open = free();
    for (const pct of [75.1, 75, 60]) {
      expect(recommend(open, { equity: fixed(pct) }).action).toBe('bet');
    }
    expect(decideRock(open, { equity: fixed(75.1) })).toStrictEqual(legal(open, 'bet'));
    expect(decideRock(open, { equity: fixed(75) })).toStrictEqual(legal(open, 'check'));
    expect(decideRock(open, { equity: fixed(60) })).toStrictEqual(legal(open, 'check'));

    const owed = facing();
    for (const pct of [75.1, 75]) {
      expect(recommend(owed, { equity: fixed(pct) }).action).toBe('raise');
    }
    expect(decideRock(owed, { equity: fixed(75.1) })).toStrictEqual(legal(owed, 'raise'));
    expect(decideRock(owed, { equity: fixed(75) })).toStrictEqual(legal(owed, 'call'));
    expect(legal(owed, 'call')).toStrictEqual({ seat: 3, type: 'call', amount: 4 });

    // Advice of check, call or fold is played unchanged, whatever the equity.
    for (const [view, pct, action] of [
      [open, 40, 'check'],
      [owed, 40, 'call'],
      [owed, 10, 'fold'],
    ] as const) {
      const rec = recommend(view, { equity: fixed(pct) });
      expect(rec.action).toBe(action);
      expect(decideRock(view, { equity: fixed(pct) })).toStrictEqual(rec.move);
    }

    // The locked heads-up spot: 8s8c on Ks 8d 7c still bets $4 with the bots' equity.
    expect(decideRock(free('8s 8c'))).toStrictEqual({ seat: 2, type: 'bet', amount: 4 });
    expect(recommend(free('8s 8c'), { equity: BOT_EQUITY }).move).toStrictEqual({
      seat: 2,
      type: 'bet',
      amount: 4,
    });
  });

  it('the Rock style file holds a justified postflop value bar and the other styles none', () => {
    expect(ROCK_STYLE.postflopValue).toStrictEqual({
      thresholdPct: 75,
      justification: JUSTIFICATION,
    });
    expect(words(JUSTIFICATION)).toBeGreaterThanOrEqual(10);
    expect(words(ROCK_STYLE.description)).toBeGreaterThanOrEqual(15);
    expect(ROCK_STYLE.description).toContain(
      'after the flop it bets or raises only with very strong hands',
    );
    // Since TASK-6.17 the Calling station has its own bar (88); TAG and the Maniac have none.
    for (const [style, threshold] of [
      [TAG_STYLE, null],
      [MANIAC_STYLE, null],
      [CALLING_STATION_STYLE, 88],
    ] as const) {
      expect(style.postflopValue?.thresholdPct ?? null).toBe(threshold);
    }
  });

  it('a bad postflopValue block is rejected with a clear problem', () => {
    const range = 'rock.json: style Rock postflopValue must have a thresholdPct from 50 to 100';
    expect(problemsOf(withValue(7))).toEqual([
      'rock.json: style Rock postflopValue must be an object',
    ]);
    for (const pct of [49.9, 100.1, '75', null]) {
      expect(problemsOf(withValue({ thresholdPct: pct, justification: JUSTIFICATION }))).toEqual([
        range,
      ]);
    }
    const nine = 'the Rock bets only big hands after the flop';
    expect(words(nine)).toBe(9);
    expect(problemsOf(withValue({ thresholdPct: 75, justification: nine }))).toEqual([
      'rock.json: style Rock postflopValue has no justification (at least 10 words)',
    ]);
    // Every problem is reported together.
    expect(problemsOf(withValue({ thresholdPct: 101, justification: nine }))).toEqual([
      range,
      'rock.json: style Rock postflopValue has no justification (at least 10 words)',
    ]);
    for (const pct of [50, 100]) {
      const parsed = parseStyle(
        withValue({ thresholdPct: pct, justification: JUSTIFICATION }),
        'rock.json',
      );
      expect(parsed.postflopValue?.thresholdPct).toBe(pct);
    }
  });
});
