import { describe, expect, it } from 'vitest';
import { EMPTY_STYLE_COUNTS } from '../../src/stats/style-stats';
import {
  countObserved,
  completedHand,
  nextHand,
  type CompletedHand,
  type ObservedCounts,
} from '../../src/table/session';
import {
  handWrite,
  restoreObserved,
  sessionRecord,
  type SessionRecord,
} from '../../src/table/session-record';
import { KINGS_SHOWDOWN, observedStyle, withFinalStacks } from '../support/table-scenarios';

const SESSION = '0123456789abcdef0123456789abcdef';
const META = {
  sessionId: SESSION,
  startedAt: new Date('2026-11-26T09:00:00Z'),
  completedAt: new Date('2026-11-26T09:01:00Z'),
};

/** KINGS_SHOWDOWN with Dee (seat 4, bot id 4) on $0: Ben holds her $160, so she is replaced in nextHand. */
const DEE_BUSTED = withFinalStacks([158, 382, 160, 0, 100, 160]);

describe('observed record', () => {
  it('write rules', () => {
    // Bot id 1 (seat 1) had earlier hands; every bot of this hand adds one.
    const earlier: ObservedCounts = { 1: observedStyle(4, 2, 1) };
    const counts = countObserved(earlier, completedHand(DEE_BUSTED) as CompletedHand);
    expect(counts[4]?.handsDealt).toBe(1);
    const { session } = handWrite(DEE_BUSTED, META, undefined, counts);
    const replacement = session.seats.find((s) => s.seat === 4)?.botId;
    expect(replacement).toBe(6);
    const entry = (id: number) => ({
      botId: id,
      hands: counts[id]?.handsDealt,
      vpipHands: counts[id]?.voluntary,
      pfrHands: counts[id]?.preflopRaised,
    });
    expect(session.observed).toEqual([entry(1), entry(2), entry(3), entry(5)]);
    expect(session.observed?.[0]).toEqual({ botId: 1, hands: 5, vpipHands: 2, pfrHands: 1 });
    expect(session.observed?.[1]).toEqual({ botId: 2, hands: 1, vpipHands: 1, pfrHands: 1 });
    expect(session.observed?.map((o) => o.botId)).not.toContain(4);

    const plain = handWrite(DEE_BUSTED, META).session;
    expect(Object.hasOwn(plain, 'observed')).toBe(false);
    // JSON drops an undefined property, so this is the record without its `observed` key.
    expect(JSON.stringify(plain)).toBe(JSON.stringify({ ...session, observed: undefined }));

    const ready = nextHand(KINGS_SHOWDOWN);
    const meta = { sessionId: SESSION, startedAt: META.startedAt, updatedAt: META.completedAt };
    expect(Object.hasOwn(sessionRecord(ready, meta), 'observed')).toBe(false);
    expect(sessionRecord(ready, meta, {}).observed).toEqual([]);
  });

  it('restore rules', () => {
    const meta = { sessionId: SESSION, startedAt: META.startedAt, updatedAt: META.completedAt };
    const base = sessionRecord(nextHand(KINGS_SHOWDOWN), meta);
    const record: SessionRecord = {
      ...base,
      handsPlayed: 45,
      observed: [{ botId: 2, hands: 45, vpipHands: 27, pfrHands: 9 }],
    };
    expect(restoreObserved(structuredClone(record))).toEqual({
      2: { ...EMPTY_STYLE_COUNTS, handsDealt: 45, voluntary: 27, preflopRaised: 9 },
    });
    expect(restoreObserved(base)).toEqual({});
    const bad = { ...record, observed: [{ botId: 2, hands: 46, vpipHands: 27, pfrHands: 9 }] };
    expect(() => restoreObserved(bad)).toThrow(
      new RangeError('Invalid session record: observed[0].hands'),
    );
  });
});
