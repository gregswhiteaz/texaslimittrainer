import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { formatCard } from '../../src/engine/cards';
import type { TableState } from '../../src/table/session';
import { TableView } from '../../src/ui/table/Table';
import {
  AVA_UNCONTESTED,
  KINGS_SHOWDOWN,
  SHOWDOWN,
  SPLIT_STRAIGHT,
} from '../support/table-scenarios';

const noop = (): void => undefined;

function render(table: TableState): string {
  return renderToString(<TableView table={table} onAct={noop} onLeave={noop} />);
}

const text = (markup: string): string => markup.replace(/<!-- -->/g, '').replace(/<[^>]*>/g, '');

/** Inner markup of the one `role="status"` block. */
function status(html: string): string {
  const blocks = [...html.matchAll(/<div role="status"[^>]*>(.*?)<\/ul><\/div>/gs)];
  expect(blocks).toHaveLength(1);
  return blocks[0]?.[1] ?? '';
}

interface WinnerLine {
  seat: string;
  body: string;
}

function winnerLines(block: string): WinnerLine[] {
  return [...block.matchAll(/<li data-seat="(\d+)"[^>]*>(.*?)<\/li>/gs)].map(
    ([, seat = '', body = '']) => ({ seat, body }),
  );
}

function part(body: string, name: string): string | null {
  const match = new RegExp(`<span data-part="${name}"[^>]*>(.*?)</span>`, 's').exec(body);
  return match === null ? null : text(match[1] ?? '');
}

const cardCodes = (markup: string): string[] =>
  [...markup.matchAll(/<svg[^>]*data-card="([^"]+)"/g)].map((m) => m[1] ?? '');

function cardsGroup(body: string, label: string): string[] {
  const group = new RegExp(`<div role="group" aria-label="${label}"[^>]*>(.*?)</div>`, 's').exec(
    body,
  );
  expect(group, label).not.toBeNull();
  return cardCodes(group?.[1] ?? '');
}

const potText = (html: string): string =>
  text(/<p class="table-pot">(.*?)<\/p>/s.exec(html)?.[1] ?? '');

function seatStack(html: string, seat: number): string {
  const seats = /<ul aria-label="Seats"[^>]*>(.*?)<\/ul>/s.exec(html)?.[1] ?? '';
  const item = new RegExp(`<li data-seat="${seat}"[^>]*>(.*?)</li>`, 's').exec(seats)?.[1] ?? '';
  return part(item, 'stack') ?? '';
}

describe('Hand result acceptance', () => {
  it('a showdown result shows Ben, $122 and Pair of kings', () => {
    const html = render(KINGS_SHOWDOWN);
    const block = status(html);
    expect(text(block)).toContain('Hand over');
    expect(block).toContain('<p class="hand-result-title">Hand over</p>');
    const lines = winnerLines(block);
    expect(lines.map((l) => l.seat)).toEqual(['2']);
    const ben = lines[0] as WinnerLine;
    expect(part(ben.body, 'winner')).toBe('Ben wins $122');
    expect(part(ben.body, 'hand-name')).toBe('Pair of kings');
    expect(text(ben.body)).toBe('Ben wins $122 · Pair of kings');
    expect(cardsGroup(ben.body, 'Ben&#x27;s cards')).toEqual(['Kd', '7c']);
    expect(cardCodes(block)).toEqual(['Kd', '7c']);
    expect(potText(html)).toBe('Pot $0');
    expect(seatStack(html, 2)).toBe('$222');

    const mine = winnerLines(status(render(SHOWDOWN)));
    expect(mine.map((l) => l.seat)).toEqual(['5']);
    const you = mine[0] as WinnerLine;
    expect(part(you.body, 'winner')).toBe('You win $54');
    expect(part(you.body, 'hand-name')).toBe('Pair of nines');
    expect(cardsGroup(you.body, 'Your shown cards')).toEqual(['Ah', '9s']);
  });

  it('an uncontested pot shows Ava and the amount with no hand name and none of her cards', () => {
    const html = render(AVA_UNCONTESTED);
    const block = status(html);
    expect(text(block)).toContain('Hand over');
    const lines = winnerLines(block);
    expect(lines.map((l) => l.seat)).toEqual(['1']);
    expect(part((lines[0] as WinnerLine).body, 'winner')).toBe('Ava wins $12');
    expect(block).not.toContain('data-part="hand-name"');
    expect(block).not.toContain(' · ');
    expect(block).not.toContain('<svg');
    expect(html).not.toContain('data-card="2c"');
    expect(html).not.toContain('data-card="3h"');
    // The user's 3c 4h and the flop.
    expect(cardCodes(html).filter((code) => code !== 'back')).toEqual([
      '5d',
      '5h',
      '5s',
      '3c',
      '4h',
    ]);
  });

  it('a split pot shows both winners with $30 each and Straight', () => {
    const html = render(SPLIT_STRAIGHT);
    const lines = winnerLines(status(html));
    expect(lines.map((l) => [l.seat, part(l.body, 'winner'), part(l.body, 'hand-name')])).toEqual([
      ['1', 'Ava wins $30', 'Straight'],
      ['2', 'Ben wins $30', 'Straight'],
    ]);
    expect(cardsGroup((lines[0] as WinnerLine).body, 'Ava&#x27;s cards')).toEqual(['Kc', 'Kd']);
    expect(cardsGroup((lines[1] as WinnerLine).body, 'Ben&#x27;s cards')).toEqual(['Qc', 'Qd']);
    const cal = SPLIT_STRAIGHT.hand?.players.find((p) => p.seat === 3);
    expect(cal?.folded).toBe(true);
    for (const card of cal?.holeCards ?? []) {
      expect(html).not.toContain(`data-card="${formatCard(card)}"`);
    }
  });
});
