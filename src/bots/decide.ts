import type { Action } from '../engine/hand';
import type { PlayerView } from '../engine/player-view';
import { decideCallingStation } from './calling-station';
import { decideManiac } from './maniac';
import { decideRock } from './rock';
import type { StyleName } from './style';
import { decideTag, type BotRandom } from './tag';

/** The style's bot decision. The Rock draws nothing, so its seat ignores the generator. */
export function decideStyle(view: PlayerView, style: StyleName, random: BotRandom): Action {
  if (style === 'Rock') return decideRock(view);
  if (style === 'Maniac') return decideManiac(view, { random });
  if (style === 'Calling station') return decideCallingStation(view, { random });
  return decideTag(view, { random });
}
