import type { ReplayCode } from '../engine/deck';
import type { SeatNumber } from '../engine/hand';
import type { SeatPolicy } from '../engine/player-view';
import { fnv1a32, Xoshiro128 } from '../engine/seeded-random';

/** The policy generator for `seat` in the hand dealt from `code`: new Xoshiro128(fnv1a32(`${code}/${seat}`)). */
export function seatGenerator(code: ReplayCode, seat: SeatNumber): Xoshiro128 {
  return new Xoshiro128(fnv1a32(`${code}/${seat}`));
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
