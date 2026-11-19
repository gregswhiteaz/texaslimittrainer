import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TableScreen } from '../../src/ui/table/TableScreen';
import { DEFAULT_SESSION_CONFIG } from '../../src/table/session';
import { Table } from '../../src/ui/table/Table';

interface SeatMarkup {
  seat: string;
  name: string;
  stack: string;
  user: boolean;
}

function seats(html: string): SeatMarkup[] {
  const list = /<ul aria-label="Seats"[^>]*>(.*?)<\/ul>/s.exec(html)?.[1] ?? '';
  return [...list.matchAll(/<li([^>]*)>(.*?)<\/li>/gs)].map(([, attrs = '', body = '']) => ({
    seat: /data-seat="(\d+)"/.exec(attrs)?.[1] ?? '',
    name: /<span data-part="name">([^<]*)<\/span>/.exec(body)?.[1] ?? '',
    stack: /<span data-part="stack">(.*?)<\/span>/.exec(body)?.[1]?.replace(/<!-- -->/g, '') ?? '',
    user: /\sdata-user(=|\s|$)/.test(attrs),
  }));
}

function expectSeatedTable(html: string, stack: string): void {
  const rows = seats(html);
  expect(rows.map((r) => r.name)).toEqual(['Ava', 'Ben', 'Cal', 'Dee', 'Eli', 'You']);
  expect(rows.map((r) => r.seat)).toEqual(['1', '2', '3', '4', '6', '5']);
  expect(rows.map((r) => r.stack)).toEqual(Array(6).fill(stack));
  expect(rows.map((r) => r.user)).toEqual([false, false, false, false, false, true]);
  expect(html).toMatch(/<section aria-label="Table"/);
  expect(html.match(/<button[\s>]/g)).toHaveLength(1);
  expect(
    html.replace(/<button type="button" class="table-leave">Leave table<\/button>/, ''),
  ).not.toMatch(/<(input|select|textarea|a|button)[\s>]/);
  expect(html).not.toMatch(/data-card=/);
}

describe('Table acceptance', () => {
  it('seated table shows names and buy-in stacks and no buy-in control', () => {
    expectSeatedTable(renderToString(<Table />), '$160');
    expectSeatedTable(
      renderToString(<Table config={{ stake: { smallBet: 10, bigBet: 20 } }} />),
      '$400',
    );
    const app = renderToString(<TableScreen config={DEFAULT_SESSION_CONFIG} />);
    expect(app).toContain('<h1>TLH Trainer</h1>');
    expectSeatedTable(app, '$160');
  });
});
