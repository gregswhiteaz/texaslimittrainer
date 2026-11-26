import { describe, expect, it } from 'vitest';
import { replayCodeFromWords, type ReplayCode } from '../../src/engine/deck';
import { type Action, type HandState } from '../../src/engine/hand';
import type { PlayerView } from '../../src/engine/player-view';
import { Xoshiro128 } from '../../src/engine/seeded-random';
import { styleCounts, styleStats } from '../../src/stats/style-stats';
import { hintInput } from '../../src/table/hint';
import { restoreSession, sessionRecord } from '../../src/table/session-record';
import {
  applyUserAction,
  completedHand,
  countObserved,
  dealHand,
  nextHand,
  nextStep,
  seatSession,
  stepBot,
  userActions,
  userObservedSnapshot,
  type CompletedHand,
  type ObservedCounts,
  type TableState,
} from '../../src/table/session';
import { checkOrCall } from '../support/session-play';
import {
  FLOP_BET,
  KINGS_SHOWDOWN,
  observedStyle,
  withFinalStacks,
} from '../support/table-scenarios';

const code = (n: number): ReplayCode => replayCodeFromWords([n, 7, 7, 7]);

/** A cheap seeded policy: any legal action (no equity work). */
function randomLegal(seed: number): (view: PlayerView) => Action {
  const random = new Xoshiro128(seed);
  return (view) => view.legalActions[random.nextUint32() % view.legalActions.length] as Action;
}

/** Deals with `c` and plays to the end: bots by `policy`, the user by checkOrCall. */
function playOut(
  table: TableState,
  c: ReplayCode,
  policy: (view: PlayerView) => Action,
): TableState {
  let t = dealHand(table, c);
  while (nextStep(t) !== 'done') {
    t =
      nextStep(t) === 'bot'
        ? stepBot(t, policy)
        : applyUserAction(t, checkOrCall(t.hand as HandState));
  }
  return t;
}

describe('observed snapshot', () => {
  it('snapshot counts every finished hand per bot', () => {
    const policy = randomLegal(42);
    let table = seatSession();
    let counts: ObservedCounts = {};
    expect(userObservedSnapshot(table, counts)).toEqual([]);
    const hands: CompletedHand[] = [];
    for (let n = 1; n <= 8; n++) {
      const done = playOut(table, code(n), policy);
      const record = completedHand(done) as CompletedHand;
      hands.push(record);
      counts = countObserved(counts, record);
      table = nextHand(done);
    }
    // Nobody busts in 8 hands from $160 at $4/$8 with these seeds, so every bot keeps its id.
    expect(table.botIds).toEqual(seatSession().botIds);
    const snapshot = userObservedSnapshot(table, counts);
    const botSeats = table.seats.filter((s) => s.kind === 'bot').map((s) => s.seat);
    expect(snapshot.map((o) => o.seat)).toEqual(botSeats);
    expect(snapshot.map((o) => o.seat)).not.toContain(table.config.userSeat);
    for (const entry of snapshot) {
      const stats = styleStats(styleCounts(hands, entry.seat));
      expect(entry).toEqual({ seat: entry.seat, hands: 8, vpip: stats.vpip, pfr: stats.pfr });
    }
    expect(userObservedSnapshot(table, counts)).not.toBe(snapshot);
  });

  it('replaced bot resets its observed hands', () => {
    const busted = withFinalStacks([0, 222, 160, 160, 96, 165]);
    let counts = countObserved({}, completedHand(busted) as CompletedHand);
    const next = nextHand(busted);
    expect(next.botIds[1]).not.toBe(busted.botIds[1]);
    const before = userObservedSnapshot(next, counts);
    expect(before.map((o) => o.seat)).toEqual([2, 3, 4, 6]);
    expect(before.every((o) => o.hands === 1)).toBe(true);

    const again = { ...dealHand(next, code(9)), hand: KINGS_SHOWDOWN.hand };
    counts = countObserved(counts, completedHand(again) as CompletedHand);
    const after = userObservedSnapshot(again, counts);
    expect(after.map((o) => [o.seat, o.hands])).toEqual([
      [1, 1],
      [2, 2],
      [3, 2],
      [4, 2],
      [6, 2],
    ]);
  });

  it('a record written without counts restores an empty snapshot', () => {
    // A record written without counts (start records, records saved before TASK-8.6) carries none, so the
    // resumed session starts from an empty snapshot (TASK-8.6 A-1).
    const record = sessionRecord(nextHand(KINGS_SHOWDOWN), {
      sessionId: '0123456789abcdef0123456789abcdef',
      startedAt: new Date(0),
      updatedAt: new Date(0),
    });
    expect(JSON.stringify(record)).not.toMatch(/observed|handsDealt/i);
    expect(userObservedSnapshot(restoreSession(structuredClone(record)), {})).toEqual([]);
  });

  it('decision snapshot equals hint snapshot', () => {
    const counts: ObservedCounts = { 2: observedStyle(45, 27, 9), 5: observedStyle(12, 3, 1) };
    const input = hintInput(FLOP_BET, counts);
    expect(input?.observed).toEqual([
      { seat: 2, hands: 45, vpip: 60, pfr: 20 },
      { seat: 6, hands: 12, vpip: 25, pfr: (1 / 12) * 100 },
    ]);
    const call = userActions(FLOP_BET).find((a) => a.type === 'call') as Action;
    const acted = applyUserAction(FLOP_BET, call, userObservedSnapshot(FLOP_BET, counts));
    expect(acted.userDecisions.at(-1)?.observed).toEqual(input?.observed);
  });
});
