import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { handResultView } from '../../src/table/hand-result';
import type { TableState } from '../../src/table/session';
import { TableView } from '../../src/ui/table/Table';
import { SIDE_POT_SHOWDOWN, SPLIT_SIDE_POT_SHOWDOWN } from '../support/table-scenarios';

const noop = (): void => undefined;

const render = (table: TableState): string =>
  renderToString(<TableView table={table} onAct={noop} onLeave={noop} />);

const text = (markup: string): string =>
  markup
    .replace(/<!-- -->/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&#x27;/g, "'");

/** Inner markup of each Pot winners item, in order. */
function potItems(html: string): string[] {
  const lists = [...html.matchAll(/<ul aria-label="Pot winners"[^>]*>(.*?)<\/ul>/gs)];
  expect(lists).toHaveLength(1);
  return [...(lists[0]?.[1] ?? '').matchAll(/<li data-pot="\d+"[^>]*>(.*?)<\/li>/gs)].map(
    (m) => m[1] ?? '',
  );
}

function part(body: string, name: string): string | null {
  const match = new RegExp(`<span data-part="${name}"[^>]*>(.*?)</span>`, 's').exec(body);
  return match === null ? null : text(match[1] ?? '');
}

describe('Split side pot acceptance', () => {
  it("a split side pot renders the view model's line text exactly", () => {
    const items = potItems(render(SPLIT_SIDE_POT_SHOWDOWN));
    expect(items.map(text)).toEqual([
      'Main pot $60 · You win $60',
      'Side pot $81 · Ben wins $41, Ava wins $40',
    ]);

    for (const table of [SPLIT_SIDE_POT_SHOWDOWN, SIDE_POT_SHOWDOWN]) {
      const pots = handResultView(table)?.pots ?? [];
      const rendered = potItems(render(table));
      expect(rendered).toHaveLength(pots.length);
      pots.forEach((pot, k) => {
        const body = rendered[k] ?? '';
        expect(text(body)).toBe(pot.text);
        expect(part(body, 'pot')).toBe(pot.potText);
        expect(part(body, 'pot-winners')).toBe(pot.winnersText);
      });
    }
  });
});
