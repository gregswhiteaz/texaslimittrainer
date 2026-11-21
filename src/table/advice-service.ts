import type { Action } from '../engine/hand';
import type { PlayerView } from '../engine/player-view';
import { decideTag } from '../bots/tag';
import { recommend, type Recommendation } from '../advice/recommend';
import { gradeView, type ActionType, type GradeResult } from '../advice/grade';
import type { BotStyle } from './session';

/** Plain structured-clone data only: one PlayerView plus the bot style or user action (D-1). */
export type AdviceRequest =
  | {
      readonly id: number;
      readonly kind: 'bot';
      readonly view: PlayerView;
      readonly style: BotStyle;
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
      readonly id: number;
      readonly ok: false;
      readonly error: { readonly name: string; readonly message: string };
    };
export interface AdviceDeps {
  readonly decideBot?: (view: PlayerView, style: BotStyle) => Action;
}

/** Every style decides with decideTag until E06 (A-1). */
const decideBotDefault = (view: PlayerView): Action => decideTag(view);

/** Never throws: every error (thrown by advice code or an unknown kind) becomes ok:false. */
export function handleAdviceRequest(
  request: AdviceRequest,
  { decideBot = decideBotDefault }: AdviceDeps = {},
): AdviceResponse {
  const { id } = request;
  try {
    switch (request.kind) {
      case 'bot':
        return { id, ok: true, value: decideBot(request.view, request.style) };
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
