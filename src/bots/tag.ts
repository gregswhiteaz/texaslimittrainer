import type { Action } from '../engine/hand';
import type { PlayerView, PublicPlayer, SeatPolicy } from '../engine/player-view';
import type { EquityInput, EquityResult } from '../advice/equity';
import { recommend, type RecommendOptions } from '../advice/recommend';

/** The bot's seeded generator (botRandom in src/engine/bot-random.ts), typed by shape: bot code sees only PlayerView types from the engine. */
export interface BotRandom {
  nextUint32(): number;
}

/** `random` is the bot's seeded generator (REQ-028.1), reserved for TASK-6.2 mixing; TAG is pure and ignores it. */
export type TagOptions = RecommendOptions & { readonly random?: BotRandom };

/** Equity stand-in for postflop decisions with nothing owed: rule check-free fires before equity is read. */
export function FREE_CHECK_EQUITY(input: EquityInput): EquityResult {
  const zero = { win: 0, tie: 0, equity: 0 };
  return { hero: zero, opponents: input.opponents.map(() => zero), method: 'exact', trials: 0 };
}

/** The TAG decision: the advice engine's recommended move for `view`. Errors from recommend propagate. */
export function decideTag(view: PlayerView, options: TagOptions = {}): Action {
  const hero: PublicPlayer | undefined = view.players.find((p) => p.seat === view.seat);
  const postflop = view.street === 'flop' || view.street === 'turn' || view.street === 'river';
  if (postflop && hero !== undefined && view.currentBet - hero.streetContribution === 0) {
    // Skips the equity run the free check never reads (the move is identical).
    return recommend(view, { ...options, equity: FREE_CHECK_EQUITY }).move;
  }
  return recommend(view, options).move;
}

/** decideTag as a seat policy (no options). */
export const tagPolicy: SeatPolicy = (view) => decideTag(view);
