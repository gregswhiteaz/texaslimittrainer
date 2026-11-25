import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { TableState } from '../../src/table/session';
import { DEFAULT_SETTINGS, type Settings } from '../../src/table/settings';
import { SettingsScreen } from '../../src/ui/settings/SettingsScreen';
import { TableView } from '../../src/ui/table/Table';
import { FLOP_BET } from '../support/table-scenarios';

// TASK-12.2 (SPEC-01, SPEC-03, SPEC-04): the Settings toggle and the style labels it hides at the table.

const noop = (): void => undefined;
const occurrences = (text: string, part: string): number => text.split(part).length - 1;
const text = (markup: string): string => markup.replace(/<!-- -->/g, '');

function renderTable(table: TableState, showOpponentStyles?: boolean): string {
  return renderToString(
    showOpponentStyles === undefined ? (
      <TableView table={table} onAct={noop} onLeave={noop} />
    ) : (
      <TableView
        table={table}
        onAct={noop}
        onLeave={noop}
        showOpponentStyles={showOpponentStyles}
      />
    ),
  );
}

interface SeatMarkup {
  seat: string;
  user: boolean;
  body: string;
}

function seatItems(html: string): SeatMarkup[] {
  const list = /<ul aria-label="Seats"[^>]*>(.*?)<\/ul>/s.exec(html)?.[1] ?? '';
  return [...list.matchAll(/<li([^>]*)>(.*?)<\/li>/gs)].map(([, attrs = '', body = '']) => ({
    seat: /data-seat="(\d+)"/.exec(attrs)?.[1] ?? '',
    user: attrs.includes('data-user'),
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

const BOT_STYLES: Record<string, string> = {
  Ben: 'Calling station',
  Cal: 'Maniac',
  Dee: 'Rock',
  Ava: 'TAG',
  Eli: 'TAG',
};

describe('Show opponent styles at the table', () => {
  it('the Settings toggle is on for default settings and off when saved off', () => {
    const DISPLAY = '<h2 id="settings-display">Display</h2>';
    const LABEL = 'Show opponent styles at the table</label>';
    const render = (settings?: Settings): string =>
      renderToString(
        <SettingsScreen
          onHome={noop}
          version="1.2.0"
          settings={settings}
          onSettingsChange={settings && noop}
        />,
      );

    const on = render(DEFAULT_SETTINGS);
    const toggleOn = '<label class="settings-toggle"><input type="checkbox" checked=""/>' + LABEL;
    expect(occurrences(on, toggleOn)).toBe(1);
    expect(occurrences(on, '<input')).toBe(1);
    expect(on.indexOf(toggleOn)).toBeGreaterThan(on.indexOf(DISPLAY));
    expect(on.indexOf(toggleOn)).toBeLessThan(on.indexOf('<h2 id="settings-data">'));

    const off = render({ ...DEFAULT_SETTINGS, showOpponentStyles: false });
    expect(
      occurrences(off, '<label class="settings-toggle"><input type="checkbox"/>' + LABEL),
    ).toBe(1);

    const loading = render(undefined);
    expect(
      occurrences(
        loading,
        '<label class="settings-toggle"><input type="checkbox" disabled="" checked=""/>' + LABEL,
      ),
    ).toBe(1);
  });

  it('off hides every style label and its separator and keeps name and stack', () => {
    const on = renderTable(FLOP_BET, true);
    const html = renderTable(FLOP_BET, false);
    expect(html).not.toContain('data-part="style"');

    const ben = seatItem(html, 2);
    expect(part(ben.body, 'name')).toBe('Ben');
    expect(part(ben.body, 'stack')).toBe('$146');
    expect(ben.body).toContain(
      '<span class="seat-line"><span data-part="stack">$146</span></span>',
    );
    expect(part(ben.body, 'street')).toBe('This street $4');
    expect(part(ben.body, 'action')).toBe('Bet $4');
    expect(occurrences(ben.body, '<svg')).toBe(occurrences(seatItem(on, 2).body, '<svg'));

    const bots = seatItems(html).filter((s) => !s.user);
    expect(bots).toHaveLength(5);
    for (const bot of bots) {
      expect(text(bot.body)).not.toContain(' · ');
      const shown = seatItem(on, Number(bot.seat)).body;
      for (const name of ['name', 'stack', 'street', 'action', 'to-act']) {
        expect(part(bot.body, name)).toBe(part(shown, name));
      }
    }

    const userOn = seatItems(on).find((s) => s.user);
    const userOff = seatItems(html).find((s) => s.user);
    expect(userOff).toBeDefined();
    expect(userOff).toEqual(userOn);
  });

  it('on and by default every bot seat shows its style label', () => {
    const on = renderTable(FLOP_BET, true);
    expect(renderTable(FLOP_BET)).toBe(on);

    const bots = seatItems(on).filter((s) => !s.user);
    expect(bots).toHaveLength(5);
    for (const bot of bots) {
      const name = part(bot.body, 'name') ?? '';
      expect(occurrences(bot.body, 'data-part="style"')).toBe(1);
      expect(part(bot.body, 'style')).toBe(BOT_STYLES[name]);
      expect(text(bot.body)).toContain(
        `<span data-part="style">${BOT_STYLES[name]}</span> · <span data-part="stack">$`,
      );
    }
  });
});
