import type { Action } from '../engine/hand';
import type { PlayerView } from '../engine/player-view';
import type { Xoshiro128 } from '../engine/seeded-random';
import { botRandom, isBotSeed } from '../engine/bot-random';
import { decideTag } from '../bots/tag';
import { decideCallingStation } from '../bots/calling-station';
import { decideManiac } from '../bots/maniac';
import { recommend, type Recommendation } from '../advice/recommend';
import { gradeView, type ActionType, type GradeResult } from '../advice/grade';
import type { BotStyle } from './session';

/**
 * Plain structured-clone data only: one PlayerView plus the bot style and seed or the user action (D-1).
 * The bot seed is derived on the main thread (botDecisionSeed); the replay code never crosses.
 */
export type AdviceRequest =
  | {
      readonly id: number;
      readonly kind: 'bot';
      readonly view: PlayerView;
      readonly style: BotStyle;
      /** Unsigned 32-bit seed of the bot's generator (botRandom). */
      readonly seed: number;
    }
  | { readonly id: number; readonly kind: 'recommend'; readonly view: PlayerView }
  | {
      readonly id: number;
      readonly kind: 'grade';
      readonly view: PlayerView;
      readonly userAction: ActionType;
    };
export type AdviceValue = Action | Recommendation | GradeResult<Recommendation>;
export type AdviceResponse =
  | { readonly id: number; readonly ok: true; readonly value: AdviceValue }
  | {
      /** null when the request carried no numeric id. */
      readonly id: number | null;
      readonly ok: false;
      readonly error: { readonly name: string; readonly message: string };
    };
export interface AdviceDeps {
  readonly decideBot?: (view: PlayerView, style: BotStyle, random: Xoshiro128) => Action;
}

/** Maniac and Calling station seats decide with their own bots; every other style with decideTag until its bot lands. */
const decideBotDefault = (view: PlayerView, style: BotStyle, random: Xoshiro128): Action => {
  if (style === 'Maniac') return decideManiac(view, { random });
  if (style === 'Calling station') return decideCallingStation(view, { random });
  return decideTag(view, { random });
};

/** Never throws: every error (malformed request, unknown kind or thrown by advice code) becomes ok:false. */
export function handleAdviceRequest(
  request: AdviceRequest,
  { decideBot = decideBotDefault }: AdviceDeps = {},
): AdviceResponse {
  let id: number | null = null;
  try {
    // Messages cross a worker boundary, so the shape is checked rather than trusted.
    const raw: unknown = request;
    if (typeof raw !== 'object' || raw === null || !('id' in raw) || typeof raw.id !== 'number') {
      throw new TypeError('Malformed advice request');
    }
    id = request.id;
    switch (request.kind) {
      case 'bot': {
        if (!isBotSeed(request.seed)) throw new TypeError('Malformed bot request seed');
        const random = botRandom(request.seed);
        return { id, ok: true, value: decideBot(request.view, request.style, random) };
      }
      case 'recommend':
        return { id, ok: true, value: recommend(request.view) };
      case 'grade':
        return { id, ok: true, value: gradeView(request.view, request.userAction) };
      default: {
        const kind = (request as { kind: unknown }).kind;
        throw new RangeError(`Unknown advice request kind: ${String(kind)}`);
      }
    }
  } catch (thrown) {
    const error =
      thrown instanceof Error
        ? { name: thrown.name, message: thrown.message }
        : { name: 'Error', message: String(thrown) };
    return { id, ok: false, error };
  }
}
