import { describe, expect, it } from 'vitest';
import { shuffledDeck } from '../../src/engine/deck';
import { applyAction, createHand, type Action } from '../../src/engine/hand';
import { decideTag } from '../../src/bots/tag';
import { botDecisionSeed, botRandom } from '../../src/engine/bot-random';
import { checkStep } from '../../src/engine/invariants';
import {
  playerView,
  showdownOf,
  type EarlierShowdown,
  type SeatPolicy,
} from '../../src/engine/player-view';
import { randomMovePolicy, seatGenerator, seededTagPolicy } from '../../src/playtest/policy';
import {
  composeChecks,
  defaultPolicyFactory,
  EARLIER_SHOWDOWN_LIMIT,
  handReplayCode,
  playHand,
  runPlaytest,
  summarize,
  CASH_BUY_IN,
  GAMES,
  PLAYTEST_STAKES,
  SNG_STAKES,
  SNG_STARTING_CHIPS,
  type ActionHook,
  type PlayedHand,
  type PolicyFactory,
} from '../../src/playtest/runner';
import { FAULTS, MAX_ACTIONS_PER_HAND } from '../support/faulty-engine';

const draws = (code: string, seat: number) => {
  const rng = seatGenerator(code, seat);
  return Array.from({ length: 10 }, () => rng.nextUint32());
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
    const summary = runPlaytest(
      { hands: 3, seed: 1, size: 3 },
      (h) => overCap.push(h),
      FAULTS.fifthBet.seams,
    );
    expect(summary.violations).toBe(3);
    expect(summary.violationCounts['bet-cap']).toBe(3);
    expect(summary.foldOuts + summary.showdowns).toBeLessThan(3);
    expect(summary.firstViolation).toBe(overCap[0]);
    for (const hand of overCap) {
      expect(hand.final.result).toBeNull();
      expect(hand.final.betCount).toBe(3);
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

  it('Largest pot counts the uncalled bet returned to its bettor', () => {
    const base = playHand(handReplayCode(1, 1), 3, 1);
    const played = (...steps: Action[]): PlayedHand => {
      let state = createHand({
        stakes: PLAYTEST_STAKES,
        seats: [1, 2, 3].map((seat) => ({ seat, stack: CASH_BUY_IN })),
        button: 1,
        deck: shuffledDeck(base.record.replayCode),
      });
      for (const action of steps) {
        const next = applyAction(state, action);
        if (!next.ok) throw new Error(next.error.message);
        state = next.state;
      }
      expect(state.result?.returned).toBeDefined();
      return { ...base, final: state };
    };
    const walk = played({ seat: 1, type: 'fold' }, { seat: 2, type: 'fold' });
    expect(summarize([walk]).largestPot).toBe(6);
    const flopFoldToRaise = played(
      { seat: 1, type: 'raise', amount: 8 },
      { seat: 2, type: 'call', amount: 6 },
      { seat: 3, type: 'call', amount: 4 },
      { seat: 2, type: 'bet', amount: 4 },
      { seat: 3, type: 'raise', amount: 8 },
      { seat: 1, type: 'fold' },
      { seat: 2, type: 'fold' },
    );
    expect(summarize([flopFoldToRaise]).largestPot).toBe(36);
    expect(summarize([walk, flopFoldToRaise]).largestPot).toBe(36);
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
    let views = 0;
    playHand(code, 6, 6, 1, {
      onAction: (step) => {
        const view = playerView(step.before, step.action.seat);
        const seeded = decideTag(view, { random: botRandom(botDecisionSeed(code, view)) });
        expect(defaultPolicyFactory(6)(code, view.seat)(view)).toEqual(seeded);
        expect(step.action).toEqual(seeded);
        views++;
        return checkStep(step);
      },
    });
    expect(views).toBeGreaterThan(0);

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

  it('fault engines fail fast when a runner keeps playing a violating hand', () => {
    const { engine, makePolicy } = FAULTS.illegalAccepted.seams;
    const code = handReplayCode(42, 1);
    const neverStops = () => {
      let state = engine.createHand({
        stakes: PLAYTEST_STAKES,
        seats: Array.from({ length: 6 }, (_, i) => ({ seat: i + 1, stack: CASH_BUY_IN })),
        button: 1,
        deck: shuffledDeck(code),
      });
      while (state.toAct !== null) {
        const action = makePolicy(code, state.toAct)(playerView(state, state.toAct));
        const result = engine.applyAction(state, action);
        if (result.ok) state = result.state;
      }
    };
    const started = Date.now();
    expect(neverStops).toThrow(
      new Error(
        `runner kept playing a hand past ${MAX_ACTIONS_PER_HAND} actions; it must stop at the first violation`,
      ),
    );
    expect(Date.now() - started).toBeLessThan(10_000);

    for (const [name, fault] of Object.entries(FAULTS)) {
      const hands: PlayedHand[] = [];
      const summary = runPlaytest(
        { hands: 20, seed: 42, size: 6 },
        (h) => hands.push(h),
        fault.seams,
      );
      expect(summary.violationCounts[fault.invariant], name).toBeGreaterThanOrEqual(1);
      for (const hand of hands) {
        expect(hand.violation?.actionNumber ?? 0, name).toBeLessThanOrEqual(MAX_ACTIONS_PER_HAND);
      }
    }
  });

  it('carried stacks and restarts', () => {
    const code = handReplayCode(42, 1);
    expect(() => playHand(code, 3, 1, 1, {}, { stacks: [160, 160] })).toThrow(
      new RangeError('Stacks must list one stack per seat'),
    );
    expect(handReplayCode(42, 1, 'sng')).toBe('000000000000002a0000000100000001');
    expect(handReplayCode(42, 1, 'cash')).toBe(handReplayCode(42, 1));
    expect(GAMES.sng).toEqual({
      stakes: SNG_STAKES,
      startingStack: SNG_STARTING_CHIPS,
      rebuy: false,
      codeWord: 1,
    });

    // Seats with 0 are not dealt in; the record keeps the table size and game.
    const sng = playHand(code, 4, 2, 1, {}, { game: 'sng', stacks: [0, 900, 0, 2100] });
    expect(sng.record.seats).toEqual([
      { seat: 2, stack: 900 },
      { seat: 4, stack: 2100 },
    ]);
    expect(sng.record).toMatchObject({ game: 'sng', size: 4, stakes: SNG_STAKES, button: 2 });
    expect(sng.dealViolations).toEqual([]);

    // A violating hand restarts the table: button 1, every seat at the starting stack. The flag is on the
    // action that completes the hand, so the hand has a result and only its violation forces the restart.
    const flagged: PlayedHand[] = [];
    runPlaytest({ hands: 3, seed: 3, size: 4 }, (h) => flagged.push(h), {
      onAction: (step) =>
        step.result.ok && step.result.state.result !== null
          ? [{ invariant: 'custom', message: 'flagged' }]
          : checkStep(step),
    });
    expect(flagged).toHaveLength(3);
    for (const hand of flagged) {
      expect(hand.final.result).not.toBeNull();
      expect(hand.violations).toBe(1);
      expect(hand.record.button).toBe(1);
      expect(hand.record.seats).toEqual([1, 2, 3, 4].map((seat) => ({ seat, stack: CASH_BUY_IN })));
    }
    const clean: PlayedHand[] = [];
    runPlaytest({ hands: 2, seed: 3, size: 4 }, (h) => clean.push(h));
    expect(clean[1]?.record.button).toBe(2);
    expect(clean[1]?.record.seats).toEqual(
      clean[0]?.final.players.map(({ seat, stack }) => ({ seat, stack })),
    );

    // The default policy follows the seats dealt in: random below 6, seeded TAG at 6.
    const five = [160, 160, 0, 160, 160, 160];
    const random: PolicyFactory = (c, seat) => randomMovePolicy(seatGenerator(c, seat));
    expect(playHand(code, 6, 1, 1, {}, { stacks: five }).record.actions).toEqual(
      playHand(code, 6, 1, 1, { makePolicy: random }, { stacks: five }).record.actions,
    );
    expect(playHand(code, 6, 1).record.actions).toEqual(
      playHand(code, 6, 1, 1, { makePolicy: (c) => seededTagPolicy(c) }).record.actions,
    );
  });

  it('keeps a bounded window of earlier showdowns and never changes a list already handed out', () => {
    expect(EARLIER_SHOWDOWN_LIMIT).toBe(1000);
    // Checking down every hand means every hand reaches showdown.
    const seenByHand: (readonly EarlierShowdown[])[] = [];
    const checkDown: PolicyFactory = () => (view) => {
      seenByHand[played.length] ??= view.earlierShowdowns;
      const legal = view.legalActions;
      return (legal.find((a) => a.type === 'check') ??
        legal.find((a) => a.type === 'call')) as ReturnType<SeatPolicy>;
    };
    const played: PlayedHand[] = [];
    const hands = EARLIER_SHOWDOWN_LIMIT + 2;
    runPlaytest({ hands, seed: 7, size: 2 }, (hand) => played.push(hand), {
      makePolicy: checkDown,
    });
    const entries = played.map((hand) => showdownOf(hand.final));
    expect(entries.every((entry) => entry !== null)).toBe(true);
    expect(seenByHand[0]).toEqual([]);
    expect(seenByHand[2]).toEqual(entries.slice(0, 2));
    const third = seenByHand[3] as readonly EarlierShowdown[];
    const snapshot = structuredClone(third);
    expect(seenByHand[EARLIER_SHOWDOWN_LIMIT]).toHaveLength(EARLIER_SHOWDOWN_LIMIT);
    const last = seenByHand[hands - 1] as readonly EarlierShowdown[];
    expect(last).toHaveLength(EARLIER_SHOWDOWN_LIMIT);
    expect(last).toEqual(entries.slice(1, hands - 1));
    expect(third).toEqual(snapshot);
    expect(third).toHaveLength(3);

    // playHand passes setup.earlierShowdowns to every view, [] by default.
    const given = [entries[0] as EarlierShowdown];
    let views: (readonly EarlierShowdown[])[] = [];
    const record: PolicyFactory = (code, seat) => (view) => {
      views.push(view.earlierShowdowns);
      return randomMovePolicy(seatGenerator(code, seat))(view);
    };
    playHand(handReplayCode(1, 1), 3, 1, 1, { makePolicy: record }, { earlierShowdowns: given });
    expect(views.length).toBeGreaterThan(0);
    expect(views.every((v) => v === given)).toBe(true);
    views = [];
    playHand(handReplayCode(1, 1), 3, 1, 1, { makePolicy: record });
    expect(views.length).toBeGreaterThan(0);
    expect(views.every((v) => v.length === 0)).toBe(true);

    // A new sit-and-go restarts the list.
    const sngSeen: (readonly EarlierShowdown[])[][] = [];
    const sngHands: PlayedHand[] = [];
    const raiseOrCall: PolicyFactory = () => (view) => {
      (sngSeen[sngHands.length] ??= []).push(view.earlierShowdowns);
      const legal = view.legalActions;
      return (legal.find((a) => a.type === 'raise' || a.type === 'bet') ??
        legal.find((a) => a.type === 'call' || a.type === 'check')) as ReturnType<SeatPolicy>;
    };
    runPlaytest({ hands: 40, seed: 5, size: 2, game: 'sng' }, (hand) => sngHands.push(hand), {
      makePolicy: raiseOrCall,
    });
    const restart = sngHands.findIndex(
      (_, k) => k > 0 && sngHands[k - 1]?.final.players.some((p) => p.stack === 0),
    );
    expect(restart).toBeGreaterThan(1);
    expect(sngSeen[restart - 1]?.every((v) => v.length > 0)).toBe(true);
    expect(sngSeen[restart]?.every((v) => v.length === 0)).toBe(true);
  });

  it('composeChecks runs every hook in order and joins their violations', () => {
    const order: string[] = [];
    const hook =
      (id: string, found: number): ActionHook =>
      () => {
        order.push(id);
        return Array.from({ length: found }, (_, i) => ({ invariant: id, message: `${id} ${i}` }));
      };
    const steps: Parameters<ActionHook>[0][] = [];
    playHand(handReplayCode(1, 1), 2, 1, 1, {
      onAction: (step) => {
        steps.push(step);
        return checkStep(step);
      },
    });
    const step = steps[0] as Parameters<ActionHook>[0];
    expect(composeChecks()(step)).toEqual([]);
    expect(composeChecks(checkStep)(step)).toEqual(checkStep(step));
    expect(composeChecks(hook('a', 1), hook('b', 0), hook('c', 2))(step)).toEqual([
      { invariant: 'a', message: 'a 0' },
      { invariant: 'c', message: 'c 0' },
      { invariant: 'c', message: 'c 1' },
    ]);
    expect(order).toEqual(['a', 'b', 'c']);
  });
});
