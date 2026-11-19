import { describe, expect, it } from 'vitest';
import { shuffledDeck } from '../../src/engine/deck';
import { applyAction, createHand } from '../../src/engine/hand';
import { tagPolicy } from '../../src/bots/tag';
import { playerView, type SeatPolicy } from '../../src/engine/player-view';
import { randomMovePolicy, seatGenerator } from '../../src/playtest/policy';
import {
  defaultPolicyFactory,
  handReplayCode,
  playHand,
  runPlaytest,
  summarize,
  CASH_BUY_IN,
  PLAYTEST_STAKES,
  type PlayedHand,
  type PolicyFactory,
} from '../../src/playtest/runner';

const draws = (code: string, seat: number) => {
  const rng = seatGenerator(code, seat);
  return Array.from({ length: 10 }, () => rng.nextUint32());
};

/** Always raises when offered, ignoring the cap; otherwise bets, calls or checks. */
const alwaysRaise: PolicyFactory = () => (view) => {
  const legal = view.legalActions;
  return (legal.find((a) => a.type === 'raise') ??
    legal.find((a) => a.type === 'bet') ??
    legal.find((a) => a.type === 'call') ??
    legal[0]) as ReturnType<SeatPolicy>;
};

/** Bets or raises up to the cap, then calls or checks: every street reaches exactly 4 bets. */
const raiseToCap: PolicyFactory = () => (view) => {
  const legal = view.legalActions.filter(
    (a) => view.betCount < 4 || (a.type !== 'bet' && a.type !== 'raise'),
  );
  return legal[legal.length - 1] as ReturnType<SeatPolicy>;
};

describe('playtest runner units', () => {
  it('derives codes, buttons and seat generators deterministically', () => {
    expect(handReplayCode(42, 1)).toBe('000000000000002a0000000000000001');
    expect(handReplayCode(43, 1)).toBe('000000000000002b0000000000000001');
    expect(handReplayCode(2 ** 32, 3)).toBe('00000001000000000000000000000003');
    expect(() => handReplayCode(42, 0)).toThrow(RangeError);
    expect(() => handReplayCode(42, 1.5)).toThrow(RangeError);

    const buttons: number[] = [];
    const numbers: number[] = [];
    const summary = runPlaytest({ hands: 7, seed: 1, size: 3 }, (hand) => {
      buttons.push(hand.record.button);
      numbers.push(hand.number);
    });
    expect(buttons).toEqual([1, 2, 3, 1, 2, 3, 1]);
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(summary.firstReplayCode).toBe(handReplayCode(1, 1));
    expect(summary.lastReplayCode).toBe(handReplayCode(1, 7));
    expect(summary.foldOuts + summary.showdowns).toBe(7);

    const code = handReplayCode(42, 1);
    expect(draws(code, 2)).toEqual(draws(code, 2));
    expect(draws(code, 2)).not.toEqual(draws(code, 3));
    expect(draws(code, 2)).not.toEqual(draws(handReplayCode(42, 2), 2));
  });

  it('stops a hand at its first violation and counts per invariant', () => {
    const rejected: PolicyFactory = () => (view) => ({
      seat: view.seat,
      type: 'raise',
      amount: 999,
    });
    for (const seams of [{ makePolicy: rejected }, { makePolicy: rejected, onAction: () => [] }]) {
      const hands: PlayedHand[] = [];
      const summary = runPlaytest({ hands: 3, seed: 1, size: 3 }, (h) => hands.push(h), seams);
      expect(summary.violations).toBe(3);
      expect(summary.violationCounts).toEqual({
        chips: 0,
        'legal-action': 3,
        'bet-cap': 0,
        'pot-eligibility': 0,
        cards: 0,
      });
      expect(summary.handsPlayed).toBe(3);
      expect(summary.foldOuts + summary.showdowns).toBe(0);
      expect(summary.playerActions).toBe(0);
      expect(summary.largestPot).toBe(0);
      expect(summary.firstViolation).toBe(hands[0]);
      for (const hand of hands) {
        const fresh = createHand({
          stakes: hand.record.stakes,
          seats: hand.record.seats,
          button: hand.record.button,
          deck: hand.final.deck,
        });
        expect(hand.final).toEqual(fresh);
        expect(hand.record.actions).toEqual([]);
        expect(hand.violations).toBe(1);
        const seat = fresh.toAct;
        expect(hand.violation).toEqual({
          actionNumber: 1,
          action: { seat, type: 'raise', amount: 999 },
          violations: [
            {
              invariant: 'legal-action',
              message: `engine rejected seat ${seat} raises to $999 (illegal-action)`,
            },
          ],
        });
      }
    }

    const overCap: PlayedHand[] = [];
    const summary = runPlaytest({ hands: 3, seed: 1, size: 3 }, (h) => overCap.push(h), {
      makePolicy: alwaysRaise,
    });
    expect(summary.violations).toBe(3);
    expect(summary.violationCounts['bet-cap']).toBe(3);
    expect(summary.foldOuts + summary.showdowns).toBeLessThan(3);
    expect(summary.firstViolation).toBe(overCap[0]);
    for (const hand of overCap) {
      expect(hand.final.result).toBeNull();
      expect(hand.final.betCount).toBe(5);
      expect(hand.violation?.violations).toEqual([
        { invariant: 'bet-cap', message: 'preflop has 5 bets (at most 4)' },
      ]);
    }

    const late = runPlaytest({ hands: 3, seed: 1, size: 3 }, undefined, {
      onAction: (step) =>
        step.before.button === 2 ? [{ invariant: 'custom', message: 'flagged' }] : [],
    });
    expect(late.firstViolation?.number).toBe(2);
    expect(late.violationCounts.custom).toBe(1);
  });

  it('records player actions without blinds and counts capped streets', () => {
    const hand = playHand(handReplayCode(5, 1), 4, 2, 9, { makePolicy: raiseToCap });
    expect(hand.number).toBe(9);
    expect(hand.record.actions).toHaveLength(hand.final.actions.length - 2);
    expect(hand.record.actions[0]).toEqual({ seat: 1, type: 'raise', amount: 8 });
    const summary = summarize([hand]);
    expect(summary.cappedStreets).toBe(4);
    expect(summary.violations).toBe(0);
    expect(summary.showdowns).toBe(1);
    expect(() => summarize([])).toThrow(RangeError);
  });

  it("creates each seat's policy once per hand", () => {
    let created: string[] = [];
    const decisions = new Map<number, number>();
    const counting: PolicyFactory = (code, seat) => {
      created.push(`${code}/${seat}`);
      const policy = raiseToCap(code, seat);
      return (view) => {
        decisions.set(seat, (decisions.get(seat) ?? 0) + 1);
        return policy(view);
      };
    };

    const code = handReplayCode(5, 1);
    playHand(code, 4, 2, 1, { makePolicy: counting });
    expect([...created].sort()).toEqual([1, 2, 3, 4].map((seat) => `${code}/${seat}`));
    expect(Math.max(...decisions.values())).toBeGreaterThanOrEqual(2);

    created = [];
    runPlaytest({ hands: 3, seed: 5, size: 4 }, undefined, { makePolicy: counting });
    expect(created).toHaveLength(12);
    expect(new Set(created).size).toBe(12);
  });

  it('default seat policy is TAG at 6 players and random-move elsewhere', () => {
    const code = handReplayCode(42, 1);
    for (let seat = 1; seat <= 6; seat++)
      expect(defaultPolicyFactory(6)(code, seat)).toBe(tagPolicy);

    for (const size of [3, 5, 7, 10]) {
      const actual = defaultPolicyFactory(size);
      const policies = new Map<number, [SeatPolicy, SeatPolicy]>();
      for (let seat = 1; seat <= size; seat++) {
        policies.set(seat, [actual(code, seat), randomMovePolicy(seatGenerator(code, seat))]);
      }
      let state = createHand({
        stakes: PLAYTEST_STAKES,
        seats: Array.from({ length: size }, (_, i) => ({ seat: i + 1, stack: CASH_BUY_IN })),
        button: 1,
        deck: shuffledDeck(code),
      });
      while (state.toAct !== null) {
        const [mine, expected] = policies.get(state.toAct) as [SeatPolicy, SeatPolicy];
        const view = playerView(state, state.toAct);
        const action = mine(view);
        expect(action).toEqual(expected(view));
        const result = applyAction(state, action);
        if (!result.ok) throw new Error(result.error.message);
        state = result.state;
      }
      expect(state.result).not.toBeNull();
      expect(playHand(code, size, 1).record.actions).toEqual(
        playHand(code, size, 1, 1, { makePolicy: actual }).record.actions,
      );
    }

    const seen: number[] = [];
    const folder: PolicyFactory = (_, seat) => (view) => {
      seen.push(seat);
      return { seat: view.seat, type: 'fold' };
    };
    const hand = playHand(code, 6, 1, 1, { makePolicy: folder });
    expect(hand.record.actions.every((a) => a.type === 'fold')).toBe(true);
    expect(seen.length).toBe(hand.record.actions.length);
    expect(seen.length).toBeGreaterThan(0);
  });
});
