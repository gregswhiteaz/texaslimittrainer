import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { completedHand, type CompletedHand } from '../../src/table/session';
import { decisionRecord, type HandRecordDecision } from '../../src/table/hand-record';
import { storedReviewEntries } from '../../src/table/review';
import type { TableState } from '../../src/table/session';
import { TableView } from '../../src/ui/table/Table';
import { REVIEW_DECK, REVIEW_FOUR, userTableAfter } from '../support/table-scenarios';

const noop = (): void => undefined;

/** REVIEW_FOUR's moves: raise, flop bet, turn check, river call. */
const FOUR_MOVES =
  '3:fold 4:fold 5:raise 6:fold 1:fold 2:call 2:check 5:bet 2:call 2:check 5:check 2:bet 5:call';
/** FOUR_MOVES with the river call replaced by a fold (graded Major error). */
const RIVER_FOLD_MOVES = FOUR_MOVES.replace(/5:call$/, '5:fold');

const text = (markup: string): string => markup.replace(/<!-- -->/g, '').replace(/<[^>]*>/g, '');

interface Rendered {
  html: string;
  panel: string;
  entries: string[];
  decisions: HandRecordDecision[];
  hand: CompletedHand;
}

function renderReview(table: TableState): Rendered {
  const hand = completedHand(table) as CompletedHand;
  const decisions = hand.userDecisions.map(decisionRecord);
  const entries = storedReviewEntries(hand, decisions);
  const html = renderToString(
    <TableView table={table} onAct={noop} onLeave={noop} review={{ entries, open: true }} />,
  );
  const [, panel = ''] = /<aside[^>]*>(.*?)<\/aside>/s.exec(html) ?? [];
  return { html, panel, entries: panel.split('<li data-entry').slice(1), decisions, hand };
}

const count = (body: string, re: RegExp): number => [...body.matchAll(re)].length;
const HINTED = /<span data-part="hinted" class="hinted-tag">hinted<\/span>/g;
const VERDICT =
  /<span class="review-verdict"><span data-part="grade" data-grade="(\w+)"[^>]*>(.*?)<\/span>(<span data-part="hinted"[^>]*>(.*?)<\/span>)?<\/span>/s;

function verdict(entry: string): { grade: string; label: string; tag: string | undefined } {
  const match = VERDICT.exec(entry);
  expect(match, 'entry has a review-verdict group').not.toBeNull();
  const [, grade = '', label = '', , tag] = match ?? [];
  return { grade, label: text(label), tag: tag === undefined ? undefined : text(tag) };
}

const streetOf = (entry: string): string => /data-street="(\w+)"/.exec(entry)?.[1] ?? '';

describe('TASK-9.6 hinted tag', () => {
  it('only the flop entry, hinted at the flop, shows the hinted tag', () => {
    const r = renderReview(userTableAfter(REVIEW_DECK, FOUR_MOVES, 6, {}, undefined, { 1: 1 }));
    expect(r.decisions.map((d) => d.hinted)).toEqual([false, true, false, false]);
    expect(r.entries).toHaveLength(4);
    expect(r.entries.map(streetOf)).toEqual(['preflop', 'flop', 'turn', 'river']);
    expect(r.entries.map((e) => count(e, /data-part="hinted"/g))).toEqual([0, 1, 0, 0]);
    expect(r.entries.map((e) => verdict(e).label)).toEqual([
      'Correct',
      'Correct',
      'Minor error',
      'Correct',
    ]);
    expect(verdict(r.entries[1] ?? '')).toEqual({
      grade: 'correct',
      label: 'Correct',
      tag: 'hinted',
    });
    expect(count(r.panel, /data-part="hinted"/g)).toBe(1);
    expect(count(r.panel, HINTED)).toBe(1);
    const panelText = text(r.panel);
    for (const banned of ['TBD', '…', 'undefined', 'null', '[object']) {
      expect(panelText).not.toContain(banned);
    }
  });

  it('a hinted Major error shows Major error and hinted', () => {
    const r = renderReview(
      userTableAfter(REVIEW_DECK, RIVER_FOLD_MOVES, 6, {}, undefined, { 3: 1 }),
    );
    expect(r.decisions.map((d) => d.hinted)).toEqual([false, false, false, true]);
    expect(r.entries).toHaveLength(4);
    const river = r.entries[3] ?? '';
    expect(streetOf(river)).toBe('river');
    expect(river).toMatch(/<span data-part="you">Fold<\/span>/);
    expect(verdict(river)).toEqual({ grade: 'major', label: 'Major error', tag: 'hinted' });
    expect(r.entries.slice(0, 3).map((e) => count(e, /data-part="hinted"/g))).toEqual([0, 0, 0]);
  });

  it('a hand with no hinted decision shows no hinted tag', () => {
    const r = renderReview(REVIEW_FOUR);
    expect(r.decisions.every((d) => !d.hinted)).toBe(true);
    expect(r.panel).not.toMatch(/data-part="hinted"/);
    expect(r.panel).not.toMatch(/hinted-tag/);
    expect(text(r.panel)).not.toMatch(/\bhinted\b/i);
    expect(r.entries).toHaveLength(4);
    for (const entry of r.entries) {
      expect(count(entry, /data-part="grade"/g)).toBe(1);
      expect(verdict(entry).tag).toBeUndefined();
    }
  });

  it('hint opened and hidden at the first of several decisions tags only the first entry', () => {
    const r = renderReview(userTableAfter(REVIEW_DECK, FOUR_MOVES, 6, {}, undefined, { 0: 2 }));
    expect(r.hand.userDecisions.length).toBeGreaterThanOrEqual(2);
    expect(r.entries.length).toBeGreaterThanOrEqual(2);
    expect(r.entries).toHaveLength(4);
    expect(r.decisions.map((d) => d.hinted)).toEqual([true, false, false, false]);
    expect(r.entries.map((e) => count(e, /data-part="hinted"/g))).toEqual([1, 0, 0, 0]);
    expect(verdict(r.entries[0] ?? '').tag).toBe('hinted');
  });
});
