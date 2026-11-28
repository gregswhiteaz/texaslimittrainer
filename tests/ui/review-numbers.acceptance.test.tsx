import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { chartBasisText, formatPct } from '../../src/advice/explain';
import type { GradeResult } from '../../src/advice/grade';
import type { ObservedOpponent } from '../../src/advice/ranges';
import { recommend, userAdviceOptions, type Recommendation } from '../../src/advice/recommend';
import type { PreflopRecommendation } from '../../src/advice/preflop';
import { handleAdviceRequest } from '../../src/table/advice-service';
import { gradedDecisions, NO_GRADES, requestNewGrades } from '../../src/table/decision-grades';
import {
  decisionEntry,
  handRecord,
  parseHandRecord,
  type HandRecordDecision,
} from '../../src/table/hand-record';
import { hintCard } from '../../src/table/hint';
import { storedReviewEntries } from '../../src/table/review';
import {
  completedHand,
  type CompletedHand,
  type TableState,
  type UserDecision,
} from '../../src/table/session';
import { handWrite } from '../../src/table/session-record';
import { TableView } from '../../src/ui/table/Table';
import { FLOP_BET, SHOWDOWN, storyboardShowdown } from '../support/table-scenarios';

// The armed switch of the gradeView mock (SPEC-09): while true, grading on this thread throws.
const grading = vi.hoisted(() => ({ armed: false }));
vi.mock('../../src/advice/grade', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/advice/grade')>();
  return {
    ...actual,
    gradeView: (...args: Parameters<typeof actual.gradeView>) => {
      if (grading.armed) throw new Error('graded on the main thread');
      return actual.gradeView(...args);
    },
  };
});

afterEach(() => {
  grading.armed = false;
});

const SESSION = '0123456789abcdef0123456789abcdef';
const noop = (): void => undefined;

function done(table: TableState): CompletedHand {
  const hand = completedHand(table);
  if (hand === null) throw new Error('Hand not complete');
  return hand;
}

function meta(table: TableState) {
  return {
    sessionId: SESSION,
    handNumber: table.handNumber,
    config: table.config,
    completedAt: new Date('2026-11-24T09:00:00Z'),
  };
}

/** The worker path: the `grade` reply for the decision, converted to its stored entry. */
function workerEntry(decision: UserDecision): HandRecordDecision {
  const response = handleAdviceRequest({
    id: 1,
    kind: 'grade',
    view: decision.view,
    userAction: decision.action.type,
    ...(decision.observed === undefined ? {} : { observed: decision.observed }),
  });
  if (!response.ok) throw new Error(response.error.message);
  return decisionEntry(response.value as GradeResult<Recommendation>, decision);
}

function render(table: TableState, decisions: readonly HandRecordDecision[]): string {
  const entries = storedReviewEntries(done(table), decisions);
  return renderToString(
    <TableView table={table} onAct={noop} onLeave={noop} review={{ entries, open: true }} />,
  );
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#x27;': "'",
};
const text = (markup: string): string =>
  markup
    .replace(/<!-- -->/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&(amp|lt|gt|quot|#x27);/g, (e) => ENTITIES[e] ?? e);

interface Shown {
  street: string;
  cards: string[];
  you: string;
  advice: string;
  grade: string;
  chart: string | null;
  equity: string | null;
  required: string | null;
  explanation: string | null;
  opponents: string[];
  body: string;
}

function one(body: string, pattern: RegExp): string | null {
  const match = pattern.exec(body);
  return match === null ? null : text(match[1] ?? '');
}

/** Each `<li data-entry>` up to the next entry or the list's end, read part by part. */
function shownEntries(html: string): Shown[] {
  const list = /<ol aria-label="Decisions"[^>]*>(.*)<\/ol>/s.exec(html)?.[1] ?? '';
  return [...list.matchAll(/<li data-entry="\d+"[^>]*>(.*?)(?=<li data-entry|$)/gs)].map(
    ([, body = '']) => ({
      street: one(body, /<span data-part="street"[^>]*>(.*?)<\/span>/s) ?? '',
      cards: [...body.matchAll(/<svg[^>]*data-card="(\w+)"/g)].map((m) => m[1] ?? ''),
      you: one(body, /<span data-part="you"[^>]*>(.*?)<\/span>/s) ?? '',
      advice: one(body, /<span data-part="advice"[^>]*>(.*?)<\/span>/s) ?? '',
      grade: one(body, /<span data-part="grade"[^>]*>(.*?)<\/span>/s) ?? '',
      chart: one(body, /<p data-part="chart"[^>]*>(.*?)<\/p>/s),
      equity: one(body, /<span data-part="equity"[^>]*>(.*?)<\/span>/s),
      required: one(body, /<span data-part="required"[^>]*>(.*?)<\/span>/s),
      explanation: one(body, /<p data-part="explanation"[^>]*>(.*?)<\/p>/s),
      opponents: [
        ...(/<ul aria-label="Opponent ranges"[^>]*>(.*?)<\/ul>/s.exec(body)?.[1] ?? '').matchAll(
          /<li data-opponent="\d+"[^>]*>(.*?)<\/li>/gs,
        ),
      ].map(([, inner = '']) => text(inner)),
      body,
    }),
  );
}

/** SHOWDOWN's stored decisions as read back: record → JSON → parseHandRecord. */
function parsedDecisions(table: TableState): readonly HandRecordDecision[] {
  const record = handRecord(done(table), meta(table));
  return parseHandRecord(JSON.parse(JSON.stringify(record))).decisions;
}

const snapshot = (hands: number): ObservedOpponent[] => [{ seat: 2, hands, vpip: 60, pfr: 5 }];

describe('TASK-9.3 review numbers', () => {
  it('four stored decisions show street, board, moves, grade, numbers and explanation', () => {
    const decisions = parsedDecisions(SHOWDOWN);
    const shown = shownEntries(render(SHOWDOWN, decisions));
    expect(shown).toHaveLength(4);
    expect(
      shown.map(({ street, cards, you, advice, grade }) => ({ street, cards, you, advice, grade })),
    ).toEqual([
      { street: 'Preflop', cards: [], you: 'Raise to $8', advice: 'Raise to $8', grade: 'Correct' },
      {
        street: 'Flop',
        cards: ['Ks', '9d', '4c'],
        you: 'Call $4',
        advice: 'Call $4',
        grade: 'Correct',
      },
      {
        street: 'Turn',
        cards: ['Ks', '9d', '4c', '2h'],
        you: 'Bet $8',
        advice: 'Check',
        grade: 'Major error',
      },
      {
        street: 'River',
        cards: ['Ks', '9d', '4c', '2h', '7c'],
        you: 'Check',
        advice: 'Bet $8',
        grade: 'Minor error',
      },
    ]);
    expect(shown.map((e) => [e.chart, e.equity, e.required])).toEqual([
      ['From the 6-max chart: raise A9o from the cutoff', null, null],
      [null, 'Equity 37.1%', 'Required equity 11.8%'],
      [null, 'Equity 28.3%', 'Required equity 0.0%'],
      [null, 'Equity 54.5%', 'Required equity 0.0%'],
    ]);
    expect(shown.map((e) => e.opponents)).toEqual([
      ['Ava: typical player', 'Ben: typical player', 'Eli: typical player'],
      ['Ben: typical player', 'Eli: typical player'],
      ['Ben: typical player', 'Eli: typical player'],
      ['Ben: typical player'],
    ]);
    shown.forEach((entry, i) => {
      const d = decisions[i] as HandRecordDecision;
      expect(entry.explanation).toBe(d.explanation);
      expect(entry.explanation?.length).toBeGreaterThan(0);
      if (d.basis === 'equity') {
        expect(entry.equity).toBe(`Equity ${formatPct(d.equityPct as number)}`);
        expect(entry.required).toBe(`Required equity ${formatPct(d.requiredEquityPct as number)}`);
      }
    });
  });

  it('a preflop entry shows the chart basis instead of equity', () => {
    const decisions = parsedDecisions(SHOWDOWN);
    const [preflop] = shownEntries(render(SHOWDOWN, decisions));
    expect(preflop?.chart).toBe('From the 6-max chart: raise A9o from the cutoff');
    expect(preflop?.body).not.toContain('data-part="equity"');
    expect(preflop?.body).not.toContain('data-part="required"');
    const withoutExplanation = (preflop?.body ?? '').replace(
      /<p data-part="explanation"[^>]*>.*?<\/p>/s,
      '',
    );
    expect(text(withoutExplanation)).not.toContain('%');

    const view = (done(SHOWDOWN).userDecisions[0] as UserDecision).view;
    const hint = recommend(view, userAdviceOptions()) as PreflopRecommendation;
    expect(preflop?.chart).toBe(chartBasisText(hint));
    expect(hintCard(hint, view, SHOWDOWN).chartBasis).toBe(preflop?.chart);
  });

  it('basis lines show 40 observed hands and typical player', () => {
    const table = storyboardShowdown(snapshot(40));
    const shown = shownEntries(render(table, parsedDecisions(table)));
    expect(shown[1]?.opponents).toEqual([
      'Ben: based on 40 hands of this opponent',
      'Eli: typical player',
    ]);
    expect(shown[1]?.equity).toBe('Equity 34.4%');
    expect(shown[1]?.required).toBe('Required equity 11.8%');
    expect(shown[0]?.opponents).toEqual([
      'Ava: typical player',
      'Ben: typical player',
      'Eli: typical player',
    ]);
  });

  it('the review repeats the flop hint after the count reaches 30', () => {
    const table = storyboardShowdown(snapshot(29));
    const hand = done(table);
    const flop = hand.userDecisions[1] as UserDecision;
    expect(flop.view.street).toBe('flop');
    expect(flop.observed).toEqual(snapshot(29));

    const reply = handleAdviceRequest({
      id: 1,
      kind: 'recommend',
      view: flop.view,
      observed: snapshot(29),
    });
    if (!reply.ok) throw new Error(reply.error.message);
    const rec = reply.value as Recommendation;
    const hint = hintCard(rec, flop.view, FLOP_BET);

    const decisions = hand.userDecisions.map(workerEntry);
    const entry = storedReviewEntries(hand, decisions)[1];
    expect(entry?.decision.recommended).toEqual(rec.move);
    expect(entry?.equity).toBe('37.1%');
    expect(entry?.requiredEquity).toBe('11.8%');
    expect(entry?.equity).toBe(hint.equity);
    expect(entry?.requiredEquity).toBe(hint.requiredEquity);
    expect(entry?.explanation).toBe(hint.explanation);
    expect(entry?.opponents).toEqual(hint.opponents);
    expect(entry?.opponents).toEqual([
      { seat: 2, name: 'Ben', basis: 'typical player' },
      { seat: 6, name: 'Eli', basis: 'typical player' },
    ]);

    // After the hand Ben's count is 30: a recompute now would differ from what was stored.
    const later = workerEntry({ ...flop, observed: snapshot(30) });
    expect(formatPct(later.equityPct as number)).toBe('33.7%');
    expect(later.opponentBasis.map((b) => b.text)).toContain('based on 30 hands of this opponent');
    expect(later.equityPct).not.toBe(entry?.decision.equityPct);
    expect(storedReviewEntries(hand, decisions)[1]?.equity).toBe('37.1%');
  });

  it('stored text is rendered as plain text', () => {
    const decisions = parsedDecisions(SHOWDOWN);
    const hostile = decisions.map((d, i) =>
      i === 1
        ? {
            ...d,
            explanation: '<img src=x onerror="alert(1)"> & <b>bold</b>',
            opponentBasis: [{ seat: 2, observedHands: null, text: '<i>x</i>' }],
          }
        : d,
    );
    const html = render(SHOWDOWN, hostile);
    expect(html).toContain('&lt;img');
    expect(html).toContain('&lt;b&gt;bold&lt;/b&gt;');
    expect(html).toContain('&lt;i&gt;x&lt;/i&gt;');
    expect(html).not.toMatch(/<img/);
    expect(html).not.toMatch(/<b>/);
    expect(html).not.toMatch(/<i>/);
    const source = readFileSync(new URL('../../src/ui/table/ReviewPanel.tsx', import.meta.url), {
      encoding: 'utf8',
    });
    expect(source).not.toContain('dangerouslySetInnerHTML');
  });

  it('the hand-end path reads stored decisions and never grades', async () => {
    const hand = done(SHOWDOWN);
    const decisions = hand.userDecisions.map(workerEntry);
    const grades = requestNewGrades(NO_GRADES, SHOWDOWN, (d) =>
      Promise.resolve(decisions[hand.userDecisions.indexOf(d)] as HandRecordDecision),
    );

    grading.armed = true;
    expect(() => handRecord(hand, meta(SHOWDOWN))).toThrow('graded on the main thread');
    const resolved = await gradedDecisions(grades, SHOWDOWN);
    expect(resolved).toEqual(decisions);
    expect(storedReviewEntries(hand, resolved)).toHaveLength(4);
    const { record } = handWrite(
      SHOWDOWN,
      { sessionId: SESSION, startedAt: new Date(0), completedAt: new Date(1) },
      resolved,
    );
    expect(record.decisions).toEqual(decisions);
    record.decisions.forEach((d, i) => {
      const input = decisions[i] as HandRecordDecision;
      expect(d).not.toBe(input);
      expect(d.action).not.toBe(input.action);
      expect(d.recommended).not.toBe(input.recommended);
      expect(d.grade).not.toBe(input.grade);
      expect(d.opponentBasis).not.toBe(input.opponentBasis);
    });
    expect(parseHandRecord(JSON.parse(JSON.stringify(record))).decisions).toHaveLength(4);
    grading.armed = false;

    const plain = parseHandRecord(JSON.parse(JSON.stringify(handRecord(hand, meta(SHOWDOWN)))));
    expect(plain.decisions.map((d) => d.action.type)).toEqual(['raise', 'call', 'bet', 'check']);
  });
});
