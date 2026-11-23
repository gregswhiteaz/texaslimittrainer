import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { EquityInput, EquityResult } from '../../src/advice/equity';
import { POSTFLOP_RULE_IDS, recommendPostflop, toPct } from '../../src/advice/postflop';
import { parseCards, type Card } from '../../src/engine/cards';
import {
  applyAction,
  createHand,
  legalActions,
  type Action,
  type HandState,
  type SeatNumber,
} from '../../src/engine/hand';
import { playerView } from '../../src/engine/player-view';
import { REPO_ROOT } from '../support/sandbox';

const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
/** Button 1: SB 2, BB 3, UTG 4, HJ 5, CO 6, BTN 1. Hole cards go to deck[i] and deck[i + 6]. */
const SEATS: readonly SeatNumber[] = [1, 2, 3, 4, 5, 6];
const HERO = 3;
/** Hero (seat 3, deal index 1) hole-card positions, then flop 13-15, turn 17, river 19. */
const HERO_POSITIONS = [1, 7];
const FLOP_POSITIONS = [13, 14, 15];
const TURN_POSITION = 17;

type Step = [SeatNumber, Action['type'], number?];
const f = (seat: SeatNumber): Step => [seat, 'fold'];
const k = (seat: SeatNumber): Step => [seat, 'check'];
const c = (seat: SeatNumber, amount: number): Step => [seat, 'call', amount];
const b = (seat: SeatNumber, amount: number): Step => [seat, 'bet', amount];

/** 4 fold, 5 fold, 6 call, 1 call, 2 complete, 3 check: pot 16, live seats 1, 2, 3, 6. */
const PREFLOP: Step[] = [f(4), f(5), c(6, 4), c(1, 4), c(2, 2), k(3)];
const FLOP_BET: Step[] = [...PREFLOP, b(2, 4)];
const FLOP_CHECK: Step[] = [...PREFLOP, k(2)];
const TURN_BET: Step[] = [...PREFLOP, k(2), k(3), k(6), k(1), b(2, 8)];

const ALL_CARDS: readonly Card[] = Array.from({ length: 52 }, (_, i) => i);

/** A deck with `fixed[position] = card`; the remaining cards fill the other positions in order. */
function deckWith(fixed: ReadonlyMap<number, Card>, rest?: readonly Card[]): Card[] {
  const used = new Set(fixed.values());
  const filler = [...(rest ?? ALL_CARDS.filter((card) => !used.has(card)))];
  return Array.from({ length: 52 }, (_, i) => fixed.get(i) ?? (filler.shift() as Card));
}

/** Hero `hero` and flop/turn cards from `board` at their deal positions. */
function spotDeck(hero: string, board: string): Map<number, Card> {
  const positions = [...HERO_POSITIONS, ...FLOP_POSITIONS, TURN_POSITION];
  const cards = parseCards(`${hero} ${board}`);
  return new Map(cards.map((card, i) => [positions[i] as number, card]));
}

function stateAfter(deck: readonly Card[], steps: Step[]): HandState {
  let state = createHand({
    stakes: STAKES_4_8,
    seats: SEATS.map((seat) => ({ seat, stack: 160 })),
    button: 1,
    deck,
  });
  for (const [seat, type, amount] of steps) {
    const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
    const result = applyAction(state, action);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    state = result.state;
  }
  return state;
}

const heroView = (deck: readonly Card[], steps: Step[]) =>
  playerView(stateAfter(deck, steps), HERO);

/** An equity function that always reports `equity` for the hero and records its inputs. */
function fixedEquity(equity: number) {
  const calls: EquityInput[] = [];
  const fn = (input: EquityInput): EquityResult => {
    calls.push(input);
    return {
      hero: { win: equity, tie: 0, equity },
      opponents: input.opponents.map(() => ({ win: 0, tie: 0, equity: 0 })),
      method: 'sampled',
      trials: 1,
    };
  };
  return { fn, calls };
}

const RULE_HEADING = /^### Rule `([a-z][a-z0-9-]*)`$/gm;

/** Mismatches between the rules document, the unit test file and the engine's rule ids. */
function ruleProblems(
  docText: string,
  unitTestText: string,
  engineIds: readonly string[],
): string[] {
  const documented = [...docText.matchAll(RULE_HEADING)].map((m) => m[1] as string);
  const problems: string[] = [];
  for (const id of engineIds) {
    if (!documented.includes(id)) {
      problems.push(`Rule ${id} is returned by the engine but not documented`);
    }
  }
  for (const id of documented) {
    if (!engineIds.includes(id)) {
      problems.push(`Rule ${id} is documented but not returned by the engine`);
    }
    if (!unitTestText.includes(`describe('rule ${id}'`)) {
      problems.push(`Rule ${id} has no unit test`);
    }
  }
  return problems;
}

describe('postflop advice acceptance', () => {
  it('AC#1 equity equal to required equity recommends call', () => {
    const deck = deckWith(spotDeck('Ah 5h', 'Kh 9h 2c'));
    const view = heroView(deck, FLOP_BET);
    const spy = fixedEquity(4 / 24);
    const result = recommendPostflop(view, { equity: spy.fn });
    expect(result).toStrictEqual({
      basis: 'equity',
      street: 'flop',
      action: 'call',
      alternative: null,
      move: { seat: 3, type: 'call', amount: 4 },
      ruleId: 'pot-odds-call',
      equityPct: 16.7,
      requiredEquityPct: 16.7,
      callAmount: 4,
      pot: 20,
      opponents: 3,
      equityMethod: 'sampled',
      equityVsCallingRangePct: 16.7,
    });
    // Whole-range run, then the calling-range run (TASK-7.8).
    expect(spy.calls).toHaveLength(2);
    const input = spy.calls[0] as EquityInput;
    expect(input.hero).toEqual(parseCards('Ah 5h'));
    expect(input.board).toEqual(parseCards('Kh 9h 2c'));
    expect(input.opponents).toHaveLength(3);
    const dead = parseCards('Ah 5h Kh 9h 2c');
    for (const range of input.opponents) {
      expect(range).toHaveLength(1081);
      for (const combo of range) {
        expect(dead).not.toContain(combo[0]);
        expect(dead).not.toContain(combo[1]);
      }
    }
  });

  it('AC#2 equity 0.1 points below required recommends fold', () => {
    const view = heroView(deckWith(spotDeck('Ah 5h', 'Kh 9h 2c')), FLOP_BET);
    const result = recommendPostflop(view, { equity: fixedEquity(4 / 24 - 0.001).fn });
    expect(result).toMatchObject({
      action: 'fold',
      ruleId: 'pot-odds-fold',
      equityPct: 16.6,
      requiredEquityPct: 16.7,
    });
    expect(result.move).toStrictEqual({ seat: 3, type: 'fold' });
  });

  it('AC#3 any postflop decision returns action, equity %, required equity % and rule id', () => {
    const oneDecimal = (x: number) => Math.round(x * 10) / 10;
    fc.assert(
      fc.property(
        fc.shuffledSubarray([...ALL_CARDS], { minLength: 52, maxLength: 52 }),
        fc.array(fc.nat(), { minLength: 40, maxLength: 40 }),
        fc.nat({ max: 11 }),
        (deck, choices, stopAt) => {
          let state = stateAfter(deck, []);
          let postflopDecisions = 0;
          let step = 0;
          while (state.toAct !== null) {
            if (state.street !== 'preflop') {
              if (postflopDecisions === stopAt) break;
              postflopDecisions++;
            }
            const options = legalActions(state).filter((a) => a.type !== 'fold');
            const action = options[(choices[step++] ?? 0) % options.length] as Action;
            const result = applyAction(state, action);
            if (!result.ok) throw new Error(result.error.message);
            state = result.state;
          }
          fc.pre(state.toAct !== null);
          const view = playerView(state, state.toAct as SeatNumber);
          const advice = recommendPostflop(view);
          expect(['fold', 'check', 'call', 'bet', 'raise']).toContain(advice.action);
          expect(view.legalActions).toContainEqual(advice.move);
          expect(advice.move.type).toBe(advice.action);
          expect(POSTFLOP_RULE_IDS).toContain(advice.ruleId);
          for (const pct of [advice.equityPct, advice.requiredEquityPct]) {
            expect(pct).toBeGreaterThanOrEqual(0);
            expect(pct).toBeLessThanOrEqual(100);
            expect(pct).toBe(oneDecimal(pct));
          }
          if (advice.callAmount > 0) {
            expect(advice.requiredEquityPct).toBe(
              toPct(advice.callAmount / (advice.pot + advice.callAmount)),
            );
          }
        },
      ),
      { numRuns: 40, seed: 7303 },
    );
  });

  it('AC#4 no bet to face recommends check with 0% required equity', () => {
    const view = heroView(deckWith(spotDeck('Ah 5h', 'Kh 9h 2c')), FLOP_CHECK);
    const result = recommendPostflop(view);
    expect(result).toMatchObject({
      action: 'check',
      ruleId: 'check-free',
      requiredEquityPct: 0,
      callAmount: 0,
      pot: 16,
    });
    expect(result.equityPct).toBeGreaterThan(0);
    expect(result.equityPct).toBeLessThan(100);
    expect(result.move).toStrictEqual({ seat: 3, type: 'check' });

    const weak = recommendPostflop(view, { equity: fixedEquity(0.01).fn });
    expect(weak.action).toBe('check');
    expect(weak.ruleId).toBe('check-free');
  });

  it('AC#5 every documented rule has a unit test and every engine rule is documented', () => {
    const doc = readFileSync(join(REPO_ROOT, 'docs/advice/postflop-rules.md'), 'utf8');
    const unit = readFileSync(join(REPO_ROOT, 'tests/advice/postflop.test.ts'), 'utf8');
    const documented = [...doc.matchAll(RULE_HEADING)].map((m) => m[1]);
    expect(new Set(documented)).toEqual(new Set(POSTFLOP_RULE_IDS));
    expect(ruleProblems(doc, unit, POSTFLOP_RULE_IDS)).toEqual([]);

    const [first] = POSTFLOP_RULE_IDS;
    expect(
      ruleProblems(doc, unit.replaceAll(`describe('rule ${first}'`, ''), POSTFLOP_RULE_IDS),
    ).toEqual([`Rule ${first} has no unit test`]);
    expect(ruleProblems(doc, unit, [...POSTFLOP_RULE_IDS, 'bluff'])).toEqual([
      'Rule bluff is returned by the engine but not documented',
    ]);
    const extra = `${doc}\n### Rule \`slow-play\`\n`;
    expect(ruleProblems(extra, unit, POSTFLOP_RULE_IDS)).toEqual([
      'Rule slow-play is documented but not returned by the engine',
      'Rule slow-play has no unit test',
    ]);
  });

  it("AC#6 other players' and undealt cards never change advice or numbers", () => {
    const spots: [Step[], number[], string, string][] = [
      [FLOP_BET, [...HERO_POSITIONS, ...FLOP_POSITIONS], 'Ah 5h', 'Kh 9h 2c'],
      [TURN_BET, [...HERO_POSITIONS, ...FLOP_POSITIONS, TURN_POSITION], 'Ah 5h', 'Kh 9h 2c 7d'],
    ];
    for (const [steps, fixedPositions, hero, board] of spots) {
      const fixed = spotDeck(hero, board);
      expect([...fixed.keys()]).toEqual(fixedPositions);
      const base = recommendPostflop(heroView(deckWith(fixed), steps));
      const others = ALL_CARDS.filter((card) => ![...fixed.values()].includes(card));
      fc.assert(
        fc.property(
          fc.shuffledSubarray(others, { minLength: others.length, maxLength: others.length }),
          (permuted) => {
            const view = heroView(deckWith(fixed, permuted), steps);
            expect(recommendPostflop(view)).toStrictEqual(base);
          },
        ),
        { numRuns: 20 },
      );
    }

    const turn = recommendPostflop(heroView(deckWith(spotDeck('Ah 5h', 'Kh 9h 2c 7d')), TURN_BET));
    expect(turn).toMatchObject({ street: 'turn', callAmount: 8, pot: 24, requiredEquityPct: 25 });

    const draw = recommendPostflop(heroView(deckWith(spotDeck('Ah 5h', 'Kh 9h 2c')), FLOP_BET));
    const junk = recommendPostflop(heroView(deckWith(spotDeck('7c 3d', 'Kh 9h 2c')), FLOP_BET));
    expect(junk.equityPct).not.toBe(draw.equityPct);
  });
});
