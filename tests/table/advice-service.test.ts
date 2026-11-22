import { describe, expect, it } from 'vitest';
import { gradeView } from '../../src/advice/grade';
import { recommend } from '../../src/advice/recommend';
import { botRandom } from '../../src/engine/bot-random';
import { decideCallingStation } from '../../src/bots/calling-station';
import { decideManiac } from '../../src/bots/maniac';
import { decideRock } from '../../src/bots/rock';
import { decideTag } from '../../src/bots/tag';
import { Xoshiro128 } from '../../src/engine/seeded-random';
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
      expect(handleAdviceRequest({ id: 4, kind: 'bot', view, style: 'TAG', seed: 0 })).toEqual({
        id: 4,
        ok: true,
        value: decideTag(view, { random: botRandom(0) }),
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
      { id: 9, kind: 'bot', view: preflop, style: 'Maniac', seed: 0 },
      {
        decideBot: () => {
          throw 'boom';
        },
      },
    );
    expect(boom).toEqual({ id: 9, ok: false, error: { name: 'Error', message: 'boom' } });

    const styles: string[] = [];
    handleAdviceRequest(
      { id: 10, kind: 'bot', view: preflop, style: 'Rock', seed: 0 },
      {
        decideBot: (view, style) => {
          styles.push(style);
          return decideTag(view);
        },
      },
    );
    expect(styles).toEqual(['Rock']);
  });

  it('default bot decision dispatches the Calling station', () => {
    const { preflop, flop } = views();
    for (const view of [preflop, flop]) {
      for (const seed of [0, 12345, 4294967295]) {
        expect(
          handleAdviceRequest({ id: 1, kind: 'bot', view, style: 'Calling station', seed }),
        ).toEqual({
          id: 1,
          ok: true,
          value: decideCallingStation(view, { random: botRandom(seed) }),
        });
        expect(handleAdviceRequest({ id: 2, kind: 'bot', view, style: 'TAG', seed })).toEqual({
          id: 2,
          ok: true,
          value: decideTag(view, { random: botRandom(seed) }),
        });
      }
    }
    // A postflop view with nothing owed: the Calling station checks.
    const hero = flop.players.find((p) => p.seat === flop.seat);
    expect(flop.currentBet - (hero?.streetContribution ?? -1)).toBe(0);
    expect(
      handleAdviceRequest({ id: 3, kind: 'bot', view: flop, style: 'Calling station', seed: 0 }),
    ).toEqual({ id: 3, ok: true, value: flop.legalActions.find((a) => a.type === 'check') });
  });

  it('default bot decision dispatches the Maniac', () => {
    const { preflop, flop } = views();
    for (const view of [preflop, flop]) {
      for (const seed of [0, 12345, 4294967295]) {
        expect(handleAdviceRequest({ id: 4, kind: 'bot', view, style: 'Maniac', seed })).toEqual({
          id: 4,
          ok: true,
          value: decideManiac(view, { random: botRandom(seed) }),
        });
      }
    }
  });

  it('default bot decision dispatches the Rock', () => {
    const { preflop, flop } = views();
    for (const view of [preflop, flop]) {
      for (const seed of [0, 12345, 4294967295]) {
        expect(handleAdviceRequest({ id: 5, kind: 'bot', view, style: 'Rock', seed })).toEqual({
          id: 5,
          ok: true,
          value: decideRock(view),
        });
      }
    }
  });

  it('handleAdviceRequest answers a malformed request with an error instead of throwing', () => {
    const malformed = { name: 'TypeError', message: 'Malformed advice request' };
    for (const request of [null, 42, {}, { kind: 'bot' }, { id: 'x', kind: 'bot' }]) {
      expect(handleAdviceRequest(request as unknown as AdviceRequest)).toEqual({
        id: null,
        ok: false,
        error: malformed,
      });
    }
  });

  it('bot requests need a 32-bit integer seed', () => {
    const { preflop: view } = views();
    for (const x of [-1, 1.5, 4294967296, NaN]) {
      expect(() => botRandom(x)).toThrow(RangeError);
    }
    const bad = { name: 'TypeError', message: 'Malformed bot request seed' };
    const request = { id: 11, kind: 'bot', view, style: 'TAG' };
    expect(handleAdviceRequest(request as unknown as AdviceRequest)).toEqual({
      id: 11,
      ok: false,
      error: bad,
    });
    for (const seed of ['7', -1, 1.5, 2 ** 32]) {
      const malformed = { ...request, seed } as unknown as AdviceRequest;
      expect(handleAdviceRequest(malformed)).toEqual({ id: 11, ok: false, error: bad });
    }

    const randoms: Xoshiro128[] = [];
    for (const seed of [0, 4294967295]) {
      const response = handleAdviceRequest(
        { id: 12, kind: 'bot', view, style: 'TAG', seed },
        {
          decideBot: (v, _style, random) => {
            randoms.push(random);
            return decideTag(v);
          },
        },
      );
      expect(response).toEqual({ id: 12, ok: true, value: decideTag(view) });
    }
    expect(randoms.map((r) => r.nextUint32())).toEqual([
      new Xoshiro128(0).nextUint32(),
      new Xoshiro128(4294967295).nextUint32(),
    ]);
  });
});
