import type { ReplayCode } from '../engine/deck';
import type { SeatPolicy } from '../engine/player-view';
import type { Xoshiro128 } from '../engine/seeded-random';
import { botDecisionSeed, botRandom } from '../engine/bot-random';
import { decideTag } from '../bots/tag';

export { seatGenerator } from '../engine/bot-random';

/** TAG with the app worker's per-decision generator: botRandom(botDecisionSeed(code, view)). */
export function seededTagPolicy(code: ReplayCode): SeatPolicy {
  return (view) => decideTag(view, { random: botRandom(botDecisionSeed(code, view)) });
}

/** M1 seeded random-move policy: uniform over view.legalActions (the engine enforces the 4-bet cap).
 *  Throws RangeError if no action is available (only possible when called for a seat not to act). */
export function randomMovePolicy(rng: Xoshiro128): SeatPolicy {
  return (view) => {
    const allowed = view.legalActions;
    if (allowed.length === 0) throw new RangeError(`Seat ${view.seat} has no action to choose`);
    return allowed[rng.nextInt(allowed.length)] as (typeof allowed)[number];
  };
}
