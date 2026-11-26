import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  checkGoldenSpot,
  GOLDEN_STACK,
  GOLDEN_STAKES,
  GoldenSpotValidationError,
  parsePostflopGoldenSpots,
  type GoldenNumbers,
  type PostflopGoldenSpot,
} from '../../src/advice/golden';
import { gradeDecision, type ActionType } from '../../src/advice/grade';
import { recommend } from '../../src/advice/recommend';
import { parseCards, type Card } from '../../src/engine/cards';
import { applyAction, createHand, type HandState } from '../../src/engine/hand';
import { playerView } from '../../src/engine/player-view';
import { REPO_ROOT } from '../support/sandbox';

type RawSpot = Record<string, unknown>;
type RawFile = { spots: RawSpot[] } & Record<string, unknown>;

const readRaw = () =>
  JSON.parse(readFileSync(join(REPO_ROOT, 'tests/golden/postflop-spots.json'), 'utf8')) as RawFile;
const RAW = readRaw();
const SPOTS: readonly PostflopGoldenSpot[] = parsePostflopGoldenSpots(RAW);

function problemsOf(raw: unknown, advise?: Parameters<typeof parsePostflopGoldenSpots>[1]) {
  try {
    parsePostflopGoldenSpots(raw, advise);
  } catch (error) {
    expect(error).toBeInstanceOf(GoldenSpotValidationError);
    return (error as GoldenSpotValidationError).problems;
  }
  return [];
}

const fileWith = (...spots: RawSpot[]) => ({ ...RAW, spots });
const stub = (numbers: Omit<GoldenNumbers, 'action'>) => (): GoldenNumbers => ({
  action: 'call',
  ...numbers,
});

const JUSTIFICATION =
  'A probe spot for the validator that talks about equity and pot odds in enough words to pass.';
// 6-max: the button opens, the big blind calls; on the flop the big blind bets into the button.
const facingBet: RawSpot = {
  id: 'probe',
  seats: 6,
  position: 'BTN',
  street: 'flop',
  holeCards: 'Kh Qh',
  board: 'Ks 7d 2c',
  before: ['fold', 'fold', 'fold', 'raise', 'fold', 'call', 'bet'],
  action: 'call',
  justification: JUSTIFICATION,
};

/**
 * Seats 1..n, button 1, the hero dealt `cards` at its hole-card indexes (seat 2 is dealt first, the button last).
 * The board is not needed preflop.
 */
function preflopHand(n: number, hero: number, cards: readonly Card[]): HandState {
  const index = hero === 1 ? n - 1 : hero - 2;
  const rest = Array.from({ length: 52 }, (_, i) => i).filter((c) => !cards.includes(c));
  const deck = Array.from({ length: 52 }, (_, slot) =>
    slot === index ? cards[0] : slot === index + n ? cards[1] : rest.shift(),
  ) as Card[];
  return createHand({
    stakes: GOLDEN_STAKES,
    seats: Array.from({ length: n }, (_, i) => ({ seat: i + 1, stack: GOLDEN_STACK })),
    button: 1,
    deck,
  });
}

describe('postflop golden spot preflop lines', () => {
  it('AC#1 no postflop golden spot reaches its decision through a hero preflop action the chart grades as a Major error', () => {
    const majors: string[] = [];
    const empty: string[] = [];
    SPOTS.forEach((spot, i) => {
      const raw = RAW.spots[i] as RawSpot;
      const hero = spot.view.seat;
      let state = preflopHand(raw.seats as number, hero, parseCards(raw.holeCards as string));
      let decisions = 0;
      for (const [k, step] of (raw.before as ActionType[]).entries()) {
        if (state.street !== 'preflop') break;
        const view = playerView(state, state.toAct as number);
        if (state.toAct === hero) {
          decisions++;
          const rec = recommend(view);
          if (gradeDecision(rec, step).grade === 'major') {
            const cell =
              rec.basis === 'chart'
                ? `${rec.referenceSize} ${rec.position} ${rec.situation} ${rec.handClass}: ${rec.action}`
                : rec.action;
            majors.push(`${spot.id} step ${k + 1} "${step}" (${cell})`);
          }
        }
        const action = view.legalActions.find((a) => a.type === step);
        expect(action, `${spot.id} step ${k + 1}`).toBeDefined();
        const result = applyAction(state, action as NonNullable<typeof action>);
        expect(result.ok, `${spot.id} step ${k + 1}`).toBe(true);
        if (result.ok) state = result.state;
      }
      if (decisions === 0) empty.push(spot.id);
    });
    expect(empty).toEqual([]);
    expect(majors).toEqual([]);
  });

  it('AC#1 a spot whose hero preflop line is a Major error is rejected by the validator', () => {
    const clear = stub({ equityPct: 60, requiredEquityPct: 20, equityVsCallingRangePct: 30 });
    expect(problemsOf(fileWith({ ...facingBet, holeCards: '7h 2s' }), clear)).toEqual([
      'Golden spot probe: hero preflop step 4 "raise" is a Major error on the chart (6-max BTN unopened 72o: fold)',
    ]);
    expect(parsePostflopGoldenSpots(fileWith(facingBet), clear)).toHaveLength(1);
  });

  it('AC#1 re-authored spots keep the documented coverage, are clear-cut and match the advice', () => {
    // SPOTS is parsed with the real advice at load: it would have thrown on any problem.
    expect(SPOTS).toHaveLength(RAW.spots.length);
    const count = (key: (s: PostflopGoldenSpot) => string) => {
      const counts: Record<string, number> = {};
      for (const spot of SPOTS) counts[key(spot)] = (counts[key(spot)] ?? 0) + 1;
      return counts;
    };
    expect(SPOTS).toHaveLength(120);
    expect(count((s) => s.street)).toEqual({ flop: 45, turn: 40, river: 35 });
    expect(count((s) => String(s.view.players.length))).toEqual({ 6: 86, 2: 18, 9: 16 });
    expect(count((s) => s.action)).toEqual({ call: 27, raise: 24, bet: 23, check: 23, fold: 23 });
    const multiway = SPOTS.filter(
      (s) => s.view.players.filter((p) => p.seat !== s.view.seat && !p.folded).length >= 2,
    );
    expect(multiway).toHaveLength(20);
    expect(SPOTS.filter((s) => s.observed.length > 0)).toHaveLength(4);
    expect(SPOTS.map((s) => checkGoldenSpot(s)).filter((m) => m !== null)).toEqual([]);
  });

  it('AC#2 6max-turn-bb-raise-92o names kings full, not a set of kings', () => {
    const spot = SPOTS.find((s) => s.id === '6max-turn-bb-raise-92o');
    expect(spot).toBeDefined();
    expect(spot?.justification).toContain('kings full');
    expect(spot?.justification).not.toMatch(/set of kings/i);
  });

  it('AC#3 a gradeDecision error in the clear-cut check is listed as a problem for that spot', () => {
    const nan = stub({ equityPct: Number.NaN, requiredEquityPct: 31, equityVsCallingRangePct: 30 });
    let thrown: unknown;
    try {
      parsePostflopGoldenSpots(fileWith(facingBet), nan);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(GoldenSpotValidationError);
    expect(thrown).not.toBeInstanceOf(RangeError);
    expect((thrown as GoldenSpotValidationError).problems).toEqual([
      'Golden spot probe: clear-cut check failed (equityPct must be a finite number, got NaN)',
    ]);
  });
});
