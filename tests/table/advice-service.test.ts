import { describe, expect, it } from 'vitest';
import { gradeView } from '../../src/advice/grade';
import { recommend } from '../../src/advice/recommend';
import { decideTag } from '../../src/bots/tag';
import { handReplayCode, playHand } from '../../src/playtest/runner';
import type { PlayerView } from '../../src/engine/player-view';
import { handleAdviceRequest, type AdviceRequest } from '../../src/table/advice-service';

/** The first preflop view and the first flop view of a seat to act, from all-TAG playtest hands. */
function views(): { preflop: PlayerView; flop: PlayerView } {
  for (let k = 1; k <= 50; k++) {
    const seen: PlayerView[] = [];
    playHand(handReplayCode(7, k), 6, 6, k, {
      makePolicy: () => (view) => {
        seen.push(view);
        return decideTag(view);
      },
    });
    const preflop = seen.find((v) => v.street === 'preflop');
    const flop = seen.find((v) => v.street === 'flop');
    if (preflop && flop) return { preflop, flop };
  }
  throw new Error('no hand reached the flop');
}

describe('advice service', () => {
  it('handleAdviceRequest maps each kind and turns throws into error responses', () => {
    const { preflop, flop } = views();
    for (const view of [preflop, flop]) {
      expect(handleAdviceRequest({ id: 4, kind: 'bot', view, style: 'TAG' })).toEqual({
        id: 4,
        ok: true,
        value: decideTag(view),
      });
      expect(handleAdviceRequest({ id: 5, kind: 'recommend', view })).toEqual({
        id: 5,
        ok: true,
        value: recommend(view),
      });
      const legal = view.legalActions[0]?.type ?? 'fold';
      expect(handleAdviceRequest({ id: 6, kind: 'grade', view, userAction: legal })).toEqual({
        id: 6,
        ok: true,
        value: gradeView(view, legal),
      });
    }

    const types = ['fold', 'check', 'call', 'bet', 'raise'] as const;
    const illegal = types.find((t) => !preflop.legalActions.some((a) => a.type === t));
    if (illegal === undefined) throw new Error('every action type is legal');
    expect(
      handleAdviceRequest({ id: 7, kind: 'grade', view: preflop, userAction: illegal }),
    ).toEqual({
      id: 7,
      ok: false,
      error: { name: 'RangeError', message: `${illegal} is not legal for seat ${preflop.seat}` },
    });

    const unknown = { id: 8, kind: 'nope', view: preflop } as unknown as AdviceRequest;
    expect(handleAdviceRequest(unknown)).toEqual({
      id: 8,
      ok: false,
      error: { name: 'RangeError', message: 'Unknown advice request kind: nope' },
    });

    const boom = handleAdviceRequest(
      { id: 9, kind: 'bot', view: preflop, style: 'Maniac' },
      {
        decideBot: () => {
          throw 'boom';
        },
      },
    );
    expect(boom).toEqual({ id: 9, ok: false, error: { name: 'Error', message: 'boom' } });

    const styles: string[] = [];
    handleAdviceRequest(
      { id: 10, kind: 'bot', view: preflop, style: 'Rock' },
      {
        decideBot: (view, style) => {
          styles.push(style);
          return decideTag(view);
        },
      },
    );
    expect(styles).toEqual(['Rock']);
  });
});
