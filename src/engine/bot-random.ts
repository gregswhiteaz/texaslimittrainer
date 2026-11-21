// Bot randomness (REQ-028.1): every draw comes from the hand's replay code and the bot's seat.
import type { ReplayCode } from './deck';
import type { SeatNumber } from './hand';
import type { PlayerView } from './player-view';
import { fnv1a32, Xoshiro128 } from './seeded-random';

const MAX_SEED = 0xffffffff;

/** The generator for `seat` in the hand dealt from `code`: new Xoshiro128(fnv1a32(`${code}/${seat}`)). */
export function seatGenerator(code: ReplayCode, seat: SeatNumber): Xoshiro128 {
  return new Xoshiro128(fnv1a32(`${code}/${seat}`));
}

/** Seat's earlier non-blind actions in view.actions (0 for its first decision). */
export function botDecisionIndex(view: PlayerView): number {
  return view.actions.filter(
    (a) => a.seat === view.seat && a.type !== 'small-blind' && a.type !== 'big-blind',
  ).length;
}

/** The (botDecisionIndex(view)+1)-th nextUint32 of seatGenerator(code, view.seat). Unsigned 32-bit. Pure. */
export function botDecisionSeed(code: ReplayCode, view: PlayerView): number {
  const generator = seatGenerator(code, view.seat);
  for (let k = botDecisionIndex(view); k > 0; k--) generator.nextUint32();
  return generator.nextUint32();
}

/** new Xoshiro128(seed). RangeError unless seed is an integer from 0 to 4294967295. */
export function botRandom(seed: number): Xoshiro128 {
  if (!Number.isInteger(seed) || seed < 0 || seed > MAX_SEED) {
    throw new RangeError(`Bot seed must be an integer from 0 to ${MAX_SEED}, got ${seed}`);
  }
  return new Xoshiro128(seed);
}
