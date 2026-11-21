import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { parseCards } from '../../src/engine/cards';
import { handResultView } from '../../src/table/hand-result';
import type { TableState } from '../../src/table/session';
import { TableView } from '../../src/ui/table/Table';
import { AVA_UNCONTESTED, KINGS_SHOWDOWN, SHOWN_HANDS } from '../support/table-scenarios';

const noop = (): void => undefined;

const render = (table: TableState): string =>
  renderToString(<TableView table={table} onAct={noop} onLeave={noop} />);

const text = (markup: string): string => markup.replace(/<!-- -->/g, '').replace(/<[^>]*>/g, '');

const cardCodes = (markup: string): string[] =>
  [...markup.matchAll(/<svg[^>]*data-card="([^"]+)"/g)].map((m) => m[1] ?? '');

function cardsGroup(body: string, label: string): string[] {
  const group = new RegExp(`<div role="group" aria-label="${label}"[^>]*>(.*?)</div>`, 's').exec(
    body,
  );
  expect(group, label).not.toBeNull();
  return cardCodes(group?.[1] ?? '');
}

/** Inner markup of the one `role="status"` block. */
function status(html: string): string {
  const blocks = [...html.matchAll(/<div role="status"[^>]*>(.*?)<\/ul><\/div>/gs)];
  expect(blocks).toHaveLength(1);
  return blocks[0]?.[1] ?? '';
}

describe('Hand result shown hands acceptance', () => {
  it('shown losing hands follow the winners in showdown order and mucked hands never appear', () => {
    expect(handResultView(SHOWN_HANDS)).toEqual({
      endedBy: 'showdown',
      winners: [
        {
          seat: 2,
          name: 'Ben',
          isUser: false,
          amount: 16,
          text: 'Ben wins $16',
          handName: 'Pair of kings',
          holeCards: parseCards('Kh Ks'),
        },
      ],
      shown: [
        {
          seat: 4,
          name: 'Dee',
          isUser: false,
          text: 'Dee shows',
          handName: 'Pair of fours',
          holeCards: parseCards('4h 4s'),
        },
        {
          seat: 5,
          name: 'You',
          isUser: true,
          text: 'You show',
          handName: 'Pair of eights',
          holeCards: parseCards('8h 8s'),
        },
      ],
    });

    const html = render(SHOWN_HANDS);
    const block = status(html);
    const winners = /<ul aria-label="Winners"[^>]*>(.*?)<\/ul>/s.exec(block);
    const shownList = /<ul aria-label="Shown hands"[^>]*>(.*)$/s.exec(block);
    expect(winners).not.toBeNull();
    expect(shownList).not.toBeNull();
    expect(winners?.index ?? 0).toBeLessThan(shownList?.index ?? -1);

    const winnerLines = [
      ...(winners?.[1] ?? '').matchAll(/<li data-seat="(\d+)"[^>]*>(.*?)<\/li>/gs),
    ];
    expect(winnerLines.map((l) => l[1])).toEqual(['2']);
    expect(text(winnerLines[0]?.[2] ?? '')).toBe('Ben wins $16 · Pair of kings');
    expect(cardsGroup(winnerLines[0]?.[2] ?? '', 'Ben&#x27;s cards')).toEqual(['Kh', 'Ks']);

    const shownLines = [
      ...(shownList?.[1] ?? '').matchAll(/<li data-shown-seat="(\d+)"[^>]*>(.*?)<\/li>/gs),
    ];
    expect(shownLines.map((l) => l[1])).toEqual(['4', '5']);
    expect(text(shownLines[0]?.[2] ?? '')).toBe('Dee shows · Pair of fours');
    expect(cardsGroup(shownLines[0]?.[2] ?? '', 'Dee&#x27;s cards')).toEqual(['4h', '4s']);
    expect(text(shownLines[1]?.[2] ?? '')).toBe('You show · Pair of eights');
    expect(cardsGroup(shownLines[1]?.[2] ?? '', 'Your shown cards')).toEqual(['8h', '8s']);

    expect(cardCodes(html)).not.toContain('5h');
    expect(cardCodes(html)).not.toContain('5s');

    for (const table of [KINGS_SHOWDOWN, AVA_UNCONTESTED]) {
      expect(handResultView(table)?.shown).toEqual([]);
      expect(render(table)).not.toContain('Shown hands');
    }
  });
});
