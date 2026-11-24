import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { replayCodeFromWords, type ReplayCode } from '../../src/engine/deck';
import type { HandState } from '../../src/engine/hand';
import { openHandStore } from '../../src/storage/hand-store';
import {
  DEFAULT_SESSION_CONFIG,
  NEXT_HAND_DELAY_MS,
  SIT_AND_GO_LEVEL_1,
  dealHand,
  nextHand,
  nextHandDelay,
  nextStep,
  rebuy,
  resolveSessionConfig,
  seatSession,
  stakesFor,
  userBusted,
  type TableState,
} from '../../src/table/session';
import {
  handWrite,
  parseSessionRecord,
  restoreSession,
  sessionRecord,
} from '../../src/table/session-record';
import { dealAfterDone, rebuyAndDeal } from '../../src/ui/table/useTableSession';
import { playHand } from '../support/session-play';
import { KINGS_SHOWDOWN, PREFLOP, withFinalStacks } from '../support/table-scenarios';

const SESSION = '0123456789abcdef0123456789abcdef';
const STARTED = new Date('2026-11-23T10:00:00Z');
const at = (minute: number): Date => new Date(STARTED.getTime() + minute * 60_000);
const META = { sessionId: SESSION, startedAt: STARTED, updatedAt: STARTED };
const codeFor = (hand: number): ReplayCode => replayCodeFromWords([0x9e3779b9, hand, 2, 3]);
/** The e2e spec's pinned replay words (A-6). */
const E2E_WORDS = [0x9e3779b9, 1, 2, 3];

const BUST = [160, 222, 160, 160, 0, 165];
const stackValues = (table: TableState): number[] => table.stacks.map((s) => s.stack);
const userStart = (table: TableState): number | undefined =>
  (table.hand as HandState).players.find((p) => p.seat === 5)?.startingStack;

/** `table` dealt from `code`, finished as KINGS_SHOWDOWN's hand but with final stacks `stacks`. */
function finishedWith(table: TableState, code: ReplayCode, stacks: number[]): TableState {
  return withFinalStacks(stacks, { ...dealHand(table, code), hand: KINGS_SHOWDOWN.hand });
}

const SIT_AND_GO: TableState = {
  ...KINGS_SHOWDOWN,
  config: resolveSessionConfig({ gameType: 'sit-and-go' }),
  stakes: stakesFor(SIT_AND_GO_LEVEL_1),
};

/** The A-6 seed: default 6-max, all TAG, 12 hands played, the user on $4 in the big blind of hand 13. */
function seededShortStack(): TableState {
  const seated = seatSession(DEFAULT_SESSION_CONFIG);
  return {
    ...seated,
    stacks: seated.stacks.map((s) => (s.seat === 5 ? { seat: 5, stack: 4 } : s)),
    button: 3,
    handNumber: 13,
  };
}

describe('rebuy acceptance', () => {
  it('a cash hand that leaves the user on $0 stops dealing until the user chooses', () => {
    const done = withFinalStacks(BUST);
    expect(nextStep(done)).toBe('done');
    expect(userBusted(done)).toBe(true);
    expect(nextHandDelay(done)).toBeNull();
    expect(nextHandDelay(done, false)).toBeNull();
    expect(nextHandDelay(done, true)).toBeNull();
    const next = nextHand(done);
    expect(stackValues(next)).toEqual(BUST);
    expect(next.seats).toEqual(KINGS_SHOWDOWN.seats);
    expect(next.handNumber).toBe(KINGS_SHOWDOWN.handNumber + 1);
    expect(nextStep(next)).toBe('rebuy');
    expect(userBusted(next)).toBe(true);
    expect(nextHandDelay(next)).toBeNull();
    expect(() => dealHand(next, codeFor(2))).toThrow(
      new RangeError('The user has no chips: rebuy first'),
    );

    // A bot busting in the same hand is still replaced; the user stays on $0.
    const both = nextHand(withFinalStacks([0, 222, 160, 160, 0, 165]));
    expect(stackValues(both)).toEqual([160, 222, 160, 160, 0, 165]);
    expect(both.seats[0]?.name).not.toBe('Ava');
    expect(nextStep(both)).toBe('rebuy');

    const one = withFinalStacks([160, 222, 160, 160, 1, 165]);
    expect(userBusted(one)).toBe(false);
    expect(nextHandDelay(one)).toBe(NEXT_HAND_DELAY_MS);
    expect(nextHandDelay(one)).toBe(1500);
    expect(nextStep(nextHand(one))).toBe('deal');

    const sitAndGo = withFinalStacks(BUST, SIT_AND_GO);
    expect(userBusted(sitAndGo)).toBe(false);
    expect(nextHandDelay(sitAndGo)).toBe(1500);
    expect(nextHand(sitAndGo).stacks[4]).toEqual({ seat: 5, stack: 800 });
    expect(nextStep(nextHand(sitAndGo))).toBe('deal');
  });

  it('rebuy sets the user to the buy-in, deals the next hand and counts one rebuy', () => {
    const busted = nextHand(withFinalStacks(BUST));
    expect(busted.rebuys).toBe(0);
    const rebought = rebuy(busted);
    expect(stackValues(rebought)).toEqual([160, 222, 160, 160, 160, 165]);
    expect(rebought.rebuys).toBe(1);
    expect(rebought.seats).toEqual(busted.seats);
    expect(rebought.button).toBe(busted.button);
    expect(rebought.handNumber).toBe(busted.handNumber);
    expect({ ...rebought, stacks: busted.stacks, rebuys: 0 }).toEqual(busted);
    expect(nextStep(rebought)).toBe('deal');
    const dealt = dealHand(rebought, codeFor(2));
    expect(userStart(dealt)).toBe(160);
    expect(dealt.handNumber).toBe(busted.handNumber);

    // The hook's Rebuy path: from the done bust hand, or from a restored bust.
    const fromDone = rebuyAndDeal(withFinalStacks(BUST), codeFor(2));
    expect(fromDone).toEqual(dealt);
    expect(rebuyAndDeal(busted, codeFor(2))).toEqual(dealt);
    // A second click finds the user with chips and changes nothing.
    expect(rebuyAndDeal(dealt, codeFor(3))).toBe(dealt);

    const highSeated = seatSession({ stake: { smallBet: 10, bigBet: 20 } });
    const high: TableState = {
      ...highSeated,
      stacks: highSeated.stacks.map((s) => (s.seat === 5 ? { seat: 5, stack: 0 } : s)),
    };
    const highRebought = rebuy(high);
    expect(highRebought.stacks[4]).toEqual({ seat: 5, stack: 400 });
    expect(highRebought.rebuys).toBe(1);
    expect(userStart(dealHand(highRebought, codeFor(1)))).toBe(400);
  });

  it('a user who rebought twice has rebuys 2 in the session record after the next completed hand', async () => {
    const store = openHandStore(new IDBFactory());
    const write = async (done: TableState) => {
      const written = handWrite(done, {
        sessionId: SESSION,
        startedAt: STARTED,
        completedAt: at(done.handNumber),
      });
      await store.add(written.record, written.session);
      return written.session;
    };
    const userSeat = (session: { seats: readonly { seat: number; stack: number }[] }) =>
      session.seats.find((s) => s.seat === 5)?.stack;

    const hand1 = finishedWith(seatSession(), codeFor(1), BUST);
    const session1 = await write(hand1);
    expect(userSeat(session1)).toBe(0);
    expect(session1.rebuys).toBe(0);

    const hand2 = finishedWith(rebuy(nextHand(hand1)), codeFor(2), [222, 160, 160, 165, 0, 160]);
    expect(hand2.rebuys).toBe(1);
    const session2 = await write(hand2);
    expect(userSeat(session2)).toBe(0);
    expect(session2.rebuys).toBe(1);

    const hand3 = finishedWith(rebuy(nextHand(hand2)), codeFor(3), [200, 160, 160, 125, 160, 160]);
    const session3 = await write(hand3);
    expect(session3.rebuys).toBe(2);
    expect(userSeat(session3)).toBe(160);

    const stored = await store.getSession(SESSION);
    expect(stored?.rebuys).toBe(2);
    expect(stored?.handsPlayed).toBe(3);
    expect(restoreSession(stored).rebuys).toBe(2);
    expect(await store.count()).toBe(3);
  });

  it('a stored cash bust restores with the user on $0 waiting to rebuy', () => {
    const next = nextHand(withFinalStacks(BUST));
    const record = sessionRecord(next, META);
    expect(record.seats[4]).toMatchObject({ seat: 5, kind: 'user', stack: 0 });
    expect(parseSessionRecord(structuredClone(record))).toEqual(record);
    const restored = restoreSession(structuredClone(record));
    expect(restored.stacks[4]).toEqual({ seat: 5, stack: 0 });
    expect(nextStep(restored)).toBe('rebuy');
    expect(userBusted(restored)).toBe(true);
    expect(restored).toEqual(next);
    expect(() => dealHand(restored, codeFor(2))).toThrow(
      new RangeError('The user has no chips: rebuy first'),
    );

    const botOnZero = structuredClone(record);
    (botOnZero.seats[0] as { stack: number }).stack = 0;
    expect(() => parseSessionRecord(botOnZero)).toThrow(
      new RangeError('Stack at seat 1 must be an integer of at least 1'),
    );
    expect(() => restoreSession(botOnZero)).toThrow(
      new RangeError('Stack at seat 1 must be an integer of at least 1'),
    );

    const sitAndGoSeated = seatSession({ gameType: 'sit-and-go' });
    const sitAndGo = sessionRecord(
      {
        ...sitAndGoSeated,
        stacks: sitAndGoSeated.stacks.map((s) => (s.seat === 5 ? { seat: 5, stack: 0 } : s)),
      },
      META,
    );
    expect(() => parseSessionRecord(sitAndGo)).toThrow(
      new RangeError('Stack at seat 5 must be an integer of at least 1'),
    );

    // A-6: the e2e seed (user on $4 in the big blind) busts with the pinned words.
    const seed = sessionRecord(seededShortStack(), META);
    expect(seed.handsPlayed).toBe(12);
    const resumed = restoreSession(seed);
    expect(nextStep(resumed)).toBe('deal');
    const played = playHand(resumed, replayCodeFromWords(E2E_WORDS));
    expect(played.handNumber).toBe(13);
    expect(played.userDecisions).toHaveLength(0);
    expect(played.hand?.players.find((p) => p.seat === 5)?.stack).toBe(0);
    expect(userBusted(played)).toBe(true);
    expect(nextStep(nextHand(played))).toBe('rebuy');
  });

  it('no rebuy is possible while the user has chips', () => {
    const hasChips = new RangeError('No rebuy: the user has chips');
    const inHand = new RangeError('No rebuy during a hand');
    const toppedUp = nextHand(withFinalStacks([160, 222, 160, 160, 95, 165]));
    expect(toppedUp.stacks[4]).toEqual({ seat: 5, stack: 160 });
    expect(toppedUp.rebuys).toBe(0);
    const between = [
      seatSession(),
      toppedUp,
      nextHand(withFinalStacks([160, 222, 160, 160, 1, 165])),
      nextHand(withFinalStacks(BUST, SIT_AND_GO)),
    ];
    for (const table of between) {
      expect(() => rebuy(table)).toThrow(hasChips);
      expect(rebuyAndDeal(table, codeFor(2))).toBe(table);
      expect(table.rebuys).toBe(0);
    }
    const dealt = [
      dealHand(seatSession(), codeFor(1)),
      PREFLOP,
      KINGS_SHOWDOWN,
      withFinalStacks([160, 222, 160, 160, 1, 165]),
      withFinalStacks([160, 222, 160, 160, 95, 165]),
      withFinalStacks(BUST),
    ];
    for (const table of dealt) {
      expect(() => rebuy(table)).toThrow(inHand);
      expect(table.rebuys).toBe(0);
    }
    // A sit-and-go user on 0 is never busted, so the Rebuy path changes nothing.
    const sitAndGoDone = withFinalStacks(BUST, SIT_AND_GO);
    expect(rebuyAndDeal(sitAndGoDone, codeFor(2))).toBe(sitAndGoDone);
  });

  it('deal next hand on a bust deals nothing', () => {
    const done = withFinalStacks(BUST);
    expect(dealAfterDone(done, codeFor(2))).toBe(done);
    expect(nextStep(dealAfterDone(done, codeFor(2)))).toBe('done');
    expect(userBusted(done)).toBe(true);
    expect(nextHandDelay(done, false)).toBeNull();
    const restored = nextHand(done);
    expect(dealAfterDone(restored, codeFor(2))).toBe(restored);

    // Without a bust the same path deals the next hand.
    const fine = withFinalStacks([160, 222, 160, 160, 1, 165]);
    const dealtNext = dealAfterDone(fine, codeFor(2));
    expect(nextStep(dealtNext)).not.toBe('done');
    expect(dealtNext.handNumber).toBe(fine.handNumber + 1);
  });
});
