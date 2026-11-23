import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { replayCodeFromWords } from '../../src/engine/deck';
import type { HandState } from '../../src/engine/hand';
import { openHandStore } from '../../src/storage/hand-store';
import { handRecord, parseHandRecord, type HandRecord } from '../../src/table/hand-record';
import {
  DEFAULT_SESSION_CONFIG,
  applyUserAction,
  completedHand,
  configForPlayers,
  dealHand,
  nextHand,
  nextStep,
  seatSession,
  stepBot,
  userActions,
  type TableState,
} from '../../src/table/session';
import { AVA_UNCONTESTED, SHOWN_HANDS, withFinalStacks } from '../support/table-scenarios';

const SESSION = 'abcdef0123456789abcdef0123456789';
const AT = new Date('2026-11-17T14:32:05Z');

function recordOf(table: TableState, handNumber = 1): HandRecord {
  const hand = completedHand(table);
  if (hand === null) throw new Error('Hand not complete');
  return handRecord(hand, {
    sessionId: SESSION,
    handNumber,
    config: table.config,
    completedAt: AT,
  });
}

/** Deals with `code` and plays to the end, the user checking or calling. */
function playHand(table: TableState, code = replayCodeFromWords([5, 1, 2, 3])): TableState {
  let t = dealHand(table, code);
  for (let guard = 0; guard < 500; guard++) {
    const step = nextStep(t);
    if (step === 'done') return t;
    if (step === 'bot') {
      t = stepBot(t);
    } else {
      const actions = userActions(t);
      const pick =
        actions.find((a) => a.type === 'check') ?? actions.find((a) => a.type === 'call');
      t = applyUserAction(t, pick ?? (actions[0] as (typeof actions)[number]));
    }
  }
  throw new Error('Hand did not finish');
}

/** A copy of `record` with `path` (dot-separated, array indexes as numbers) set to `value`, or deleted. */
function withField(record: HandRecord, path: string, value: unknown, remove = false): unknown {
  const copy = structuredClone(record) as unknown as Record<string, unknown>;
  const keys = path.split('.');
  const last = keys.pop() as string;
  let target = copy;
  for (const key of keys) target = target[key] as Record<string, unknown>;
  if (remove) Reflect.deleteProperty(target, last);
  else target[last] = value;
  return copy;
}

describe('hand record', () => {
  it('parseHandRecord rejects malformed records', async () => {
    const showdown = recordOf(SHOWN_HANDS);
    const foldOut = recordOf(AVA_UNCONTESTED);
    expect(parseHandRecord(showdown)).toBe(showdown);
    expect(parseHandRecord(foldOut)).toBe(foldOut);
    expect(foldOut.shown).toBeNull();
    expect(foldOut.result.returned).toEqual({ seat: 1, amount: 4 });
    expect(parseHandRecord({ ...showdown, advice: 'later field' })).toBeTruthy();

    for (const value of [null, undefined, 1, 'record', [], true]) {
      expect(() => parseHandRecord(value)).toThrow(new RangeError('Invalid hand record: record'));
    }

    const faults: [path: string, value: unknown, field: string][] = [
      ['sessionId', 'ABCDEF0123456789ABCDEF0123456789', 'sessionId'],
      ['sessionId', 7, 'sessionId'],
      ['handNumber', 0, 'handNumber'],
      ['handNumber', 1.5, 'handNumber'],
      ['completedAt', '2026-11-17 14:32:05', 'completedAt'],
      ['completedAt', 'yesterday', 'completedAt'],
      ['completedAt', AT.getTime(), 'completedAt'],
      ['replayCode', '0'.repeat(32), 'replayCode'],
      ['replayCode', null, 'replayCode'],
      ['gameType', 'tournament', 'gameType'],
      ['stake', null, 'stake'],
      ['stake.smallBet', 0, 'stake.smallBet'],
      ['stake.bigBet', '8', 'stake.bigBet'],
      ['level', 0, 'level'],
      ['stakes.bigBlind', -4, 'stakes.bigBlind'],
      ['lineUp', 'Random', 'lineUp'],
      ['button', 11, 'button'],
      ['userSeat', 0, 'userSeat'],
      ['seats', [], 'seats'],
      ['seats', 'six', 'seats'],
      ['seats.0', 'Dee', 'seats[0]'],
      ['seats.1.seat', 1, 'seats[1].seat'],
      ['seats.0.kind', 'robot', 'seats[0].kind'],
      ['seats.4.botId', 6, 'seats[4].botId'],
      ['seats.0.botId', 0, 'seats[0].botId'],
      ['seats.2.botId', null, 'seats[2].botId'],
      ['seats.0.name', '', 'seats[0].name'],
      ['seats.0.style', 'Shark', 'seats[0].style'],
      ['seats.4.style', 'TAG', 'seats[4].style'],
      ['seats.0.startingStack', -1, 'seats[0].startingStack'],
      ['userHoleCards', [1], 'userHoleCards'],
      ['userHoleCards.1', 52, 'userHoleCards[1]'],
      ['actions', null, 'actions'],
      ['actions.0', 3, 'actions[0]'],
      ['actions.0.street', 'showdown', 'actions[0].street'],
      ['actions.0.seat', 0, 'actions[0].seat'],
      ['actions.2.type', 'all-in', 'actions[2].type'],
      ['actions.0.amount', -2, 'actions[0].amount'],
      ['actions.0.added', 2.5, 'actions[0].added'],
      ['board', [1, 2, 3, 4, 5, 6], 'board'],
      ['board.0', 52, 'board[0]'],
      ['board.1', -1, 'board[1]'],
      ['shown', 'none', 'shown'],
      ['shown.shown', null, 'shown.shown'],
      ['shown.shown.0.seat', 12, 'shown.shown[0].seat'],
      ['shown.shown.0.holeCards', [1, 2, 3], 'shown.shown[0].holeCards'],
      ['result', null, 'result'],
      ['result.endedBy', 'timeout', 'result.endedBy'],
      ['result.showdown', null, 'result.showdown'],
      ['result.showdown.0', null, 'result.showdown[0]'],
      ['result.showdown.0.seat', 0, 'result.showdown[0].seat'],
      ['result.showdown.0.holeCards', [60, 1], 'result.showdown[0].holeCards[0]'],
      ['result.showdown.0.rank', -1, 'result.showdown[0].rank'],
      ['result.awards.0', [], 'result.awards[0]'],
      ['result.awards.0.pot', -1, 'result.awards[0].pot'],
      ['result.awards.0.amount', -16, 'result.awards[0].amount'],
      ['result.awards.0.winners', null, 'result.awards[0].winners'],
      ['result.awards.0.winners.0.seat', 11, 'result.awards[0].winners[0].seat'],
      ['result.awards.0.winners.0.amount', -1, 'result.awards[0].winners[0].amount'],
      ['result.returned', { seat: 2, amount: -4 }, 'result.returned.amount'],
    ];
    for (const [path, value, field] of faults) {
      expect(() => parseHandRecord(withField(showdown, path, value)), path).toThrow(
        new RangeError(`Invalid hand record: ${field}`),
      );
    }
    expect(() => parseHandRecord(withField(showdown, 'result.awards', null, true))).toThrow(
      new RangeError('Invalid hand record: result.awards'),
    );
    const twoUsers = withField(showdown, 'seats.0', {
      ...showdown.seats[4],
      seat: 1,
    }) as HandRecord;
    expect(() => parseHandRecord(twoUsers)).toThrow(
      new RangeError('Invalid hand record: seats[0].seat'),
    );
    const noUser = withField(showdown, 'seats', showdown.seats.slice(0, 4));
    expect(() => parseHandRecord(noUser)).toThrow(new RangeError('Invalid hand record: seats'));

    const factory = new IDBFactory();
    const store = openHandStore(factory, 'corrupt');
    await store.add(showdown);
    await new Promise<void>((resolve, reject) => {
      const open = factory.open('corrupt', 1);
      open.onsuccess = () => {
        const transaction = open.result.transaction('hands', 'readwrite');
        transaction.objectStore('hands').put({ ...showdown, handNumber: 2, board: [99] });
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
    });
    await expect(store.get(SESSION, 2)).rejects.toThrow(
      new RangeError('Invalid hand record: board[0]'),
    );

    const hand = completedHand(SHOWN_HANDS);
    if (hand === null) throw new Error('Hand not complete');
    const meta = { sessionId: SESSION, handNumber: 1, config: SHOWN_HANDS.config, completedAt: AT };
    expect(() => handRecord(hand, { ...meta, completedAt: new Date('nope') })).toThrow(
      new RangeError('Invalid hand record: completedAt'),
    );
    expect(() => handRecord(hand, { ...meta, handNumber: 0 })).toThrow(
      new RangeError('Invalid hand record: handNumber'),
    );
    expect(() => handRecord(hand, { ...meta, sessionId: 'session-1' })).toThrow(
      new RangeError('Invalid hand record: sessionId'),
    );
  });

  it('a record shares nothing with the live hand and maps a sit-and-go', () => {
    const record = recordOf(SHOWN_HANDS);
    const live = SHOWN_HANDS.hand as HandState;
    expect(record.actions).toEqual(live.actions);
    expect(record.actions).not.toBe(live.actions);
    expect(record.result).not.toBe(live.result);
    expect(record.board).not.toBe(live.board);

    const sng = playHand(seatSession({ gameType: 'sit-and-go' }));
    const sngRecord = recordOf(sng);
    expect(sngRecord).toMatchObject({
      gameType: 'sit-and-go',
      stake: { smallBet: 20, bigBet: 40 },
      level: 1,
      stakes: { smallBlind: 10, bigBlind: 20, smallBet: 20, bigBet: 40 },
    });
    expect(sngRecord.seats.map((s) => s.startingStack)).toEqual([
      1500, 1500, 1500, 1500, 1500, 1500,
    ]);
    expect(parseHandRecord(sngRecord)).toBe(sngRecord);
  });

  it('bot ids are assigned at seating and on replacement', () => {
    const table = seatSession();
    expect(table.botIds).toEqual({ 1: 1, 2: 2, 3: 3, 4: 4, 6: 5 });
    expect(table.nextBotId).toBe(6);

    const ten = seatSession(configForPlayers(DEFAULT_SESSION_CONFIG, 10));
    expect(ten.botIds).toEqual({ 1: 1, 2: 2, 3: 3, 4: 4, 6: 5, 7: 6, 8: 7, 9: 8, 10: 9 });
    expect(ten.nextBotId).toBe(10);

    const first = nextHand(withFinalStacks([0, 222, 160, 160, 96, 165]));
    expect(first.botIds).toEqual({ 1: 6, 2: 2, 3: 3, 4: 4, 6: 5 });
    expect(first.nextBotId).toBe(7);
    const played = playHand(first);
    const busted = (played.hand as HandState).players.map((p) => p.stack);
    busted[5] = 0;
    const second = nextHand(withFinalStacks(busted, played));
    expect(second.botIds).toEqual({ 1: 6, 2: 2, 3: 3, 4: 4, 6: 7 });
    expect(second.nextBotId).toBe(8);
    const seats = completedHand(playHand(second))?.seats;
    expect(seats?.map((s) => [s.seat, s.botId])).toEqual([
      [1, 6],
      [2, 2],
      [3, 3],
      [4, 4],
      [5, null],
      [6, 7],
    ]);

    const sng = playHand(seatSession({ gameType: 'sit-and-go' }));
    const sngBusted = (sng.hand as HandState).players.map((p) => p.stack);
    sngBusted[0] = 0;
    const sngNext = nextHand(withFinalStacks(sngBusted, sng));
    expect(sngNext.botIds).toEqual(sng.botIds);
    expect(sngNext.nextBotId).toBe(sng.nextBotId);
  });
});
