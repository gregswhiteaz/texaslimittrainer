import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import logoUrl from '../../src/assets/tlh-logo.jpg';
import type { Action, HandState } from '../../src/engine/hand';
import {
  applyUserAction,
  dealHand,
  nextStep,
  seatSession,
  stepBot,
  userActions,
  type TableState,
} from '../../src/table/session';
import { tableView } from '../../src/table/table-view';
import { CardBack } from '../../src/ui/cards/PlayingCard';
import { TableView } from '../../src/ui/table/Table';
import {
  FLOP_BET,
  PREFLOP,
  RIVER,
  SCENARIO_CODE,
  SEAT_1_DEALT,
  SHOWDOWN,
  STORYBOARD_HISTORY,
  TURN_BET,
} from '../support/table-scenarios';

const noop = (): void => undefined;

function render(table: TableState): string {
  return renderToString(<TableView table={table} onAct={noop} onLeave={noop} />);
}

const text = (markup: string): string => markup.replace(/<!-- -->/g, '');

interface SeatMarkup {
  seat: string;
  attrs: string;
  body: string;
}

function seatItems(html: string): SeatMarkup[] {
  const list = /<ul aria-label="Seats"[^>]*>(.*?)<\/ul>/s.exec(html)?.[1] ?? '';
  return [...list.matchAll(/<li([^>]*)>(.*?)<\/li>/gs)].map(([, attrs = '', body = '']) => ({
    seat: /data-seat="(\d+)"/.exec(attrs)?.[1] ?? '',
    attrs,
    body,
  }));
}

function seatItem(html: string, seat: number): SeatMarkup {
  const item = seatItems(html).find((s) => s.seat === String(seat));
  if (item === undefined) throw new Error(`No seat ${seat} in ${html}`);
  return item;
}

/** Text of `<span data-part="name">`, or null when absent. */
function part(body: string, name: string): string | null {
  const match = new RegExp(`<span data-part="${name}"[^>]*>(.*?)</span>`, 's').exec(body);
  return match === null ? null : text(match[1] ?? '');
}

function svgTags(markup: string): string[] {
  return markup.match(/<svg[^>]*>/g) ?? [];
}

const backs = (markup: string): string[] =>
  svgTags(markup).filter((tag) => tag.includes('data-card="back"'));

function boardGroup(html: string): string {
  const board = /<div role="group" aria-label="Board"[^>]*>(.*?)<\/div><p class="table-pot">/s.exec(
    html,
  )?.[1];
  if (board === undefined) throw new Error(`No Board group in ${html}`);
  return board;
}

function boardCards(html: string): string[] {
  return svgTags(boardGroup(html)).map((tag) => /data-card="([^"]+)"/.exec(tag)?.[1] ?? '');
}

function potText(html: string): string {
  return text(/<p class="table-pot">(.*?)<\/p>/s.exec(html)?.[1] ?? '');
}

function checkOrCall(table: TableState): Action {
  const actions = userActions(table);
  const action = actions.find((a) => a.type === 'check') ?? actions.find((a) => a.type === 'call');
  if (action === undefined) throw new Error('No check or call');
  return action;
}

describe('Table display acceptance', () => {
  it('a calling station that bet $4 on the flop shows name, style, stack, street amount, Bet $4 and a card back', () => {
    const ben = seatItem(render(FLOP_BET), 2);
    expect(part(ben.body, 'name')).toBe('Ben');
    expect(part(ben.body, 'style')).toBe('Calling station');
    expect(part(ben.body, 'stack')).toBe('$146');
    expect(part(ben.body, 'street')).toBe('This street $4');
    expect(part(ben.body, 'action')).toBe('Bet $4');
    const [back, ...others] = backs(ben.body);
    expect(others).toHaveLength(0);
    expect(back).toContain('width="30"');
    expect(back).toContain('height="42"');
  });

  it('a folded bot shows Folded and no card back', () => {
    const flop = render(FLOP_BET);
    for (const seat of [1, 3, 4]) {
      const item = seatItem(flop, seat);
      expect(part(item.body, 'action'), `seat ${seat}`).toBe('Folded');
      expect(backs(item.body), `seat ${seat}`).toHaveLength(0);
    }
    const preflop = render(PREFLOP);
    for (const seat of [3, 4]) {
      const item = seatItem(preflop, seat);
      expect(part(item.body, 'action'), `seat ${seat}`).toBe('Folded');
      expect(backs(item.body), `seat ${seat}`).toHaveLength(0);
    }
    expect(part(seatItem(preflop, 1).body, 'action')).toBe('Small blind $2');
    expect(part(seatItem(preflop, 1).body, 'stack')).toBe('$212');
    expect(part(seatItem(preflop, 2).body, 'action')).toBe('Big blind $4');
    expect(part(seatItem(preflop, 2).body, 'stack')).toBe('$154');
    expect(part(seatItem(flop, 6).body, 'action')).toBe('Waiting');
    expect(part(seatItem(flop, 6).body, 'stack')).toBe('$221');
  });

  it('the user seat shows both cards face up, stack and position name at seat 5 and seat 1', () => {
    for (const [table, seat, position, stack] of [
      [FLOP_BET, '5', 'Cutoff', '$184'],
      [SEAT_1_DEALT, '1', 'Small blind', '$158'],
    ] as const) {
      const items = seatItems(render(table));
      const user = items.at(-1) as SeatMarkup;
      expect(user.seat).toBe(seat);
      expect(user.attrs).toMatch(/\sdata-user=""/);
      expect(items.filter((s) => /\sdata-user/.test(s.attrs))).toHaveLength(1);
      const cards = /<div role="group" aria-label="Your cards"[^>]*>(.*?)<\/div>/s.exec(
        user.body,
      )?.[1];
      const codes = svgTags(cards ?? '').map((tag) => /data-card="([^"]+)"/.exec(tag)?.[1]);
      expect(codes).toHaveLength(2);
      expect(codes).not.toContain('back');
      expect(backs(user.body)).toHaveLength(0);
      expect(part(user.body, 'position')).toBe(position);
      expect(part(user.body, 'stack')).toBe(stack);
    }
    const flopUser = seatItem(render(FLOP_BET), 5).body;
    expect(svgTags(flopUser).map((tag) => /data-card="([^"]+)"/.exec(tag)?.[1])).toEqual([
      'Ah',
      '9s',
    ]);
    expect(part(flopUser, 'name')).toBe('You');
  });

  it('the board shows dealt cards and a placeholder for each undealt card', () => {
    const expected = [
      [PREFLOP, []],
      [FLOP_BET, ['Ks', '9d', '4c']],
      [TURN_BET, ['Ks', '9d', '4c', '2h']],
      [RIVER, ['Ks', '9d', '4c', '2h', '7c']],
    ] as const;
    for (const [table, cards] of expected) {
      const board = boardGroup(render(table));
      expect(boardCards(render(table))).toEqual(cards);
      const slots = board.match(/<span class="board-slot" aria-hidden="true"><\/span>/g) ?? [];
      expect(slots).toHaveLength(5 - cards.length);
    }
  });

  it("the pot equals collected chips plus this street's bets and the dealer marker sits at the button", () => {
    expect([PREFLOP, FLOP_BET, TURN_BET, RIVER].map((t) => potText(render(t)))).toEqual([
      'Pot $14',
      'Pot $30',
      'Pot $46',
      'Pot $54',
    ]);
    const dealerSeats = (html: string): string[] =>
      seatItems(html)
        .filter((s) => s.body.includes('data-part="dealer"'))
        .map((s) => s.seat);
    for (const table of STORYBOARD_HISTORY) {
      const hand = table.hand as HandState;
      const pot =
        hand.pots.reduce((sum, p) => sum + p.amount, 0) +
        hand.players.reduce((sum, p) => sum + p.streetContribution, 0);
      const html = render(table);
      expect(potText(html)).toBe(`Pot $${pot}`);
      expect(html.match(/data-part="dealer"/g)).toHaveLength(1);
      expect(dealerSeats(html)).toEqual(['6']);
    }
    expect(dealerSeats(render(SEAT_1_DEALT))).toEqual(['6']);
    const button3 = dealHand(seatSession({ button: 3 }), SCENARIO_CODE);
    expect(dealerSeats(render(button3))).toEqual(['3']);
    expect(render(button3).match(/data-part="dealer"/g)).toHaveLength(1);
  });

  it('exactly the seat to act is highlighted and labelled To act', () => {
    expect(STORYBOARD_HISTORY.at(-1)).toBe(SHOWDOWN);
    for (const table of STORYBOARD_HISTORY) {
      const hand = table.hand as HandState;
      const html = render(table);
      const items = seatItems(html);
      const highlighted = items.filter((s) => /class="[^"]*\bseat-to-act\b/.test(s.attrs));
      const labelled = items.filter((s) =>
        s.body.includes('<span data-part="to-act">To act</span>'),
      );
      if (hand.toAct === null) {
        expect(highlighted).toHaveLength(0);
        expect(labelled).toHaveLength(0);
      } else {
        expect(highlighted.map((s) => s.seat)).toEqual([String(hand.toAct)]);
        expect(labelled.map((s) => s.seat)).toEqual([String(hand.toAct)]);
      }
      expect(html).not.toContain('data-to-act');
    }
    const end = seatItems(render(SHOWDOWN));
    expect(end.some((s) => part(s.body, 'action') === 'Waiting')).toBe(false);
  });

  it('the header reads Cash, 6 players, $4/$8 and Hand #133 and offers Leave table', () => {
    const html = render(FLOP_BET);
    const header = /<header class="table-header">(.*?)<\/header>/s.exec(html)?.[1] ?? '';
    expect(/<p class="table-header-line">(.*?)<\/p>/.exec(header)?.[1]).toBe(
      'Cash · 6 players · $4/$8 · Hand #133',
    );
    expect(header).toContain('<button type="button" class="table-leave">Leave table</button>');
    expect(tableView(seatSession()).header).toBe('Cash · 6 players · $4/$8 · Hand #1');
  });

  it('the replay code appears nowhere on the table during the hand', () => {
    const code = SCENARIO_CODE;
    expect(code).toContain('9e3779b9');
    let table = dealHand(seatSession(), code);
    const streets = new Set<string>();
    const forbidden = [code, code.toUpperCase(), '9e3779b9', '9E3779B9'];
    for (;;) {
      const html = render(table);
      const model = JSON.stringify(tableView(table));
      for (const value of forbidden) {
        expect(html).not.toContain(value);
        expect(model).not.toContain(value);
      }
      streets.add((table.hand as HandState).street);
      const step = nextStep(table);
      if (step === 'done') break;
      table = step === 'bot' ? stepBot(table) : applyUserAction(table, checkOrCall(table));
    }
    for (const street of ['preflop', 'flop', 'turn', 'river']) expect(streets).toContain(street);
    for (const scripted of STORYBOARD_HISTORY) {
      for (const value of forbidden) expect(render(scripted)).not.toContain(value);
    }
  });

  it("a bot seat's card back marker is a smaller card back with the logo", () => {
    const small = renderToStaticMarkup(<CardBack size="small" />);
    const root = /^<svg[^>]*>/.exec(small)?.[0] ?? '';
    for (const attr of [
      'width="30"',
      'height="42"',
      'viewBox="0 0 60 84"',
      'role="img"',
      'aria-label="Face-down card"',
      'data-card="back"',
    ]) {
      expect(root).toContain(attr);
    }
    const image = /<image[^>]*>/.exec(small)?.[0] ?? '';
    expect(image).toContain('data-part="logo"');
    expect(image).toContain(`href="${logoUrl}"`);
    const standard = /^<svg[^>]*>/.exec(renderToStaticMarkup(<CardBack />))?.[0] ?? '';
    expect(standard).toContain('width="60"');
    expect(standard).toContain('height="84"');
  });
});
