import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { decisionRecord, handRecord } from '../../src/table/hand-record';
import { storedReviewEntries } from '../../src/table/review';
import { completedHand, type CompletedHand, type TableState } from '../../src/table/session';
import { TableView, type ReviewState } from '../../src/ui/table/Table';
import { REVIEW_LOST_48, REVIEW_WON_56 } from '../support/table-scenarios';

const noop = (): void => undefined;
const CODE = '9e3779b9000000010000000200000003';

function done(table: TableState): CompletedHand {
  const hand = completedHand(table);
  if (hand === null) throw new Error('Hand not complete');
  return hand;
}

function openReview(table: TableState): ReviewState {
  const hand = done(table);
  return { entries: storedReviewEntries(hand, hand.userDecisions.map(decisionRecord)), open: true };
}

function render(table: TableState, review: ReviewState | null): string {
  return renderToString(<TableView table={table} onAct={noop} onLeave={noop} review={review} />);
}

const text = (markup: string): string => markup.replace(/<!-- -->/g, '').replace(/<[^>]*>/g, '');

function panelOf(html: string): string {
  const panels = [...html.matchAll(/<aside[^>]*>(.*?)<\/aside>/gs)];
  expect(panels).toHaveLength(1);
  return panels[0]?.[1] ?? '';
}

/** The text of every `<tag data-part="name">` element (no nested element of the same tag). */
function parts(markup: string, name: string, tag = 'span'): string[] {
  return [
    ...markup.matchAll(new RegExp(`<${tag}[^>]*data-part="${name}"[^>]*>(.*?)</${tag}>`, 'gs')),
  ].map(([, inner = '']) => text(inner));
}

function summaryOf(panel: string): string {
  const title = /<div class="review-title">(.*?)<\/div><button/s.exec(panel)?.[1] ?? '';
  const afterHeading = title.slice(title.indexOf('</h2>') + '</h2>'.length);
  expect(afterHeading).toMatch(/^<div class="review-summary" data-part="summary">/);
  return (
    /<div class="review-summary" data-part="summary">(.*?)<\/div>/s.exec(afterHeading)?.[1] ?? ''
  );
}

function holeCards(summary: string): string[] {
  const groups = [
    ...summary.matchAll(/<span role="group" aria-label="Your hole cards"[^>]*>(.*?)<\/span>/gs),
  ];
  expect(groups).toHaveLength(1);
  return [...(groups[0]?.[1] ?? '').matchAll(/<svg[^>]*data-card="(\w+)"/g)].map((m) => m[1] ?? '');
}

/** The font-size in px of the rule whose selector list contains `selector`. */
function fontSize(css: string, selector: string): number {
  for (const [, selectors = '', body = ''] of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    if (!selectors.split(',').some((s) => s.trim() === selector)) continue;
    const size = /font-size:\s*(\d+)px/.exec(body)?.[1];
    if (size !== undefined) return Number(size);
  }
  throw new Error(`No font-size for ${selector}`);
}

describe('TASK-9.4 review header', () => {
  it('hand 133 header shows the cards, Cutoff and You lost $48', () => {
    const panel = panelOf(render(REVIEW_LOST_48, openReview(REVIEW_LOST_48)));
    expect(panel).toMatch(/<h2 id="review-heading"[^>]*>Hand #133 review<\/h2>/);
    const summary = summaryOf(panel);
    expect(parts(summary, 'result')).toEqual(['You lost $48']);
    expect(holeCards(summary)).toEqual(['Ah', '9s']);
    expect(parts(summary, 'position')).toEqual(['Cutoff']);
    expect(text(summary)).toBe('You lost $48 ·  · Cutoff');
    expect(panel.match(/data-part="summary"/g)).toHaveLength(1);
    for (const banned of ['TBD', '…', 'undefined', 'null', '[object']) {
      expect(text(panel)).not.toContain(banned);
    }
  });

  it('a $16 stake that wins the $72 pot shows You won $56', () => {
    const summary = summaryOf(panelOf(render(REVIEW_WON_56, openReview(REVIEW_WON_56))));
    expect(parts(summary, 'result')).toEqual(['You won $56']);
    expect(holeCards(summary)).toEqual(['Ah', 'As']);
    expect(parts(summary, 'position')).toEqual(['Cutoff']);
  });

  it("the replay code equals the hand record's, in small text, only while the panel is open", () => {
    const hand = done(REVIEW_LOST_48);
    const record = handRecord(
      hand,
      {
        sessionId: '0123456789abcdef0123456789abcdef',
        handNumber: 133,
        config: REVIEW_LOST_48.config,
        completedAt: new Date('2026-11-24T09:00:00Z'),
      },
      hand.userDecisions.map(decisionRecord),
    );
    expect(record.replayCode).toBe(CODE);

    const panel = panelOf(render(REVIEW_LOST_48, openReview(REVIEW_LOST_48)));
    const replays = [...panel.matchAll(/<p([^>]*)data-part="replay"[^>]*>(.*?)<\/p>/gs)];
    expect(replays).toHaveLength(1);
    const [, attrs = '', inner = ''] = replays[0] ?? [];
    expect(attrs).toContain('class="review-replay"');
    expect(text(inner)).toBe(`Hand #133 · Replay code ${CODE}`);
    expect(parts(inner, 'replay-code')).toEqual([record.replayCode]);

    const entries = openReview(REVIEW_LOST_48).entries;
    for (const review of [null, { entries, open: false }, { entries: null, open: true }]) {
      const html = render(REVIEW_LOST_48, review);
      expect(html).not.toContain(CODE);
      expect(html).not.toContain('data-part="summary"');
    }

    const css = readFileSync(new URL('../../src/ui/styles.css', import.meta.url), 'utf8');
    const replay = fontSize(css, '.review-replay');
    expect(replay).toBe(12);
    for (const selector of [
      ".review-entry [data-part='moves']",
      ".review-entry [data-part='chart']",
      '.review-numbers',
      ".review-entry [data-part='explanation']",
    ]) {
      expect(replay).toBeLessThan(fontSize(css, selector));
    }
  });
});
