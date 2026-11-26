import { describe, expect, it } from 'vitest';
import { replayCodeFromWords, type ReplayCode } from '../../src/engine/deck';
import {
  completedHand,
  countObserved,
  seatSession,
  type CompletedHand,
  type ObservedCounts,
} from '../../src/table/session';
import {
  findPausedSession,
  handWrite,
  parseSessionRecord,
  type SessionRecord,
} from '../../src/table/session-record';
import { playSession } from '../support/session-play';
import { withFinalStacks } from '../support/table-scenarios';

const SESSION = '0123456789abcdef0123456789abcdef';
const STARTED = new Date('2026-11-26T09:00:00Z');
const code = (n: number): ReplayCode => replayCodeFromWords([n, 86, 86, 86]);

/** The session records written after hands 44 and 45 of a headless default session, with counts. */
function after44And45(): [SessionRecord, SessionRecord] {
  const played = playSession(seatSession(), 45, code);
  let counts: ObservedCounts = {};
  const sessions = played.map((done, i) => {
    counts = countObserved(counts, completedHand(done) as CompletedHand);
    const completedAt = new Date(STARTED.getTime() + (i + 1) * 60_000);
    return handWrite(
      done,
      { sessionId: SESSION, startedAt: STARTED, completedAt },
      undefined,
      counts,
    ).session;
  });
  return [sessions[43] as SessionRecord, sessions[44] as SessionRecord];
}

/** A copy of `record` with `observed` replaced. */
function withObserved(record: SessionRecord, observed: unknown): unknown {
  return { ...structuredClone(record), observed };
}

describe('observed record acceptance', () => {
  it('malformed observed counts are rejected naming the field', () => {
    const [older, last] = after44And45();
    expect(last.handsPlayed).toBe(45);
    const first = last.observed?.[0];
    if (first === undefined) throw new Error('No observed entry');
    // Entry 0 set to Ben's example counts: still valid (45 ≤ handsPlayed, 9 ≤ 27 ≤ 45).
    const entry = { ...first, hands: 45, vpipHands: 27, pfrHands: 9 };
    const rest = last.observed?.slice(1) ?? [];
    const base = withObserved(last, [entry, ...rest]);
    expect(parseSessionRecord(base)).toBe(base);
    expect(
      parseSessionRecord(withObserved(last, [{ ...entry, pfrHands: 27, vpipHands: 27 }])),
    ).toBeTruthy();
    expect(
      parseSessionRecord(withObserved(last, [{ ...entry, vpipHands: 45, pfrHands: 45 }])),
    ).toBeTruthy();
    const without: { observed?: unknown } = structuredClone(last);
    delete without.observed;
    expect(parseSessionRecord(without)).toBe(without);
    expect(parseSessionRecord(withObserved(last, []))).toBeTruthy();

    const userSeat = last.config.userSeat;
    expect(last.seats.find((s) => s.seat === userSeat)?.botId).toBeNull();
    const cases: [unknown, string][] = [
      [null, 'observed'],
      [{}, 'observed'],
      [[5], 'observed[0]'],
      [[{ ...entry, hands: 4.5 }], 'observed[0].hands'],
      [[{ ...entry, hands: 0 }], 'observed[0].hands'],
      [[{ ...entry, hands: '45' }], 'observed[0].hands'],
      [[{ ...entry, hands: 46 }], 'observed[0].hands'],
      [[{ ...entry, vpipHands: 46 }], 'observed[0].vpipHands'],
      [[{ ...entry, vpipHands: -1 }], 'observed[0].vpipHands'],
      [[{ ...entry, vpipHands: 2.5 }], 'observed[0].vpipHands'],
      [[{ ...entry, pfrHands: 28 }], 'observed[0].pfrHands'],
      [[{ ...entry, pfrHands: -1 }], 'observed[0].pfrHands'],
      [[{ ...entry, botId: 99 }], 'observed[0].botId'],
      [[{ ...entry, botId: null }], 'observed[0].botId'],
      [[entry, { ...entry }], 'observed[1].botId'],
    ];
    for (const [observed, field] of cases) {
      const bad = withObserved(last, observed);
      expect(() => parseSessionRecord(bad)).toThrow(
        new RangeError(`Invalid session record: ${field}`),
      );
      const { session, rejected } = findPausedSession([bad, structuredClone(older)]);
      expect(rejected.length).toBe(1);
      expect(session).toEqual(older);
    }

    // Dee (seat 4, bot id 4) busts in the hand written, so the record seats her replacement (bot id 6).
    const busted = withFinalStacks([158, 382, 160, 0, 100, 160]);
    const counts = countObserved({}, completedHand(busted) as CompletedHand);
    const { session: replaced } = handWrite(
      busted,
      { sessionId: SESSION, startedAt: STARTED, completedAt: new Date(STARTED.getTime() + 60_000) },
      undefined,
      counts,
    );
    expect(replaced.seats.find((s) => s.seat === 4)?.botId).toBe(6);
    expect(parseSessionRecord(replaced)).toBe(replaced);
    const replacedOld = withObserved(replaced, [
      ...(replaced.observed ?? []),
      { botId: 4, hands: 1, vpipHands: 0, pfrHands: 0 },
    ]);
    const index = replaced.observed?.length ?? 0;
    expect(() => parseSessionRecord(replacedOld)).toThrow(
      new RangeError(`Invalid session record: observed[${index}].botId`),
    );
    const earlier = handWrite(
      busted,
      { sessionId: SESSION, startedAt: STARTED, completedAt: STARTED },
      undefined,
      counts,
    ).session;
    const paused = findPausedSession([replacedOld, earlier]);
    expect(paused.rejected.length).toBe(1);
    expect(paused.session).toBe(earlier);
  }, 60_000);
});
