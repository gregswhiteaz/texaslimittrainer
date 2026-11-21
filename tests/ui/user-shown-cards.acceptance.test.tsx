import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { formatCard } from '../../src/engine/cards';
import { createHand } from '../../src/engine/hand';
import { seatSession, type SessionSeat, type TableState } from '../../src/table/session';
import { TableView } from '../../src/ui/table/Table';
import { fixedDeck, play } from '../support/table-scenarios';

const noop = (): void => undefined;

const text = (markup: string): string => markup.replace(/<!-- -->/g, '').replace(/<[^>]*>/g, '');

const cardCodes = (markup: string): string[] =>
  [...markup.matchAll(/<svg[^>]*data-card="([^"]+)"/g)].map((m) => m[1] ?? '');

// User at seat 3 (Ac Ad); seat 5 (Kh Kd) loses to the user's aces and mucks, so 1, 2, 3 are shown.
const seats = ['Ava', 'Ben', 'You', 'Dee', 'Cal', 'Eli'].map((name, i): SessionSeat =>
  i === 2
    ? { seat: 3, name, kind: 'user', style: null }
    : { seat: i + 1, name, kind: 'bot', style: 'TAG' },
);
const start = seatSession({ seats, userSeat: 3, button: 6 });
const deck = fixedDeck({
  0: '7c',
  6: '2d',
  2: 'Ac',
  8: 'Ad',
  4: 'Kh',
  10: 'Kd',
  13: 'Qs',
  14: '9h',
  15: '4c',
  17: '3h',
  19: '8s',
});
const hand = createHand({ stakes: start.stakes, seats: start.stacks, button: 6, deck });
const played = play(
  hand,
  '3:call 4:fold 5:call 6:fold 1:call 2:check' + ' 1:check 2:check 3:check 5:check'.repeat(3),
);
const table: TableState = { ...start, hand: played };

describe('User shown cards acceptance', () => {
  it('a user at seat 3 sees their own cards as Your shown cards', () => {
    expect(played.result?.showdown.map((s) => s.seat)).toEqual([1, 2, 3]);
    const html = renderToString(<TableView table={table} onAct={noop} onLeave={noop} />);
    const blocks = [...html.matchAll(/<div role="status"[^>]*>(.*?)<\/ul><\/div>/gs)];
    expect(blocks).toHaveLength(1);
    const lines = [...(blocks[0]?.[1] ?? '').matchAll(/<li data-seat="(\d+)"[^>]*>(.*?)<\/li>/gs)];
    expect(lines.map((l) => l[1])).toEqual(['3']);
    const body = lines[0]?.[2] ?? '';
    const group = /<div role="group" aria-label="Your shown cards"[^>]*>(.*?)<\/div>/s.exec(body);
    expect(group).not.toBeNull();
    const own = played.players.find((p) => p.seat === 3)?.holeCards.map(formatCard);
    expect(own).toEqual(['Ac', 'Ad']);
    expect(cardCodes(group?.[1] ?? '')).toEqual(own);
    expect(text(body)).toBe('You win $16 · Pair of aces');
  });
});
