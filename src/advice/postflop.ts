import type { Card } from '../engine/cards';
import type { Action } from '../engine/hand';
import type { PlayerView, PublicPlayer } from '../engine/player-view';
import { computeEquity, type EquityInput, type EquityResult, type HoleCards } from './equity';

export type PostflopAdvice = 'fold' | 'check' | 'call';
/** Rule ids in evaluation order; each is documented in docs/advice/postflop-rules.md. */
export const POSTFLOP_RULE_IDS = ['check-free', 'pot-odds-call', 'pot-odds-fold'] as const;
export type PostflopRuleId = (typeof POSTFLOP_RULE_IDS)[number];

export interface PostflopRecommendation {
  readonly basis: 'equity';
  readonly street: 'flop' | 'turn' | 'river';
  /** Legal for the view. */
  readonly action: PostflopAdvice;
  /** Always null in this slice (no acceptable alternatives postflop yet). */
  readonly alternative: PostflopAdvice | null;
  /** The element of view.legalActions whose type is `action`. */
  readonly move: Action;
  readonly ruleId: PostflopRuleId;
  /** Hero pot share against all live opponents, percent, one decimal (0..100). */
  readonly equityPct: number;
  /** call ÷ (pot + call) as a percent, one decimal; 0 when nothing is owed. */
  readonly requiredEquityPct: number;
  /** Chips the hero must add to call; 0 when nothing is owed. */
  readonly callAmount: number;
  /** Chips in the middle before the hero acts (all pots + all street contributions). */
  readonly pot: number;
  /** Live opponents the equity was computed against (1..9). */
  readonly opponents: number;
  readonly equityMethod: 'exact' | 'sampled';
}

export interface PostflopOptions {
  /** Default computeEquity. Test seam and future range models; must be deterministic. */
  readonly equity?: (input: EquityInput) => EquityResult;
}

/** Percent with one decimal, half up: Math.round(fraction * 1000 + 1e-9) / 10. */
export function toPct(fraction: number): number {
  return Math.round(fraction * 1000 + 1e-9) / 10;
}

/** Every two-card combo with neither card in `dead`, ascending [low, high]. */
function unseenCombos(dead: readonly Card[]): HoleCards[] {
  const combos: HoleCards[] = [];
  for (let a = 0; a < 52; a++) {
    if (dead.includes(a)) continue;
    for (let b = a + 1; b < 52; b++) {
      if (!dead.includes(b)) combos.push([a, b]);
    }
  }
  return combos;
}

/** Check when free, else call when the rounded equity % reaches the rounded required %, else fold. */
export function recommendPostflop(
  view: PlayerView,
  options: PostflopOptions = {},
): PostflopRecommendation {
  const street = view.street;
  if (street !== 'flop' && street !== 'turn' && street !== 'river') {
    throw new RangeError(`Postflop advice needs a flop, turn or river view, got ${street}`);
  }
  if (view.toAct !== view.seat) throw new RangeError(`Seat ${view.seat} is not to act`);

  const hero = view.players.find((p) => p.seat === view.seat) as PublicPlayer;
  const owed = view.currentBet - hero.streetContribution;
  const pot =
    view.pots.reduce((sum, p) => sum + p.amount, 0) +
    view.players.reduce((sum, p) => sum + p.streetContribution, 0);
  let callAmount = 0;
  if (owed > 0) {
    const call = view.legalActions.find((a) => a.type === 'call');
    if (call === undefined || call.type !== 'call') {
      throw new Error(`No legal call for seat ${view.seat}`);
    }
    callAmount = call.amount;
  }

  const range = unseenCombos([...view.holeCards, ...view.board]);
  const opponents = view.players.filter((p) => p.seat !== view.seat && !p.folded).map(() => range);
  const result = (options.equity ?? computeEquity)({
    hero: view.holeCards,
    board: view.board,
    opponents,
  });
  const equityPct = toPct(result.hero.equity);
  const requiredEquityPct = owed > 0 ? toPct(callAmount / (pot + callAmount)) : 0;

  let ruleId: PostflopRuleId;
  let action: PostflopAdvice;
  if (owed === 0) {
    ruleId = 'check-free';
    action = 'check';
  } else if (equityPct >= requiredEquityPct) {
    ruleId = 'pot-odds-call';
    action = 'call';
  } else {
    ruleId = 'pot-odds-fold';
    action = 'fold';
  }

  const move = view.legalActions.find((a) => a.type === action);
  if (move === undefined) throw new Error(`No legal ${action} for seat ${view.seat}`);
  return {
    basis: 'equity',
    street,
    action,
    alternative: null,
    move,
    ruleId,
    equityPct,
    requiredEquityPct,
    callAmount,
    pot,
    opponents: opponents.length,
    equityMethod: result.method,
  };
}
