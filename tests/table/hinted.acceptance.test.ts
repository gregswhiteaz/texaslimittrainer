import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { formatPct } from '../../src/advice/explain';
import { recommend, userAdviceOptions, type Recommendation } from '../../src/advice/recommend';
import type { HandState } from '../../src/engine/hand';
import { playerView } from '../../src/engine/player-view';
import { openHandStore } from '../../src/storage/hand-store';
import { actionLabel, isShortAllIn } from '../../src/table/action-bar';
import { handleAdviceRequest } from '../../src/table/advice-service';
import { handRecord, type HandRecord } from '../../src/table/hand-record';
import { hintCard } from '../../src/table/hint';
import {
  completedHand,
  countObserved,
  userObservedSnapshot,
  type CompletedHand,
  type TableState,
} from '../../src/table/session';
import {
  LIMP_THEN_BET,
  REVIEW_DECK,
  observedStyle,
  userTableAfter,
} from '../support/table-scenarios';

const SESSION = '0123456789abcdef0123456789abcdef';

/** The user limps, calls Ben's $4 flop bet, then checks the turn and river to a showdown. */
const HINT_FLOP_MOVES = `${LIMP_THEN_BET} 5:call 2:check 5:check 2:check 5:check`;

/** User 7c 2d, Ben Ac Kd; the board runs Ah Ks Qd, 9h, 3s. */
const JUNK_DECK = {
  1: 'Ac',
  7: 'Kd',
  4: '7c',
  10: '2d',
  13: 'Ah',
  14: 'Ks',
  15: 'Qd',
  17: '9h',
  19: '3s',
};

/** Ben calls the user's raise (his observed VPIP applies from 30 hands), donk-bets the flop and the user calls. */
const RAISE_PRE = '3:fold 4:fold 5:raise 6:fold 1:fold 2:call 2:bet';
const CALLED_DONK_MOVES = `${RAISE_PRE} 5:call 2:check 5:check 2:check 5:check`;

function done(table: TableState): CompletedHand {
  const hand = completedHand(table);
  if (hand === null) throw new Error('Hand not complete');
  return hand;
}

async function stored(table: TableState): Promise<HandRecord> {
  const record = handRecord(done(table), {
    sessionId: SESSION,
    handNumber: 1,
    config: table.config,
    completedAt: new Date('2026-11-24T09:00:00Z'),
  });
  const store = openHandStore(new IDBFactory());
  await store.add(record);
  const read = await store.get(record.sessionId, record.handNumber);
  if (read === null) throw new Error('Record not stored');
  return read;
}

const flopHinted = (hints: Readonly<Record<number, number>>): TableState =>
  userTableAfter(REVIEW_DECK, HINT_FLOP_MOVES, 6, {}, undefined, hints);

describe('hinted decisions acceptance', () => {
  it('hint opened at the flop marks only the flop entry hinted', async () => {
    const { decisions } = await stored(flopHinted({ 1: 1 }));
    expect(decisions.map((d) => d.street)).toEqual(['preflop', 'flop', 'turn', 'river']);
    expect(decisions[1]?.action.type).toBe('call');
    expect(decisions.map((d) => d.hinted)).toEqual([false, true, false, false]);
  });

  it('a hint hidden again before acting still marks the decision hinted', async () => {
    const { decisions } = await stored(flopHinted({ 1: 2 }));
    expect(decisions.map((d) => d.hinted)).toEqual([false, true, false, false]);
  });

  it('opening the hint three times at one decision gives one hinted entry', async () => {
    const { decisions } = await stored(flopHinted({ 1: 5 }));
    expect(decisions).toHaveLength(4);
    const hinted = decisions.filter((d) => d.hinted);
    expect(hinted).toHaveLength(1);
    expect(decisions.findIndex((d) => d.hinted)).toBe(1);
    expect(hinted[0]?.street).toBe('flop');
  });

  it('a hinted call 10 points short is still graded Major error', async () => {
    const hinted = await stored(
      userTableAfter(JUNK_DECK, HINT_FLOP_MOVES, 6, {}, undefined, { 1: 1 }),
    );
    const plain = await stored(userTableAfter(JUNK_DECK, HINT_FLOP_MOVES));
    const entry = hinted.decisions[1];
    if (entry === undefined || entry.basis !== 'equity') throw new Error('Expected a flop entry');
    expect(entry.street).toBe('flop');
    expect(entry.action.type).toBe('call');
    expect(
      (entry.requiredEquityPct as number) - (entry.equityPct as number),
    ).toBeGreaterThanOrEqual(10);
    expect(entry.hinted).toBe(true);
    expect(entry.grade.grade).toBe('major');
    expect(entry.grade.ruleId).toBe('call-fold-margin');
    expect(entry).toEqual({ ...plain.decisions[1], hinted: true });
    expect(plain.decisions[1]?.hinted).toBe(false);
  });

  it('stored advice of a hinted decision equals the hint card after the opponent reaches 30 hands', async () => {
    const flopTable = userTableAfter(REVIEW_DECK, RAISE_PRE);
    const botId = flopTable.botIds[2] as number;
    const counts = { [botId]: observedStyle(29, 15, 4) };
    const snapshot = userObservedSnapshot(flopTable, counts);
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0]).toMatchObject({ seat: 2, hands: 29 });

    const view = playerView(flopTable.hand as HandState, flopTable.config.userSeat);
    const response = handleAdviceRequest({ id: 1, kind: 'recommend', view, observed: snapshot });
    if (!response.ok) throw new Error(response.error.message);
    const rec = response.value as Recommendation;
    const card = hintCard(rec, view, flopTable);

    const table = userTableAfter(REVIEW_DECK, CALLED_DONK_MOVES, 6, {}, snapshot, { 1: 1 });
    const after = countObserved(counts, done(table));
    expect(after[botId]?.handsDealt).toBe(30);

    const entry = (await stored(table)).decisions[1];
    if (entry === undefined || entry.basis !== 'equity') throw new Error('Expected a flop entry');
    expect(entry.street).toBe('flop');
    expect(entry.action.type).toBe('call');
    expect(entry.hinted).toBe(true);
    expect(entry.recommended).toEqual(rec.move);
    expect(
      actionLabel(entry.recommended, {
        allIn: isShortAllIn(view, entry.recommended),
        unit: 'dollars',
      }),
    ).toBe(card.action);
    expect(formatPct(entry.equityPct as number)).toBe(card.equity);
    expect(formatPct(entry.requiredEquityPct as number)).toBe(card.requiredEquity);
    expect(entry.explanation).toBe(card.explanation);
    expect(entry.opponentBasis.map((b) => b.text)).toEqual(card.opponents.map((o) => o.basis));
    expect(entry.opponentBasis.find((b) => b.seat === 2)?.text).toBe('typical player');

    const control = recommend(view, userAdviceOptions(userObservedSnapshot(table, after)));
    if (control.basis !== 'equity') throw new Error('Expected equity');
    expect(control.opponentBasis.find((b) => b.seat === 2)?.observedHands).toBe(30);
    expect(entry.opponentBasis).not.toEqual(control.opponentBasis);
  });
});
