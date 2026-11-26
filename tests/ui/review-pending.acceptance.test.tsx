import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TableView, type ReviewState } from '../../src/ui/table/Table';
import { REVIEW_FOUR } from '../support/table-scenarios';

// TASK-9.10 AC#2 (TASK-9.3 A-2): while a finished hand's grades are pending, no panel shows but Deal next hand does.

const noop = (): void => undefined;

const render = (review: ReviewState): string =>
  renderToString(<TableView table={REVIEW_FOUR} onAct={noop} onLeave={noop} review={review} />);

const DEAL_NEXT = /<button type="button" class="deal-next"[^>]*>Deal next hand<\/button>/g;

describe('TASK-9.10 pending grades', () => {
  it('a finished hand whose grades are pending shows Deal next hand and no review panel', () => {
    for (const open of [true, false]) {
      const html = render({ entries: null, open });
      expect(html).toMatch(/Hand over/);
      expect(html).not.toMatch(/<aside/);
      expect(html.match(DEAL_NEXT)).toHaveLength(1);
    }
  });
});
