import { describe, expect, it } from 'vitest';
import { recommend, userAdviceOptions, type Recommendation } from '../../src/advice/recommend';
import type { GradeResult } from '../../src/advice/grade';
import { replayCodeFromWords, type ReplayCode } from '../../src/engine/deck';
import type { HandState } from '../../src/engine/hand';
import { handleAdviceRequest } from '../../src/table/advice-service';
import { decisionEntry } from '../../src/table/hand-record';
import { requestHint, type HintAdvisor } from '../../src/table/hint';
import {
  countObserved,
  completedHand,
  applyUserAction,
  dealHand,
  nextHand,
  nextStep,
  seatSession,
  stepBot,
  userObservedSnapshot,
  type CompletedHand,
  type ObservedCounts,
  type TableState,
} from '../../src/table/session';
import {
  findPausedSession,
  handWrite,
  restoreObserved,
  restoreSession,
  type SessionRecord,
} from '../../src/table/session-record';
import { checkOrCall, playSession } from '../support/session-play';

const SESSION = '0123456789abcdef0123456789abcdef';
const STARTED = new Date('2026-11-26T09:00:00Z');
const code = (n: number): ReplayCode => replayCodeFromWords([n, 86, 86, 86]);

interface Paused {
  readonly last: TableState;
  readonly counts: ObservedCounts;
  readonly sessions: readonly SessionRecord[];
}

let paused: Paused | null = null;

/** 45 headless hands of a default 6-max session, each written with handWrite and its counts; played once
 *  per file. */
function pausedAfter45(): Paused {
  if (paused !== null) return paused;
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
  paused = { last: played.at(-1) as TableState, counts, sessions };
  return paused;
}

/** The stored session after hand 45 read back as Home does: JSON round trip, then findPausedSession. */
function resumed(sessions: readonly SessionRecord[]): {
  table: TableState;
  counts: ObservedCounts;
} {
  const { session, rejected } = findPausedSession([
    JSON.parse(JSON.stringify(sessions.at(-1))) as unknown,
  ]);
  expect(rejected).toEqual([]);
  if (session === null) throw new Error('No paused session');
  return { table: restoreSession(session), counts: restoreObserved(session) };
}

const advisor: HintAdvisor = {
  recommend: (view, observed) => Promise.resolve(recommend(view, userAdviceOptions(observed))),
};

/** Deals `table` with `c` and plays it (bots by stepBot, the user by check/call) to the user's first postflop
 *  decision with a live opponent of exactly 45 hands in `counts`; null if the hand ends first. */
function postflopWith45(
  table: TableState,
  counts: ObservedCounts,
  c: ReplayCode,
): { table: TableState; seat: number } | null {
  let t = dealHand(table, c);
  for (let guard = 0; guard < 500; guard++) {
    const step = nextStep(t);
    if (step === 'done') return null;
    const hand = t.hand as HandState;
    if (step === 'user' && hand.street !== 'preflop') {
      const live = hand.players.find((p) => {
        const id = t.botIds[p.seat];
        return !p.folded && id !== undefined && counts[id]?.handsDealt === 45;
      });
      if (live !== undefined) return { table: t, seat: live.seat };
    }
    t = step === 'bot' ? stepBot(t) : applyUserAction(t, checkOrCall(hand));
  }
  throw new Error('Hand did not finish');
}

describe('observed counts across Resume acceptance', () => {
  it('restored counts equal the counts before the pause', () => {
    const { last, counts, sessions } = pausedAfter45();
    const restored = resumed(sessions);
    const before = userObservedSnapshot(nextHand(last), counts);
    expect(userObservedSnapshot(restored.table, restored.counts)).toEqual(before);
    const original = seatSession().botIds;
    const kept = Object.entries(restored.table.botIds).filter(
      ([seat, id]) => original[Number(seat)] === id,
    );
    expect(kept.length).toBeGreaterThan(0);
    for (const [seat] of kept) {
      expect(before.find((o) => o.seat === Number(seat))?.hands).toBe(45);
    }
  }, 60_000);

  it('resumed hint and stored decision use the restored counts', async () => {
    const restored = resumed(pausedAfter45().sessions);
    let found: { table: TableState; seat: number } | null = null;
    for (let n = 1; n <= 10 && found === null; n++) {
      found = postflopWith45(restored.table, restored.counts, replayCodeFromWords([n, 1, 2, 3]));
    }
    if (found === null) throw new Error('No postflop decision with a live 45-hand opponent');
    const { table, seat } = found;
    const text = 'based on 45 hands of this opponent';

    const rec = await requestHint(advisor, table, restored.counts);
    if (rec.basis !== 'equity') throw new Error('Expected a postflop recommendation');
    expect(rec.opponentBasis.find((b) => b.seat === seat)?.text).toBe(text);

    const snapshot = userObservedSnapshot(table, restored.counts);
    const acted = applyUserAction(table, checkOrCall(table.hand as HandState), snapshot);
    const decision = acted.userDecisions.at(-1);
    if (decision === undefined) throw new Error('No decision stored');
    expect(decision.observed).toEqual(snapshot);
    expect(decision.observed?.find((o) => o.seat === seat)?.hands).toBe(45);

    const response = handleAdviceRequest({
      id: 1,
      kind: 'grade',
      view: decision.view,
      userAction: decision.action.type,
      observed: decision.observed ?? [],
    });
    if (!response.ok) throw new Error(response.error.message);
    const entry = decisionEntry(response.value as GradeResult<Recommendation>, decision);
    expect(entry.opponentBasis.find((b) => b.seat === seat)?.text).toBe(text);
    expect(entry.opponentBasis).toEqual(rec.opponentBasis);
  }, 60_000);
});
