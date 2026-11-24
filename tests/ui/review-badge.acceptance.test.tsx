import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { decisionRecord } from '../../src/table/hand-record';
import { reviewBadge, storedReviewEntries, type ReviewBadge } from '../../src/table/review';
import { completedHand, type CompletedHand, type TableState } from '../../src/table/session';
import { TableView, type ReviewState } from '../../src/ui/table/Table';
import {
  RAISE_TAKES_BLINDS,
  REVIEW_DECK,
  REVIEW_FOUR,
  userTableAfter,
} from '../support/table-scenarios';

const noop = (): void => undefined;

const FOUR_MOVES =
  '3:fold 4:fold 5:raise 6:fold 1:fold 2:call 2:check 5:bet 2:call 2:check 5:check 2:bet 5:call';
const RIVER_FOLD = userTableAfter(REVIEW_DECK, FOUR_MOVES.replace(/5:call$/, '5:fold'));

const text = (markup: string): string => markup.replace(/<!-- -->/g, '').replace(/<[^>]*>/g, '');

function graded(table: TableState): { badge: ReviewBadge; review: ReviewState } {
  const hand = completedHand(table) as CompletedHand;
  const entries = storedReviewEntries(hand, hand.userDecisions.map(decisionRecord));
  return { badge: reviewBadge(entries.map((e) => e.grade)), review: { entries, open: true } };
}

function render(
  table: TableState,
  props: { review?: ReviewState | null; reviewBadge?: ReviewBadge | null } = {},
): string {
  return renderToString(
    <TableView table={table} onAct={noop} onLeave={noop} onOpenReview={noop} {...props} />,
  );
}

interface BadgeButton {
  attrs: string;
  text: string;
}

function badgeButtons(html: string): BadgeButton[] {
  return [...html.matchAll(/<button([^>]*class="review-badge"[^>]*)>(.*?)<\/button>/gs)].map(
    ([, attrs = '', inner = '']) => ({ attrs, text: text(inner) }),
  );
}

const attr = (attrs: string, name: string): string | undefined =>
  new RegExp(`${name}="([^"]*)"`).exec(attrs)?.[1];

describe('TASK-9.7 review badge in TableView', () => {
  it('the badge button shows its summary after the result and never beside a held review', () => {
    const river = graded(RIVER_FOLD);
    const a = render(RIVER_FOLD, { review: null, reviewBadge: river.badge });
    const [button, ...others] = badgeButtons(a);
    expect(others).toHaveLength(0);
    expect(button).toBeDefined();
    expect(attr(button?.attrs ?? '', 'type')).toBe('button');
    expect(attr(button?.attrs ?? '', 'data-worst')).toBe('major');
    expect(attr(button?.attrs ?? '', 'aria-label')).toBe('Open hand review: 1 Major, 1 Minor');
    expect(button?.text).toBe('1 Major, 1 Minor');
    expect(a).not.toContain('<aside');
    expect(a).not.toContain('Deal next hand');

    const blinds = graded(RAISE_TAKES_BLINDS);
    const b = badgeButtons(render(RAISE_TAKES_BLINDS, { reviewBadge: blinds.badge }));
    expect(b).toHaveLength(1);
    expect(b[0]?.text).toBe('All correct');
    expect(attr(b[0]?.attrs ?? '', 'data-worst')).toBe('correct');
    expect(attr(b[0]?.attrs ?? '', 'aria-label')).toBe('Open hand review: All correct');

    const c = render(RIVER_FOLD, { review: river.review, reviewBadge: river.badge });
    expect(c).not.toContain('review-badge');
    expect(c).toContain('<aside');

    const midHand = userTableAfter(REVIEW_DECK, '3:fold 4:fold');
    expect(completedHand(midHand)).toBeNull();
    expect(midHand.hand?.toAct).toBe(5);
    expect(render(midHand, { reviewBadge: river.badge })).not.toContain('review-badge');

    for (const table of [RIVER_FOLD, RAISE_TAKES_BLINDS, midHand]) {
      const plain = renderToString(<TableView table={table} onAct={noop} onLeave={noop} />);
      expect(plain).not.toContain('review-badge');
      expect(render(table, { reviewBadge: null })).toBe(plain);
    }
  });

  it('the badge always states its grades in text', () => {
    const buttons = [RIVER_FOLD, RAISE_TAKES_BLINDS, REVIEW_FOUR].map((table) => {
      const [button] = badgeButtons(render(table, { reviewBadge: graded(table).badge }));
      if (button === undefined) throw new Error('No badge rendered');
      return button;
    });
    expect(buttons.map((b) => [b.text, attr(b.attrs, 'data-worst')])).toEqual([
      ['1 Major, 1 Minor', 'major'],
      ['All correct', 'correct'],
      ['1 Minor', 'minor'],
    ]);
    for (const { attrs, text: shown } of buttons) {
      expect(shown.length).toBeGreaterThan(0);
      expect(/Major|Minor/.test(shown) || shown === 'All correct').toBe(true);
      expect(attr(attrs, 'aria-label')?.endsWith(shown)).toBe(true);
    }

    const css = readFileSync(new URL('../../src/ui/styles.css', import.meta.url), 'utf8');
    const rule = (selector: string): string => {
      const at = css.indexOf(`${selector} {`);
      expect(at, selector).toBeGreaterThanOrEqual(0);
      return css.slice(at, css.indexOf('}', at));
    };
    expect(rule('.review-badge')).toContain('color: #ffffff');
    for (const [worst, colour] of [
      ['major', '#a3151c'],
      ['minor', '#9a5b00'],
      ['correct', '#2f6fe0'],
    ]) {
      expect(rule(`.review-badge[data-worst='${worst}']`)).toContain(`background: ${colour}`);
    }
  });
});
