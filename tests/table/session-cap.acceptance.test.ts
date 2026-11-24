import { describe, expect, it } from 'vitest';
import { nextHand, seatSession, type TableState } from '../../src/table/session';
import {
  MAX_SESSION_COUNT,
  findPausedSession,
  parseSessionRecord,
  restoreSession,
  sessionRecord,
  type SessionRecord,
} from '../../src/table/session-record';
import { KINGS_SHOWDOWN, withFinalStacks } from '../support/table-scenarios';

const STARTED = new Date('2026-11-23T10:00:00Z');
const MESSAGE = 'Invalid session record: nextBotName';

const record = (sessionId: string, nextBotName: number): SessionRecord => ({
  ...sessionRecord(seatSession(), {
    sessionId: sessionId.repeat(32),
    startedAt: STARTED,
    updatedAt: STARTED,
  }),
  nextBotName,
});

function rangeError(run: () => unknown): RangeError {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(RangeError);
    return error as RangeError;
  }
  throw new Error('Expected a RangeError');
}

describe('session record nextBotName cap (AC#7)', () => {
  it('nextBotName above MAX_SESSION_COUNT is rejected with RangeError and the paused-session read skips it', () => {
    const good = record('b', 3);
    for (const above of [
      MAX_SESSION_COUNT + 1,
      Number.MAX_SAFE_INTEGER - 1,
      Number.MAX_SAFE_INTEGER,
    ]) {
      const bad = record('a', above);
      expect(rangeError(() => parseSessionRecord(bad)).message).toBe(MESSAGE);
      expect(rangeError(() => restoreSession(bad)).message).toBe(MESSAGE);

      let alone: ReturnType<typeof findPausedSession> | undefined;
      expect(() => (alone = findPausedSession([bad]))).not.toThrow();
      expect(alone?.session).toBeNull();
      expect(alone?.rejected).toHaveLength(1);
      expect(alone?.rejected[0]).toBeInstanceOf(RangeError);
      expect(alone?.rejected[0]?.message).toBe(MESSAGE);

      const mixed = findPausedSession([bad, good]);
      expect(mixed.session).toBe(good);
      expect(mixed.rejected.map((e) => e.message)).toEqual([MESSAGE]);
    }

    expect(parseSessionRecord(record('c', MAX_SESSION_COUNT)).nextBotName).toBe(MAX_SESSION_COUNT);
    expect(parseSessionRecord(record('c', 0)).nextBotName).toBe(0);

    const restored = restoreSession(record('c', MAX_SESSION_COUNT));
    expect(restored.nextBotName).toBe(MAX_SESSION_COUNT);
    // The restored table with KINGS_SHOWDOWN's finished hand, in which Ava (seat 1) ends on $0.
    const busted = withFinalStacks([0, 222, 160, 160, 96, 165], {
      ...restored,
      hand: KINGS_SHOWDOWN.hand,
      replayCode: KINGS_SHOWDOWN.replayCode,
    });
    let next: TableState | undefined;
    expect(() => (next = nextHand(busted))).not.toThrow();
    expect(next?.seats[0]).toMatchObject({ seat: 1, kind: 'bot' });
    expect(next?.seats[0]?.name).not.toBe('Ava');
    expect(next?.nextBotName).toBeGreaterThan(MAX_SESSION_COUNT);
    expect(Number.isSafeInteger(next?.nextBotName)).toBe(true);
  });
});
