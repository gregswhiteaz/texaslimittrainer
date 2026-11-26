import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { formatCard, parseCard, type Card } from '../../src/engine/cards';
import type { HandState, SeatNumber } from '../../src/engine/hand';
import { decisionRecord, handRecord } from '../../src/table/hand-record';
import { reviewSummary, shownOpponents, storedReviewEntries } from '../../src/table/review';
import { completedHand, type CompletedHand, type TableState } from '../../src/table/session';
import { cardLabel } from '../../src/ui/cards/card-art';
import { ReviewPanel, type ReviewPanelProps } from '../../src/ui/table/ReviewPanel';
import { TableView, type ReviewState } from '../../src/ui/table/Table';
import {
  RAISE_TAKES_BLINDS,
  REVIEW_DEE_MUCKS,
  REVIEW_LOST_48,
  SHOWN_HANDS,
  TEN_SEAT_SHOWDOWN,
} from '../support/table-scenarios';

vi.setConfig({ testTimeout: 30_000 });

const noop = (): void => undefined;
const SUIT_GLYPHS = '♣♦♥♠';

function done(table: TableState): CompletedHand {
  const hand = completedHand(table);
  if (hand === null) throw new Error('Hand not complete');
  return hand;
}

function openReview(table: TableState): ReviewState {
  const hand = done(table);
  return { entries: storedReviewEntries(hand, hand.userDecisions.map(decisionRecord)), open: true };
}

function render(table: TableState): string {
  return renderToString(
    <TableView table={table} onAct={noop} onLeave={noop} review={openReview(table)} />,
  );
}

/** The panel's props as TableView builds them. */
function panelProps(table: TableState): ReviewPanelProps {
  const hand = done(table);
  return {
    handNumber: table.handNumber,
    entries: storedReviewEntries(hand, hand.userDecisions.map(decisionRecord)),
    summary: reviewSummary(hand, table.handNumber),
    shown: shownOpponents(hand),
  };
}

const text = (markup: string): string => markup.replace(/<!-- -->/g, '').replace(/<[^>]*>/g, '');

function panelOf(html: string): string {
  const panels = [...html.matchAll(/<aside[^>]*>(.*?)<\/aside>/gs)];
  expect(panels).toHaveLength(1);
  return panels[0]?.[1] ?? '';
}

const dataCards = (markup: string): string[] =>
  [...markup.matchAll(/data-card="(\w+)"/g)].map((m) => m[1] ?? '');

/** Every aria-label, title and alt attribute value and every <title> element's text. */
function labels(markup: string): string[] {
  return [
    ...[...markup.matchAll(/\s(?:aria-label|title|alt)="([^"]*)"/g)].map((m) => m[1] ?? ''),
    ...[...markup.matchAll(/<title[^>]*>(.*?)<\/title>/gs)].map((m) => text(m[1] ?? '')),
  ].map((value) => value.replace(/&#x27;/g, "'"));
}

/** The forms a card could be written in: its name, its glyph form and its code as a whole word. */
function cardForms(card: Card): { name: string; glyphs: string[]; code: RegExp } {
  const code = formatCard(card);
  const suit = SUIT_GLYPHS['cdhs'.indexOf(code[1] ?? '')] ?? '';
  const rank = code[0] ?? '';
  return {
    name: cardLabel(card),
    glyphs: rank === 'T' ? [`T${suit}`, `10${suit}`] : [`${rank}${suit}`],
    code: new RegExp(`\\b${code}\\b`),
  };
}

/** No trace of any of `cards` in the panel's text, labels, image titles or data-card values. */
function expectHidden(panel: string, cards: readonly Card[]): void {
  const values = [text(panel), ...labels(panel)];
  const drawn = dataCards(panel);
  for (const card of cards) {
    const { name, glyphs, code } = cardForms(card);
    expect(drawn).not.toContain(formatCard(card));
    for (const value of values) {
      expect(value).not.toContain(name);
      for (const glyph of glyphs) expect(value).not.toContain(glyph);
      expect(value).not.toMatch(code);
    }
  }
}

const cards = (codes: string): Card[] => codes.split(' ').map(parseCard);

/** The hole cards the engine dealt to `seat` (test-side only). */
function dealtTo(table: TableState, seat: SeatNumber): Card[] {
  const player = (table.hand as HandState).players.find((p) => p.seat === seat);
  if (player === undefined) throw new Error(`Seat ${seat} not dealt in`);
  return [...player.holeCards];
}

function recordOf(table: TableState) {
  return handRecord(done(table), {
    sessionId: '0123456789abcdef0123456789abcdef',
    handNumber: table.handNumber,
    config: table.config,
    completedAt: new Date('2026-11-24T09:00:00Z'),
  });
}

/** The `Shown at showdown` list, with each row's seat, text and shown-cards group. */
function shownRows(
  panel: string,
): { seat: string; text: string; group: string; cards: string[] }[] {
  const lists = [...panel.matchAll(/<ul aria-label="Shown at showdown"[^>]*>(.*?)<\/ul>/gs)];
  expect(lists).toHaveLength(1);
  return [...(lists[0]?.[1] ?? '').matchAll(/<li data-review-shown="(\d+)">(.*?)<\/li>/gs)].map(
    ([, seat = '', inner = '']) => {
      const group = /<span role="group" aria-label="([^"]*)"[^>]*>(.*?)<\/span>/s.exec(inner);
      return {
        seat,
        text: text(inner),
        group: group?.[1] ?? '',
        cards: dataCards(group?.[2] ?? ''),
      };
    },
  );
}

describe('TASK-9.5 shown hands in the review', () => {
  it("Ben's shown K♦ 7♣ appear in the review", () => {
    for (const table of [REVIEW_DEE_MUCKS, REVIEW_LOST_48]) {
      const panel = panelOf(render(table));
      expect(panel.match(/<ul aria-label="Shown at showdown"/g)).toHaveLength(1);
      expect(panel).toMatch(/<\/button><\/div><ul aria-label="Shown at showdown"/);
      expect(panel.indexOf('<ul aria-label="Shown at showdown"')).toBeLessThan(
        panel.indexOf('<ol aria-label="Decisions"'),
      );
      const rows = shownRows(panel);
      expect(rows).toEqual([
        {
          seat: '2',
          text: 'Ben showed · Pair of kings',
          group: 'Ben&#x27;s shown cards',
          cards: ['Kd', '7c'],
        },
      ]);
      const group =
        /aria-label="Ben&#x27;s shown cards"[^>]*>(.*?)<\/span>/s.exec(panel)?.[1] ?? '';
      expect(
        [...group.matchAll(/<svg[^>]*aria-label="([^"]*)"[^>]*data-card/g)].map((m) => m[1]),
      ).toEqual(['King of diamonds', 'Seven of clubs']);
    }
  });

  it("Dee's mucked hand appears nowhere in the panel", () => {
    const hand = done(REVIEW_DEE_MUCKS);
    expect(hand.shown?.shown.map((s) => s.seat)).toEqual([2]);
    expect(hand.result.awards).toEqual([
      { pot: 0, amount: 50, winners: [{ seat: 2, amount: 50 }] },
    ]);
    expect(dealtTo(REVIEW_DEE_MUCKS, 4).map(formatCard)).toEqual(['5c', '5d']);

    const panel = panelOf(render(REVIEW_DEE_MUCKS));
    expectHidden(panel, cards('5c 5d'));
    expect(text(panel)).not.toContain('Pair of fives');
    const allowed = ['Ah', '9s', 'Ks', '9d', '4c', '2h', '6s', 'Kd', '7c'];
    for (const card of dataCards(panel)) expect(allowed).toContain(card);
    expect(dataCards(panel)).toEqual(expect.arrayContaining(allowed));

    for (const [seat, codes] of [
      [1, '2c 3c'],
      [3, '2d 3d'],
      [6, '2s 3h'],
    ] as const) {
      expect(dealtTo(REVIEW_DEE_MUCKS, seat).map(formatCard).join(' ')).toBe(codes);
      expectHidden(panel, cards(codes));
    }
  });

  it('a hand every opponent folded shows no opponent cards', () => {
    expect(done(RAISE_TAKES_BLINDS).shown).toBeNull();
    const panel = panelOf(render(RAISE_TAKES_BLINDS));
    expect(panel).not.toContain('aria-label="Shown at showdown"');
    expect(dataCards(panel)).toEqual(['Ah', '9s']);
    for (const [seat, codes] of [
      [1, '2c 3d'],
      [2, 'Kd 7c'],
      [3, '2d 3h'],
      [4, '2s 3s'],
      [6, '3c 4d'],
    ] as const) {
      expect(dealtTo(RAISE_TAKES_BLINDS, seat).map(formatCard).join(' ')).toBe(codes);
      expectHidden(panel, cards(codes));
    }
  });

  it("the panel's data holds no hole cards but the shown ones", () => {
    for (const table of [REVIEW_DEE_MUCKS, RAISE_TAKES_BLINDS, SHOWN_HANDS, TEN_SEAT_SHOWDOWN]) {
      const hand = done(table);
      const record = recordOf(table);
      const shownSeats = new Set((record.shown?.shown ?? []).map((s) => s.seat));
      const allowed = new Set(
        [
          ...hand.userHoleCards,
          ...record.board,
          ...(record.shown?.shown ?? []).flatMap((s) => s.holeCards),
        ].map(formatCard),
      );
      const props = panelProps(table);

      const keys: string[] = [];
      const cardValues: string[] = [];
      const walk = (value: unknown, underCards: boolean): void => {
        if (Array.isArray(value)) {
          for (const item of value) walk(item, underCards);
        } else if (typeof value === 'object' && value !== null) {
          for (const [key, inner] of Object.entries(value)) {
            keys.push(key);
            walk(inner, underCards || key === 'holeCards' || key === 'board');
          }
        } else if (underCards) {
          cardValues.push(formatCard(value as Card));
        }
      };
      walk({ summary: props.summary, shown: props.shown, entries: props.entries }, false);
      for (const banned of ['deck', 'players', 'burned']) expect(keys).not.toContain(banned);
      expect(cardValues.length).toBeGreaterThan(0);
      for (const card of cardValues) expect(allowed).toContain(card);

      const panel = renderToString(<ReviewPanel {...props} />);
      for (const seat of hand.seats.map((s) => s.seat)) {
        if (seat === hand.userSeat || shownSeats.has(seat)) continue;
        expectHidden(panel, dealtTo(table, seat));
      }
    }
  });

  it('the review reads the stored shown hands and never deals from the replay code', () => {
    const hand = done(REVIEW_DEE_MUCKS);
    const record = recordOf(REVIEW_DEE_MUCKS);
    expect(record.replayCode).toBe('9e3779b9000000010000000200000003');
    expect(
      shownOpponents(hand).map((o) => ({ seat: o.seat, holeCards: [...o.holeCards] })),
    ).toEqual(
      (record.shown?.shown ?? [])
        .filter((s) => s.seat !== hand.userSeat)
        .map((s) => ({ seat: s.seat, holeCards: [...s.holeCards] })),
    );

    const props = panelProps(REVIEW_DEE_MUCKS);
    const variant: CompletedHand = {
      ...hand,
      shown: { shown: [{ seat: 4, holeCards: [parseCard('Qh'), parseCard('Qs')] }] },
    };
    const swapped = renderToString(<ReviewPanel {...props} shown={shownOpponents(variant)} />);
    const rows = shownRows(swapped);
    expect(rows.map(({ seat, cards: drawn }) => ({ seat, drawn }))).toEqual([
      { seat: '4', drawn: ['Qh', 'Qs'] },
    ]);
    const list = /<ul aria-label="Shown at showdown"[^>]*>(.*?)<\/ul>/s.exec(swapped)?.[1] ?? '';
    expectHidden(list, cards('5c 5d Kd 7c'));

    const none = renderToString(
      <ReviewPanel {...props} shown={shownOpponents({ ...hand, shown: null })} />,
    );
    expect(none).not.toContain('Shown at showdown');
    for (const seat of [1, 2, 3, 4, 6]) expectHidden(none, dealtTo(REVIEW_DEE_MUCKS, seat));

    for (const path of [
      '../../src/table/review.ts',
      '../../src/ui/table/ReviewPanel.tsx',
      '../../src/ui/table/Table.tsx',
    ]) {
      const source = readFileSync(new URL(path, import.meta.url), 'utf8');
      for (const banned of ['shuffledDeck', 'createHand', 'dealHand']) {
        expect(source).not.toContain(banned);
      }
    }
  });
});
