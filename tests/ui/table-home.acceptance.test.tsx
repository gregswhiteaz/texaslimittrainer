import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SESSION_CONFIG, seatSession } from '../../src/table/session';
import { Table, TableView } from '../../src/ui/table/Table';
import { TableScreen } from '../../src/ui/table/TableScreen';
import { FLOP_BET } from '../support/table-scenarios';

const noop = (): void => undefined;
const HOME = '<button type="button" class="table-home">Home</button>';
const LEAVE = '<button type="button" class="table-leave">Leave table</button>';

const header = (html: string): string =>
  /<header class="table-header">(.*?)<\/header>/s.exec(html)?.[1] ?? '';

describe('Table header Home control (REQ-004.9)', () => {
  it('the table header offers Home before Leave table only when onHome is given', () => {
    for (const table of [seatSession(), FLOP_BET]) {
      const html = renderToString(
        <TableView table={table} onAct={noop} onLeave={noop} onHome={noop} />,
      );
      expect(header(html)).toMatch(
        new RegExp(
          `^<p class="table-header-line">[^<]*</p><div class="table-header-actions">${HOME}${LEAVE}</div>$`,
        ),
      );
      expect(header(html).match(/<button[\s>]/g)).toHaveLength(2);

      const without = renderToString(<TableView table={table} onAct={noop} onLeave={noop} />);
      expect(without).not.toContain('table-home');
      expect(header(without)).toContain(`<div class="table-header-actions">${LEAVE}</div>`);
      expect(header(without).match(/<button[\s>]/g)).toHaveLength(1);
      // Only the header differs: the Home button is the one extra button on the page.
      expect(html.match(/<button[\s>]/g)?.length).toBe(
        (without.match(/<button[\s>]/g)?.length ?? 0) + 1,
      );
    }

    expect(renderToString(<TableScreen config={DEFAULT_SESSION_CONFIG} onHome={noop} />)).toContain(
      `${HOME}${LEAVE}`,
    );

    const plain = renderToString(<Table />);
    expect(plain).not.toContain('table-home');
    expect(plain.match(/<button[\s>]/g)).toHaveLength(1);
  });
});
