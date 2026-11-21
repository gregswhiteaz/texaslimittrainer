import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { HandState } from '../../src/engine/hand';
import { playerView } from '../../src/engine/player-view';
import { handResultView } from '../../src/table/hand-result';
import type { TableState } from '../../src/table/session';
import { potTotal, tableView } from '../../src/table/table-view';
import { TableView } from '../../src/ui/table/Table';
import {
  AVA_UNCONTESTED,
  KINGS_SHOWDOWN,
  SIDE_POT_RIVER,
  SIDE_POT_SHOWDOWN,
  SPLIT_STRAIGHT,
  STORYBOARD_HISTORY,
} from '../support/table-scenarios';

const noop = (): void => undefined;

const render = (table: TableState): string =>
  renderToString(<TableView table={table} onAct={noop} onLeave={noop} />);

const text = (markup: string): string =>
  markup
    .replace(/<!-- -->/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&#x27;/g, "'");

/** Inner markup of the one list named `label`, or null. */
function list(html: string, label: string): string | null {
  const lists = [...html.matchAll(new RegExp(`<ul aria-label="${label}"[^>]*>(.*?)</ul>`, 'gs'))];
  expect(lists.length, label).toBeLessThanOrEqual(1);
  return lists[0]?.[1] ?? null;
}

interface PotItem {
  pot: string;
  body: string;
}

const items = (markup: string | null): PotItem[] =>
  [...(markup ?? '').matchAll(/<li data-pot="(\d+)"[^>]*>(.*?)<\/li>/gs)].map(
    ([, pot = '', body = '']) => ({ pot, body }),
  );

function part(body: string, name: string): string | null {
  const match = new RegExp(`<span data-part="${name}"[^>]*>(.*?)</span>`, 's').exec(body);
  return match === null ? null : text(match[1] ?? '');
}

/** Inner markup of the one `role="status"` block. */
function status(html: string): string {
  const blocks = [...html.matchAll(/<div role="status"[^>]*>(.*)<\/div>/gs)];
  expect(blocks).toHaveLength(1);
  return blocks[0]?.[1] ?? '';
}

const potParagraphs = (html: string): string[] =>
  [...html.matchAll(/<p class="table-pot">(.*?)<\/p>/gs)].map((m) => text(m[1] ?? ''));

describe('Side pots acceptance', () => {
  it('the table shows a $60 main pot and an $80 side pot separately after a $20/$60/$60 all-in', () => {
    const hand = SIDE_POT_RIVER.hand as HandState;
    expect(hand.street).toBe('river');
    expect(hand.players.map((p) => p.totalContribution)).toEqual([60, 60, 0, 0, 20, 0]);

    const html = render(SIDE_POT_RIVER);
    const pots = items(list(html, 'Pots'));
    expect(pots.map((p) => p.pot)).toEqual(['0', '1']);
    expect(pots.map((p) => text(p.body))).toEqual(['Main pot $60', 'Side pot $80']);
    expect(html).toContain('<ul aria-label="Pots" class="table-pots">');
    expect(potParagraphs(html)).toEqual([]);
    expect(tableView(SIDE_POT_RIVER).pot).toBe(140);
    expect(list(html, 'Pot winners')).toBeNull();
  });

  it("the result names each pot's winner and amount when the short stack wins the main pot", () => {
    const html = render(SIDE_POT_SHOWDOWN);
    const block = status(html);
    const potWinners = list(block, 'Pot winners');
    expect(items(potWinners).map((p) => text(p.body))).toEqual([
      'Main pot $60 · You win $60',
      'Side pot $80 · Ben wins $80',
    ]);
    const winnersAt = block.indexOf('<ul aria-label="Winners"');
    expect(block.indexOf('<ul aria-label="Pot winners"')).toBeGreaterThan(
      block.indexOf('Hand over'),
    );
    expect(block.indexOf('<ul aria-label="Pot winners"')).toBeLessThan(winnersAt);

    const winners = [
      ...(list(block, 'Winners') ?? '').matchAll(/<li data-seat="\d+"[^>]*>(.*?)<\/li>/gs),
    ].map((m) => text((m[1] ?? '').replace(/<div role="group".*?<\/div>/gs, '')));
    expect(winners).toEqual(['You win $60 · Pair of aces', 'Ben wins $80 · Pair of kings']);
    const shown = [
      ...(list(block, 'Shown hands') ?? '').matchAll(
        /<li data-shown-seat="\d+"[^>]*>(.*?)<\/li>/gs,
      ),
    ].map((m) => text((m[1] ?? '').replace(/<div role="group".*?<\/div>/gs, '')));
    expect(shown).toEqual(['Ava shows · Pair of queens']);

    expect(potParagraphs(html)).toEqual(['Pot $0']);
    expect(list(html, 'Pots')).toBeNull();
  });

  it('there is one result line per pot from result.awards', () => {
    const awards = (SIDE_POT_SHOWDOWN.hand as HandState).result?.awards ?? [];
    expect(awards).toHaveLength(2);
    const lines = items(list(status(render(SIDE_POT_SHOWDOWN)), 'Pot winners'));
    expect(lines).toHaveLength(awards.length);
    const labels = ['Main pot', 'Side pot'];
    awards.forEach((award, k) => {
      const line = lines[k] as PotItem;
      expect(line.pot).toBe(String(award.pot));
      expect(part(line.body, 'pot')).toBe(`${labels[k] ?? ''} $${award.amount}`);
    });
    expect(part(lines[0]?.body ?? '', 'pot-winners')).toBe('You win $60');
    expect(part(lines[1]?.body ?? '', 'pot-winners')).toBe('Ben wins $80');
  });

  it('a hand with no all-in shows a single pot total', () => {
    const tables = [...STORYBOARD_HISTORY, KINGS_SHOWDOWN, SPLIT_STRAIGHT, AVA_UNCONTESTED];
    for (const [i, table] of tables.entries()) {
      const html = render(table);
      const hand = table.hand as HandState;
      const total = potTotal(playerView(hand, table.config.userSeat));
      expect(potParagraphs(html), `state ${i}`).toEqual([`Pot $${total}`]);
      expect(html).not.toContain('aria-label="Pots"');
      expect(html).not.toContain('aria-label="Pot winners"');
      expect(tableView(table).pots, `state ${i}`).toEqual([]);
      expect(handResultView(table)?.pots ?? [], `state ${i}`).toEqual([]);
    }
  });
});
