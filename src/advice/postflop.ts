import type { Card } from '../engine/cards';
import type { Action } from '../engine/hand';
import type { PlayerView, PublicPlayer } from '../engine/player-view';
import { explainPostflop } from './explain';
import { computeEquity, type EquityInput, type EquityResult, type Range } from './equity';
import { callingRange, drawOuts, estimateOpponentRanges, unseenCombos } from './ranges';
import type { ExactOptions } from './recommend';

export type PostflopAdvice = 'fold' | 'check' | 'call' | 'bet' | 'raise';
/** Rule ids in evaluation order; each is documented in docs/advice/postflop-rules.md. */
export const POSTFLOP_RULE_IDS = [
  'value-bet',
  'check-free',
  'value-raise',
  'pot-odds-call',
  'implied-odds-call',
  'pot-odds-fold',
] as const;
/** Bet or raise for value when the rounded equity against the range that would call is above this percent. */
export const VALUE_THRESHOLD_PCT = 50;
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
  /** Method of the whole-range run (equityPct). */
  readonly equityMethod: 'exact' | 'sampled';
  /** Hero pot share against every live opponent's range that would call a bet/raise; percent, one decimal. */
  readonly equityVsCallingRangePct: number;
  /**
   * call ÷ (pot + call + bigBet × opponents not all in), percent one decimal; null unless something is owed, the
   * hero has outs, chips stay behind after the call and an opponent not all in can pay later.
   */
  readonly impliedRequiredEquityPct: number | null;
  /** drawOuts(holeCards, board): the outs counted; [] on the river or without a flush/open-ended draw. */
  readonly outs: readonly Card[];
  /** Plain-English reason, ≤ 3 sentences (REQ-037). */
  readonly explanation: string;
}

export interface PostflopOptions {
  /** Default computeEquity. Test seam and future range models; must be deterministic. */
  readonly equity?: (input: EquityInput) => EquityResult;
  /** 'unseen' (default): every unseen combo. 'actions': estimateOpponentRanges (TASK-7.5). */
  readonly opponentRanges?: 'unseen' | 'actions';
}

/** Percent with one decimal, half up: Math.round(fraction * 1000 + 1e-9) / 10. */
export function toPct(fraction: number): number {
  return Math.round(fraction * 1000 + 1e-9) / 10;
}

/** Equity for the first attempt that does not throw a RangeError; the last attempt's errors propagate (A-6). */
function withFallbacks(
  run: (opponents: readonly Range[]) => EquityResult,
  attempts: readonly (readonly Range[])[],
): EquityResult {
  for (let i = 0; ; i++) {
    try {
      return run(attempts[i] as readonly Range[]);
    } catch (error) {
      if (!(error instanceof RangeError) || i === attempts.length - 1) throw error;
    }
  }
}

/**
 * Bet or raise when the rounded equity against the ranges that would call is above VALUE_THRESHOLD_PCT and the
 * move is legal; else check when free, else call when the rounded equity % reaches the rounded required %, else
 * call when it reaches the rounded implied required % (a drawing hand), else fold.
 */
export function recommendPostflop<O extends object = PostflopOptions>(
  view: PlayerView,
  options?: ExactOptions<O, PostflopOptions>,
): PostflopRecommendation {
  const { equity = computeEquity, opponentRanges = 'unseen' }: PostflopOptions = options ?? {};
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

  const run = (opponents: readonly Range[]) =>
    equity({ hero: view.holeCards, board: view.board, opponents });
  const unseen = unseenCombos([...view.holeCards, ...view.board]);
  let attempts: (readonly Range[])[];
  if (opponentRanges === 'unseen') {
    attempts = [view.players.filter((p) => p.seat !== view.seat && !p.folded).map(() => unseen)];
  } else {
    const estimated = estimateOpponentRanges(view);
    attempts = [
      estimated.map((o) => o.combos),
      estimated.map((o) => o.start),
      estimated.map(() => unseen),
    ];
  }
  const opponents = (attempts[0] as readonly Range[]).length;
  const result = withFallbacks(run, attempts);
  const equityPct = toPct(result.hero.equity);
  const requiredEquityPct = owed > 0 ? toPct(callAmount / (pot + callAmount)) : 0;
  const outs = drawOuts(view.holeCards, view.board);
  const payers = view.players.filter((p) => p.seat !== view.seat && !p.folded && !p.allIn).length;
  const impliedRequiredEquityPct =
    owed > 0 && outs.length > 0 && payers > 0 && hero.stack - callAmount > 0
      ? toPct(callAmount / (pot + callAmount + view.stakes.bigBet * payers))
      : null;

  let equityVsCallingRangePct: number;
  try {
    const calling = attempts.map((ranges) => ranges.map((r) => callingRange(r, view.board)));
    equityVsCallingRangePct = toPct(withFallbacks(run, calling).hero.equity);
  } catch (error) {
    // A-7: many overlapping calling ranges can defeat the sampler; fall back to the whole-range number.
    if (!(error instanceof RangeError)) throw error;
    equityVsCallingRangePct = equityPct;
  }

  const aggressive = view.legalActions.find((a) => a.type === 'bet' || a.type === 'raise');
  const value =
    aggressive !== undefined &&
    Math.round(equityVsCallingRangePct * 10) > Math.round(VALUE_THRESHOLD_PCT * 10);

  let ruleId: PostflopRuleId;
  let action: PostflopAdvice;
  if (owed === 0 && value) {
    ruleId = 'value-bet';
    action = (aggressive as Action).type as 'bet' | 'raise';
  } else if (owed === 0) {
    ruleId = 'check-free';
    action = 'check';
  } else if (value) {
    ruleId = 'value-raise';
    action = 'raise';
  } else if (equityPct >= requiredEquityPct) {
    ruleId = 'pot-odds-call';
    action = 'call';
  } else if (impliedRequiredEquityPct !== null && equityPct >= impliedRequiredEquityPct) {
    ruleId = 'implied-odds-call';
    action = 'call';
  } else {
    ruleId = 'pot-odds-fold';
    action = 'fold';
  }

  const move = view.legalActions.find((a) => a.type === action);
  if (move === undefined) throw new Error(`No legal ${action} for seat ${view.seat}`);
  const rec = {
    basis: 'equity' as const,
    street,
    action,
    alternative: null,
    move,
    ruleId,
    equityPct,
    requiredEquityPct,
    callAmount,
    pot,
    opponents,
    equityMethod: result.method,
    equityVsCallingRangePct,
    impliedRequiredEquityPct,
    outs,
  };
  return { ...rec, explanation: explainPostflop(rec, VALUE_THRESHOLD_PCT) };
}
