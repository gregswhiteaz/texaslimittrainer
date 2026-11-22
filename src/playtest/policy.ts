import type { ReplayCode } from '../engine/deck';
import type { SeatNumber } from '../engine/hand';
import type { SeatPolicy } from '../engine/player-view';
import type { Xoshiro128 } from '../engine/seeded-random';
import { botDecisionSeed, botRandom, seatGenerator } from '../engine/bot-random';
import { decideStyle } from '../bots/decide';
import { seatLineUp, type LineUpPreset, type LineUpSeat } from '../bots/lineup';
import { decideTag } from '../bots/tag';

export { seatGenerator };

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

/** Seat 1 = user (seededTagPolicy), seats 2..size = seatLineUp(preset, size, 1) styles, each deciding with
 *  botRandom(botDecisionSeed(code, view)); but in a hand whose view.players.length !== 6 every seat plays
 *  randomMovePolicy(seatGenerator(code, seat)) (D-2: the advice has only a 6-max chart). Throws RangeError via
 *  seatLineUp for a bad size. */
export function lineUpPolicyFactory(
  preset: LineUpPreset,
  size: number,
): (code: ReplayCode, seat: SeatNumber) => SeatPolicy {
  const lineUp = seatLineUp(preset, size, 1);
  return (code, seat) => {
    const { style } = lineUp[seat - 1] as LineUpSeat;
    const styled: SeatPolicy =
      style === null
        ? seededTagPolicy(code)
        : (view) => decideStyle(view, style, botRandom(botDecisionSeed(code, view)));
    const random = randomMovePolicy(seatGenerator(code, seat));
    return (view) => (view.players.length === 6 ? styled(view) : random(view));
  };
}
