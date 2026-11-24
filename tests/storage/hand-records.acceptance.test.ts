import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { tagPolicy } from '../../src/bots/tag';
import { replayCodeFromWords } from '../../src/engine/deck';
import type { HandState } from '../../src/engine/hand';
import { playerView } from '../../src/engine/player-view';
import { styleCounts, styleStats } from '../../src/stats/style-stats';
import { openHandStore } from '../../src/storage/hand-store';
import { handRecord, type HandRecord } from '../../src/table/hand-record';
import {
  DEFAULT_SESSION_CONFIG,
  applyUserAction,
  completedHand,
  dealHand,
  nextHand,
  nextStep,
  seatSession,
  stepBot,
  type CompletedHand,
  type TableState,
} from '../../src/table/session';
import { KINGS_SHOWDOWN, SHOWN_HANDS } from '../support/table-scenarios';

const SESSION = '0123456789abcdef0123456789abcdef';

function done(table: TableState): CompletedHand {
  const hand = completedHand(table);
  if (hand === null) throw new Error('Hand not complete');
  return hand;
}

function recordOf(table: TableState, handNumber = table.handNumber, at = new Date()): HandRecord {
  return handRecord(done(table), {
    sessionId: SESSION,
    handNumber,
    config: table.config,
    completedAt: at,
  });
}

async function storedRecord(record: HandRecord): Promise<HandRecord | null> {
  const store = openHandStore(new IDBFactory());
  await store.add(record);
  return store.get(record.sessionId, record.handNumber);
}

/** Deals with `code` and plays to the end: bots by stepBot, the user by tagPolicy on its own view. */
function playHand(table: TableState, code: string): TableState {
  let t = dealHand(table, code);
  for (let guard = 0; guard < 500; guard++) {
    const step = nextStep(t);
    if (step === 'done') return t;
    if (step === 'bot') {
      t = stepBot(t);
    } else {
      const hand = t.hand as HandState;
      t = applyUserAction(t, tagPolicy(playerView(hand, t.config.userSeat)));
    }
  }
  throw new Error('Hand did not finish');
}

describe('hand records acceptance', () => {
  it('completedAt is the time the hand completed', async () => {
    const record = recordOf(KINGS_SHOWDOWN, 1, new Date('2026-11-17T14:32:05Z'));
    expect((await storedRecord(record))?.completedAt).toBe('2026-11-17T14:32:05.000Z');
  });

  it('a scripted $4/$8 showdown record holds the scripted values', async () => {
    const at = new Date('2026-11-17T14:32:05Z');
    const stored = await storedRecord(recordOf(KINGS_SHOWDOWN, 7, at));
    expect(stored).not.toBeNull();
    const { actions, decisions, ...rest } = stored as HandRecord;
    expect(actions).toHaveLength(19);
    expect(decisions).toHaveLength(6);
    expect(rest).toEqual({
      sessionId: '0123456789abcdef0123456789abcdef',
      handNumber: 7,
      completedAt: '2026-11-17T14:32:05.000Z',
      replayCode: '9e3779b9000000010000000200000003',
      gameType: 'cash',
      stake: { smallBet: 4, bigBet: 8 },
      level: null,
      stakes: { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 },
      lineUp: 'Custom',
      button: 6,
      userSeat: 5,
      seats: [
        { seat: 1, kind: 'bot', botId: 1, name: 'Ava', style: 'TAG', startingStack: 160 },
        { seat: 2, kind: 'bot', botId: 2, name: 'Ben', style: 'TAG', startingStack: 160 },
        { seat: 3, kind: 'bot', botId: 3, name: 'Cal', style: 'TAG', startingStack: 160 },
        { seat: 4, kind: 'bot', botId: 4, name: 'Dee', style: 'TAG', startingStack: 160 },
        { seat: 5, kind: 'user', botId: null, name: 'You', style: null, startingStack: 160 },
        { seat: 6, kind: 'bot', botId: 5, name: 'Eli', style: 'TAG', startingStack: 160 },
      ],
      // Ah 9s
      userHoleCards: [50, 31],
      // Ks 9d 4c 2h 6s
      board: [47, 29, 8, 2, 19],
      // Ben's Kd 7c
      shown: { shown: [{ seat: 2, holeCards: [45, 20] }] },
      result: {
        endedBy: 'showdown',
        showdown: [{ seat: 2, holeCards: [45, 20], rank: 3747 }],
        awards: [{ pot: 0, amount: 122, winners: [{ seat: 2, amount: 122 }] }],
      },
    });
  });

  it('every action is stored in order and style stats from records equal live stats', async () => {
    const shown = await storedRecord(recordOf(SHOWN_HANDS));
    expect(shown?.actions).toEqual((SHOWN_HANDS.hand as HandState).actions);
    expect(shown?.actions.slice(0, 3)).toEqual([
      { street: 'preflop', seat: 4, type: 'small-blind', amount: 2, added: 2 },
      { street: 'preflop', seat: 5, type: 'big-blind', amount: 4, added: 4 },
      { street: 'preflop', seat: 6, type: 'fold', amount: 0, added: 0 },
    ]);

    const store = openHandStore(new IDBFactory());
    const live: CompletedHand[] = [];
    const records: HandRecord[] = [];
    let table = seatSession();
    for (let i = 1; i <= 40; i++) {
      table = playHand(table, replayCodeFromWords([i, 1, 2, 3]));
      live.push(done(table));
      await store.add(recordOf(table));
      const read = await store.get(SESSION, table.handNumber);
      if (read === null) throw new Error(`Hand ${table.handNumber} not stored`);
      records.push(read);
      table = nextHand(table);
    }
    expect(await store.count()).toBe(40);
    expect(records.some((r) => r.result.endedBy === 'showdown')).toBe(true);
    expect(records.some((r) => r.result.endedBy === 'fold')).toBe(true);
    for (const [i, record] of records.entries()) {
      expect(record.actions).toEqual(live[i]?.actions);
    }
    for (const { seat } of DEFAULT_SESSION_CONFIG.seats) {
      expect(styleStats(styleCounts(records, seat)), `seat ${seat}`).toEqual(
        styleStats(styleCounts(live, seat)),
      );
    }
  });

  it('a replaced bot has a different id, name and starting stack', async () => {
    const kings = KINGS_SHOWDOWN.hand as HandState;
    const hand7: TableState = {
      ...KINGS_SHOWDOWN,
      handNumber: 7,
      hand: {
        ...kings,
        players: kings.players.map((p) =>
          p.seat === 1 ? { ...p, startingStack: 120, stack: 0 } : p,
        ),
      },
    };
    const next = nextHand(hand7);
    expect(next.handNumber).toBe(8);
    const hand8 = playHand(next, replayCodeFromWords([8, 1, 2, 3]));

    const store = openHandStore(new IDBFactory());
    await store.add(recordOf(hand7));
    await store.add(recordOf(hand8));
    const seven = await store.get(SESSION, 7);
    const eight = await store.get(SESSION, 8);
    const seat1 = (r: HandRecord | null) => r?.seats.find((s) => s.seat === 1);
    expect(seat1(seven)).toMatchObject({ botId: 1, name: 'Ava', startingStack: 120 });
    expect(seat1(eight)).toMatchObject({ botId: hand7.nextBotId, name: 'Jay', startingStack: 160 });
    expect(seat1(eight)?.botId).not.toBe(seat1(seven)?.botId);
    expect(seven?.seats.slice(1).map((s) => s.botId)).toEqual([2, 3, 4, null, 5]);
    expect(eight?.seats.slice(1).map((s) => s.botId)).toEqual([2, 3, 4, null, 5]);
  });

  it('a write to an existing session and hand number is rejected', async () => {
    const store = openHandStore(new IDBFactory());
    const first = recordOf(KINGS_SHOWDOWN, 1, new Date('2026-11-17T14:32:05Z'));
    await store.add(first);
    const second = recordOf(SHOWN_HANDS, 1, new Date('2026-11-17T15:00:00Z'));
    await expect(store.add(second)).rejects.toMatchObject({ name: 'ConstraintError' });
    expect(await store.get(SESSION, 1)).toEqual(first);
    expect(await store.count()).toBe(1);
    for (const method of ['put', 'update', 'delete']) expect(store).not.toHaveProperty(method);
  });
});
