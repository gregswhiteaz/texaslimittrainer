import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { completedHand, type CompletedHand } from '../../src/table/session';
import { decisionRecord } from '../../src/table/hand-record';
import { storedReviewEntries } from '../../src/table/review';
import { TableView, type ReviewState } from '../../src/ui/table/Table';
import { REVIEW_FOUR } from '../support/table-scenarios';

const noop = (): void => undefined;

function render(review?: ReviewState | null): string {
  return renderToString(
    <TableView table={REVIEW_FOUR} onAct={noop} onLeave={noop} review={review} />,
  );
}

const text = (markup: string): string => markup.replace(/<!-- -->/g, '').replace(/<[^>]*>/g, '');

function part(body: string, name: string): string[] {
  return [...body.matchAll(new RegExp(`<span data-part="${name}"[^>]*>(.*?)</span>`, 'gs'))].map(
    ([, inner = '']) => text(inner),
  );
}

const DEAL_NEXT = /<button type="button" class="deal-next"[^>]*>Deal next hand<\/button>/;

describe('TASK-9.1 review panel', () => {
  it('the review panel lists 4 graded entries beside the table with Close and Deal next hand', () => {
    const hand = completedHand(REVIEW_FOUR) as CompletedHand;
    const entries = storedReviewEntries(hand, hand.userDecisions.map(decisionRecord));
    const html = render({ entries, open: true });

    const sectionEnd = html.indexOf('</section>');
    const section = html.slice(html.indexOf('<section aria-label="Table"'), sectionEnd);
    expect(section).toMatch(/<div role="status"/);
    expect(section).not.toMatch(/<aside/);
    const after = html.slice(sectionEnd);
    expect(after).toMatch(new RegExp(`^</section>${DEAL_NEXT.source}</div><aside`));
    expect(html).toMatch(/<div class="table-main"><section aria-label="Table"/);

    const asides = [...html.matchAll(/<aside[^>]*>(.*?)<\/aside>/gs)];
    expect(asides).toHaveLength(1);
    const [panelTag = ''] = /<aside[^>]*>/.exec(html) ?? [];
    expect(panelTag).toBe('<aside class="review-panel" aria-labelledby="review-heading">');
    const panel = asides[0]?.[1] ?? '';
    expect(panel).toMatch(/<h2 id="review-heading"[^>]*>Hand #1 review<\/h2>/);
    expect(panel.match(/<button[^>]*aria-label="Close review"/g)).toHaveLength(1);

    const list = /<ol aria-label="Decisions"[^>]*>(.*)<\/ol>/s.exec(panel)?.[1] ?? '';
    // Each entry runs to the next entry or the list's end, so nested opponent items do not cut it short.
    const items = [...list.matchAll(/<li data-entry="\d+"[^>]*>(.*?)(?=<li data-entry|$)/gs)].map(
      ([, body = '']) => body,
    );
    expect(items).toHaveLength(4);
    expect(items.map((b) => part(b, 'street'))).toEqual([
      ['Preflop'],
      ['Flop'],
      ['Turn'],
      ['River'],
    ]);
    expect(
      items.map((b) => [...b.matchAll(/<svg[^>]*data-card="(\w+)"/g)].map((m) => m[1])),
    ).toEqual([[], ['Ks', '9d', '4c'], ['Ks', '9d', '4c', '2h'], ['Ks', '9d', '4c', '2h', '6s']]);
    expect(items.map((b) => b.includes('aria-label="Community cards"'))).toEqual([
      false,
      true,
      true,
      true,
    ]);
    expect(items.map((b) => part(b, 'you'))).toEqual([
      ['Raise to $8'],
      ['Bet $4'],
      ['Check'],
      ['Call $8'],
    ]);
    // The stored advice: the hint's options (ACTION_RANGE_ADVICE), as in decision-record.acceptance (TASK-9.3).
    expect(items.map((b) => part(b, 'advice'))).toEqual([
      ['Raise to $8'],
      ['Bet $4'],
      ['Bet $8'],
      ['Call $8'],
    ]);
    for (const body of items) {
      const moves = /<p data-part="moves"[^>]*>(.*?)<\/p>/s.exec(body)?.[1];
      expect(moves).toBeDefined();
      expect(text(moves ?? '')).toMatch(/You: .+ · Advice: .+$/);
    }
    const grades = items.map((b) => [
      ...b.matchAll(/<span data-part="grade" data-grade="(\w+)"[^>]*>(.*?)<\/span>/g),
    ]);
    for (const g of grades) expect(g).toHaveLength(1);
    expect(grades.map((g) => [g[0]?.[1], g[0]?.[2]])).toEqual([
      ['correct', 'Correct'],
      ['correct', 'Correct'],
      ['minor', 'Minor error'],
      ['correct', 'Correct'],
    ]);

    const panelText = text(panel);
    for (const banned of ['TBD', '…', 'undefined', 'null', '[object']) {
      expect(panelText).not.toContain(banned);
    }

    const closed = render({ entries, open: false });
    expect(closed).not.toMatch(/<aside/);
    expect(closed).toMatch(/<div role="status"/);
    expect(closed).toMatch(new RegExp(`</section>${DEAL_NEXT.source}`));

    for (const none of [render(null), render()]) {
      expect(none).not.toMatch(/<aside/);
      expect(none).not.toMatch(/Deal next hand/);
      expect(none).toMatch(/<div role="status"/);
    }
  });
});
