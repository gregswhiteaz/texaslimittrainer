import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { replayCodeFromWords, type ReplayCode } from '../../src/engine/deck';
import { minimumStack, type Action, type HandState } from '../../src/engine/hand';
import { userActionBar } from '../../src/table/action-bar';
import { handleAdviceRequest } from '../../src/table/advice-service';
import { handResultView } from '../../src/table/hand-result';
import {
  DEFAULT_SESSION_CONFIG,
  MAX_SESSION_COUNT,
  SIT_AND_GO_LEVEL_1,
  applyBotDecision,
  applyUserAction,
  botTurn,
  dealHand,
  nextHand,
  nextHandDelay,
  nextStep,
  rebuy,
  resolveSessionConfig,
  seatSession,
  sitAndGoStopped,
  stakesFor,
  userBusted,
  type TableState,
} from '../../src/table/session';
import {
  MAX_SESSION_COUNT as RECORD_MAX_SESSION_COUNT,
  parseSessionRecord,
  restoreSession,
  sessionRecord,
} from '../../src/table/session-record';
import { tableView } from '../../src/table/table-view';
import { dealAfterDone, rebuyAndDeal } from '../../src/ui/table/useTableSession';
import { checkOrCall } from '../support/session-play';
import { KINGS_SHOWDOWN, withFinalStacks } from '../support/table-scenarios';

const META = {
  sessionId: '0123456789abcdef0123456789abcdef',
  startedAt: new Date('2026-11-23T10:00:00Z'),
  updatedAt: new Date('2026-11-23T10:00:00Z'),
};
const CODE = replayCodeFromWords([1, 1, 2, 3]);
/** The e2e spec's pinned replay words (A-4). */
const E2E_WORDS = [40, 1, 2, 3];
const BUST = [160, 222, 160, 160, 0, 165];

const stackValues = (table: TableState): number[] => table.stacks.map((s) => s.stack);
const startingStacks = (table: TableState): number[] =>
  (table.hand as HandState).players.map((p) => p.startingStack);

/** A finished sit-and-go hand: KINGS_SHOWDOWN's hand at 20/40. */
const SIT_AND_GO: TableState = {
  ...KINGS_SHOWDOWN,
  config: resolveSessionConfig({ gameType: 'sit-and-go' }),
  stakes: stakesFor(SIT_AND_GO_LEVEL_1),
};

/** The A-4 seed: default 6-max, all TAG, 12 hands played, the user on $50 with the button on seat 3. */
function seededShortStack(): TableState {
  const seated = seatSession(DEFAULT_SESSION_CONFIG);
  return {
    ...seated,
    stacks: seated.stacks.map((s) => (s.seat === 5 ? { seat: 5, stack: 50 } : s)),
    button: 3,
    handNumber: 13,
  };
}

/** One bot action as the app takes it: the advice worker's answer for the turn's style and seed. */
function appBot(table: TableState): TableState {
  const turn = botTurn(table);
  const { view, style, seed } = turn;
  const response = handleAdviceRequest({ id: 1, kind: 'bot', view, style, seed });
  if (!response.ok) throw new Error(response.error.message);
  return applyBotDecision(table, turn, response.value as Action);
}

/** Deals with `code` and plays to the end as the live table does, the user checking or calling. Returns the
 *  finished table, the user's action-bar labels at each turn and the most Pots lines seen. */
function playLive(
  table: TableState,
  code: ReplayCode,
): { done: TableState; labels: string[][]; mostPots: number } {
  let t = dealHand(table, code);
  const labels: string[][] = [];
  let mostPots = 0;
  for (let guard = 0; guard < 500; guard++) {
    mostPots = Math.max(mostPots, tableView(t).pots.length);
    const step = nextStep(t);
    if (step === 'done') return { done: t, labels, mostPots };
    if (step === 'user') {
      labels.push((userActionBar(t)?.buttons ?? []).map((b) => b.label));
      t = applyUserAction(t, checkOrCall(t.hand as HandState));
    } else {
      t = appBot(t);
    }
  }
  throw new Error('Hand did not finish');
}

describe('short stack acceptance', () => {
  it('a seat below the old $96 minimum is not topped up and plays its chips', () => {
    const final = [158, 222, 160, 160, 95, 165];
    const next = nextHand(withFinalStacks(final));
    expect(stackValues(next)).toEqual(final);
    expect(next.rebuys).toBe(0);
    expect(nextStep(next)).toBe('deal');
    expect(startingStacks(dealHand(next, CODE))).toEqual(final);

    for (const user of [1, 4, 8, 30]) {
      const stacks = [160, 222, 160, 160, user, 165];
      const carried = nextHand(withFinalStacks(stacks));
      expect(stackValues(carried), `user on ${user}`).toEqual(stacks);
      expect(nextStep(carried)).toBe('deal');
      expect(startingStacks(dealHand(carried, CODE))).toEqual(stacks);
    }

    expect(nextStep(nextHand(withFinalStacks(BUST)))).toBe('rebuy');
    const botBust = nextHand(withFinalStacks([0, 222, 160, 160, 30, 165]));
    expect(stackValues(botBust)).toEqual([160, 222, 160, 160, 30, 165]);
    expect(botBust.seats[0]?.name).not.toBe(KINGS_SHOWDOWN.seats[0]?.name);
    const botShort = nextHand(withFinalStacks([30, 222, 160, 160, 160, 165]));
    expect(stackValues(botShort)).toEqual([30, 222, 160, 160, 160, 165]);
    expect(botShort.seats).toEqual(KINGS_SHOWDOWN.seats);
  });

  it('session.ts carries no TEMPORARY top-up', () => {
    const source = readFileSync(new URL('../../src/table/session.ts', import.meta.url), 'utf8');
    expect(source).not.toContain('TEMPORARY (TASK-3.4 Q-4)');
    expect(source).not.toContain('TEMPORARY');
    expect(source).not.toContain('< minimum ? buyIn(');
    expect(source).not.toContain('minimumStack');
  });

  it('the e2e seed reaches all-in labels and side pots after a short carry', () => {
    const code = replayCodeFromWords(E2E_WORDS);
    const resumed = restoreSession(sessionRecord(seededShortStack(), META));
    const hand13 = playLive(resumed, code).done;
    expect(hand13.handNumber).toBe(13);
    expect(hand13.hand?.players.find((p) => p.seat === 5)?.stack).toBe(18);

    const next = nextHand(hand13);
    expect(tableView(next).header).toBe('Cash · 6 players · $4/$8 · Hand #14');
    const { done, labels, mostPots } = playLive(next, code);
    expect(done.hand?.players.find((p) => p.seat === 5)?.startingStack).toBe(18);
    // Three full-size turns first (from the small blind and a $4 flop bet offered), then the all-ins.
    expect(labels).toEqual([
      ['Fold', 'Call $6', 'Raise to $12'],
      ['Fold', 'Call $4', 'Raise to $16'],
      ['Check', 'Bet $4'],
      ['Fold', 'Call $4', 'Raise all-in to $6'],
      ['Check', 'Bet all-in $2'],
      ['Fold', 'Call all-in $2'],
    ]);
    expect(mostPots).toBeGreaterThanOrEqual(2);
    // A-4 re-pinned: the spec's prototype ($62 main pot) drove bots by stepBot; the live app (and this test)
    // decide through the advice worker's seeded style policy, as the browser run of e2e/short-stack confirms.
    expect(handResultView(done)?.pots?.map((p) => p.text)).toEqual([
      'Main pot $54 · Dee wins $54',
      'Side pot $124 · Dee wins $124',
    ]);
  });

  it('a sit-and-go seat is never refilled', () => {
    const short = minimumStack(SIT_AND_GO.stakes) - 1;
    expect(short).toBe(479);
    const cases = [
      [short, 1500, 1500, 1500, 1500, 2521],
      [0, 1979, 1500, 1500, 1500, 2521],
      [1500, 1500, 1500, 1500, 0, 2521],
    ];
    for (const final of cases) {
      const done = withFinalStacks(final, SIT_AND_GO);
      const next = nextHand(done);
      expect(stackValues(next)).toEqual(final);
      expect(next.seats).toEqual(SIT_AND_GO.seats);
      expect(next.botIds).toEqual(SIT_AND_GO.botIds);
      expect(next.nextBotId).toBe(SIT_AND_GO.nextBotId);
      expect(next.nextBotName).toBe(SIT_AND_GO.nextBotName);
      expect(userBusted(done)).toBe(false);
      expect(userBusted(next)).toBe(false);
    }
    expect(nextStep(nextHand(withFinalStacks(cases[0] as number[], SIT_AND_GO)))).toBe('deal');
  });

  it('a sit-and-go with a seat on 0 deals nothing more', () => {
    const stopped = new RangeError('The sit-and-go has stopped: a seat has no chips');
    for (const final of [
      [0, 1979, 1500, 1500, 1500, 2521],
      [1500, 1500, 1500, 1500, 0, 2521],
      [0, 0, 3000, 1500, 1500, 2521],
    ]) {
      const done = withFinalStacks(final, SIT_AND_GO);
      expect(sitAndGoStopped(done)).toBe(true);
      expect(nextHandDelay(done)).toBeNull();
      expect(nextHandDelay(done, true)).toBeNull();
      expect(dealAfterDone(done, CODE)).toBe(done);
      const next = nextHand(done);
      expect(sitAndGoStopped(next)).toBe(true);
      expect(nextStep(next)).toBe('stopped');
      expect(nextHandDelay(next)).toBeNull();
      expect(() => dealHand(next, CODE)).toThrow(stopped);
    }

    const live = withFinalStacks([479, 1500, 1500, 1500, 1500, 2521], SIT_AND_GO);
    expect(sitAndGoStopped(live)).toBe(false);
    expect(nextHandDelay(live)).toBe(1500);
    const midHand = dealHand(seatSession({ gameType: 'sit-and-go' }), CODE);
    expect(nextStep(midHand)).not.toBe('done');
    expect(sitAndGoStopped(midHand)).toBe(false);
    expect(sitAndGoStopped(withFinalStacks(BUST))).toBe(false);
    expect(sitAndGoStopped(nextHand(withFinalStacks(BUST)))).toBe(false);
    expect(sitAndGoStopped(seatSession())).toBe(false);
  });

  it('rebuy never counts past MAX_SESSION_COUNT', () => {
    expect(MAX_SESSION_COUNT).toBe(1_000_000_000);
    expect(RECORD_MAX_SESSION_COUNT).toBe(MAX_SESSION_COUNT);
    const limit = new RangeError('No rebuy: the rebuy limit is reached');

    const record = sessionRecord(nextHand(withFinalStacks(BUST)), META);
    const atCap = restoreSession({ ...record, rebuys: MAX_SESSION_COUNT });
    expect(userBusted(atCap)).toBe(true);
    expect(() => rebuy(atCap)).toThrow(limit);
    expect(rebuyAndDeal(atCap, CODE)).toBe(atCap);
    const doneAtCap = { ...withFinalStacks(BUST), rebuys: MAX_SESSION_COUNT };
    expect(rebuyAndDeal(doneAtCap, CODE)).toBe(doneAtCap);

    const belowCap = restoreSession({ ...record, rebuys: MAX_SESSION_COUNT - 1 });
    const last = rebuy(belowCap);
    expect(last.rebuys).toBe(MAX_SESSION_COUNT);
    const bustAgain = withFinalStacks(BUST, {
      ...dealHand(last, CODE),
      hand: KINGS_SHOWDOWN.hand,
    });
    expect(userBusted(bustAgain)).toBe(true);
    const busted = nextHand(bustAgain);
    expect(() => rebuy(busted)).toThrow(limit);
    expect(rebuyAndDeal(bustAgain, CODE)).toBe(bustAgain);

    for (const table of [atCap, last, busted]) {
      const written = sessionRecord(table, META);
      expect(written.rebuys).toBeLessThanOrEqual(MAX_SESSION_COUNT);
      expect(parseSessionRecord(structuredClone(written))).toEqual(written);
    }
  });
});
