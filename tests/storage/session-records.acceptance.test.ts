import { IDBDatabase, IDBFactory } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import { nextReplacementName } from '../../src/bots/lineup';
import { replayCodeFromWords, type ReplayCode } from '../../src/engine/deck';
import { legalActions, type Action, type HandState } from '../../src/engine/hand';
import { checkState } from '../../src/engine/invariants';
import { HANDS_STORE, SESSIONS_STORE, openHandStore } from '../../src/storage/hand-store';
import type { HandStore } from '../../src/table/hand-record';
import {
  DEFAULT_SESSION_CONFIG,
  applyUserAction,
  configForLineUp,
  configWithSeatStyle,
  dealHand,
  nextHand,
  nextStep,
  seatSession,
  stepBot,
  type BotStyle,
  type SessionConfig,
  type TableState,
} from '../../src/table/session';
import {
  handWrite,
  restoreSession,
  sessionRecord,
  type SessionRecord,
} from '../../src/table/session-record';
import { KINGS_SHOWDOWN, withFinalStacks } from '../support/table-scenarios';

const SESSION = '0123456789abcdef0123456789abcdef';
const STARTED = new Date('2026-11-23T10:00:00Z');
const codeFor = (hand: number): ReplayCode => replayCodeFromWords([0x9e3779b9, hand, 2, 3]);
const completedAt = (hand: number): Date => new Date(STARTED.getTime() + hand * 60_000);

/** The user checks when it can, else calls (else folds); bots play their own style. */
function checkOrCall(hand: HandState): Action {
  const legal = legalActions(hand);
  return (
    legal.find((a) => a.type === 'check') ??
    legal.find((a) => a.type === 'call') ??
    (legal[0] as Action)
  );
}

function playHand(table: TableState, code: ReplayCode): TableState {
  let t = dealHand(table, code);
  for (let guard = 0; guard < 500; guard++) {
    const hand = t.hand as HandState;
    expect(checkState(hand)).toEqual([]);
    const step = nextStep(t);
    if (step === 'done') return t;
    t = step === 'bot' ? stepBot(t) : applyUserAction(t, checkOrCall(hand));
  }
  throw new Error('Hand did not finish');
}

const seatsOf = (table: TableState) =>
  table.seats.map(({ seat, kind, name, style }) => ({
    seat,
    kind,
    botId: table.botIds[seat] ?? null,
    name,
    style,
    stack: table.stacks.find((s) => s.seat === seat)?.stack,
  }));

async function writeAndRead(store: HandStore, table: TableState): Promise<SessionRecord> {
  const { record, session } = handWrite(table, {
    sessionId: SESSION,
    startedAt: STARTED,
    completedAt: completedAt(table.handNumber),
  });
  await store.add(record, session);
  return (await store.getSession(SESSION)) as SessionRecord;
}

describe('session records acceptance', () => {
  it('after hand 10 the stored session holds hand count 10 and the end-of-hand seats, stacks, styles, line-up and button', async () => {
    const store = openHandStore(new IDBFactory());
    let table = seatSession();
    for (let n = 1; n <= 10; n++) {
      const done = playHand(table, codeFor(n));
      const stored = await writeAndRead(store, done);
      const next = nextHand(done);
      expect(stored.handsPlayed).toBe(n);
      expect(stored.seats).toEqual(seatsOf(next));
      expect(stored.config.lineUp).toBe(next.config.lineUp);
      expect(stored.config).toEqual(DEFAULT_SESSION_CONFIG);
      expect(stored.button).toBe(next.button);
      expect(stored.nextBotName).toBe(next.nextBotName);
      expect(stored.nextBotId).toBe(next.nextBotId);
      expect(stored.updatedAt).toBe(completedAt(n).toISOString());
      expect(stored.startedAt).toBe(STARTED.toISOString());
      expect(stored.level).toBeNull();
      expect(stored.rebuys).toBe(0);
      const restored = restoreSession(stored);
      expect(restored).toEqual(next);
      // The next hand is dealt from the restored state.
      table = restored;
    }
    expect(await store.count()).toBe(10);
    expect(nextStep(playHand(table, codeFor(11)))).toBe('done');
  });

  it('a sit-and-go session round-trips through sessionRecord and restoreSession', async () => {
    const store = openHandStore(new IDBFactory());
    const done = playHand(seatSession({ gameType: 'sit-and-go' }), codeFor(1));
    const stored = await writeAndRead(store, done);
    expect(stored.level).toBe(1);
    expect(stored.config.gameType).toBe('sit-and-go');
    expect(restoreSession(stored)).toEqual(nextHand(done));
  });

  it('a hand record and its session update are written in one transaction', async () => {
    const store = openHandStore(new IDBFactory());
    const hand3 = { ...KINGS_SHOWDOWN, handNumber: 3 };
    const write3 = handWrite(hand3, {
      sessionId: SESSION,
      startedAt: STARTED,
      completedAt: STARTED,
    });
    const transaction = vi.spyOn(IDBDatabase.prototype, 'transaction');
    try {
      await store.add(write3.record, write3.session);
      expect(transaction).toHaveBeenCalledWith([HANDS_STORE, SESSIONS_STORE], 'readwrite', {
        durability: 'strict',
      });
    } finally {
      transaction.mockRestore();
    }
    expect((await store.getSession(SESSION))?.handsPlayed).toBe(3);

    const session4 = { ...write3.session, handsPlayed: 4 };
    await expect(store.add(write3.record, session4)).rejects.toMatchObject({
      name: 'ConstraintError',
    });
    expect(await store.getSession(SESSION)).toEqual(write3.session);

    const write4 = handWrite(
      { ...KINGS_SHOWDOWN, handNumber: 4 },
      { sessionId: SESSION, startedAt: STARTED, completedAt: completedAt(4) },
    );
    await store.add(write4.record, write4.session);
    expect(await store.get(SESSION, 4)).toEqual(write4.record);
    expect(await store.getSession(SESSION)).toEqual(write4.session);
    expect(write4.session.handsPlayed).toBe(4);
  });

  it("an edited line-up is stored as Custom with every seat's style", async () => {
    const mixed = configForLineUp(DEFAULT_SESSION_CONFIG, 6, 'Mixed');
    const seat2 = mixed.seats.find((s) => s.seat === 2)?.style as BotStyle;
    const other: BotStyle = seat2 === 'Rock' ? 'Maniac' : 'Rock';
    const edited: SessionConfig = configWithSeatStyle(mixed, 'Mixed', 2, other);
    const table = seatSession(edited);
    const store = openHandStore(new IDBFactory());
    await store.putSession(
      sessionRecord(table, { sessionId: SESSION, startedAt: STARTED, updatedAt: STARTED }),
    );
    const stored = (await store.getSession(SESSION)) as SessionRecord;
    expect(stored.handsPlayed).toBe(0);
    expect(stored.config.lineUp).toBe('Custom');
    expect(stored.config.seats).toHaveLength(6);
    expect(stored.seats).toHaveLength(6);
    for (const [i, seat] of edited.seats.entries()) {
      expect(stored.config.seats[i]).toEqual(seat);
      expect(stored.seats[i]).toMatchObject({
        seat: seat.seat,
        kind: seat.kind,
        style: seat.style,
      });
      if (seat.kind === 'user') expect(stored.seats[i]?.style).toBeNull();
    }
    expect(stored.seats.find((s) => s.seat === 2)?.style).toBe(other);
  });

  it("a replaced bot's new id, name, style and $160 stack are stored after hand 5", async () => {
    const hand5: TableState = { ...withFinalStacks([160, 0, 160, 160, 96, 165]), handNumber: 5 };
    expect(hand5.botIds[2]).toBe(2);
    const store = openHandStore(new IDBFactory());
    const stored = await writeAndRead(store, hand5);
    expect(stored.handsPlayed).toBe(5);
    expect(stored.seats.find((s) => s.seat === 2)).toEqual({
      seat: 2,
      kind: 'bot',
      botId: 6,
      name: nextReplacementName(
        0,
        hand5.seats.map((s) => s.name),
      ).name,
      style: hand5.seats.find((s) => s.seat === 2)?.style,
      stack: 160,
    });
    expect(stored.nextBotId).toBe(7);
  });
});
