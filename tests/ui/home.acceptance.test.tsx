import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import logoUrl from '../../src/assets/tlh-logo.jpg';
import { DEFAULT_SESSION_CONFIG } from '../../src/table/session';
import { GameConfigScreen } from '../../src/ui/config/GameConfigScreen';
import { HomeScreen } from '../../src/ui/home/HomeScreen';

/** Markup text with React's text separators removed. */
const text = (html: string): string => html.replace(/<!-- -->/g, '');

describe('Home and Game Config acceptance', () => {
  it('home shows the logo, the name and only New game', () => {
    const html = text(renderToString(<HomeScreen onNewGame={() => undefined} />));

    const images = html.match(/<img[^>]*>/g) ?? [];
    expect(images).toHaveLength(1);
    expect(images[0]).toContain(`src="${logoUrl}"`);
    expect(images[0]).toContain('alt=""');
    expect(html).toContain('<h1>TLH Trainer</h1>');
    expect(html.match(/<nav[^>]*>/g)).toEqual([expect.stringContaining('aria-label="Main menu"')]);
    const nav = /<nav[^>]*>(.*?)<\/nav>/s.exec(html)?.[1] ?? '';
    const buttons = nav.match(/<button[^>]*>.*?<\/button>/gs) ?? [];
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toContain('New game');
    expect(buttons[0]).toContain('Set up a cash game or sit-and-go');
    expect(html.match(/<button[\s>]/g)).toHaveLength(1);
    for (const absent of ['Resume session', 'Statistics', 'Settings', 'aria-label="Table"']) {
      expect(html).not.toContain(absent);
    }
  });

  it('game config shows the first-use cash session with five TAG bots', () => {
    const html = text(
      renderToString(
        <GameConfigScreen
          config={DEFAULT_SESSION_CONFIG}
          onStart={() => undefined}
          onCancel={() => undefined}
        />,
      ),
    );

    expect(html.match(/<h1[^>]*>.*?<\/h1>/g)).toEqual(['<h1>New game</h1>']);
    const fields = [...html.matchAll(/<dt>(.*?)<\/dt><dd>(.*?)<\/dd>/g)].map(
      ([, dt = '', dd = '']) => [
        dt.replace(/<[^>]*>/g, ''),
        dd.includes('<select')
          ? (/<option[^>]*selected=""[^>]*>(.*?)<\/option>/.exec(dd)?.[1] ?? '')
          : dd.includes('type="radio"')
            ? (/<label><input[^>]*checked=""[^>]*\/?>(.*?)<\/label>/.exec(dd)?.[1] ?? '').replace(
                /<[^>]*>/g,
                '',
              )
            : dd,
      ],
    );
    expect(fields).toEqual([
      ['Game type', 'Cash game'],
      ['Players at the table', '6 (6-max)'],
      ['Stakes (small bet / big bet)', '$4 / $8'],
      ['Buy-in', '$160 (20 big bets)'],
      ['Speed', 'Rapid'],
    ]);
    expect(html).toMatch(/<h2[^>]*>Session<\/h2>/);
    expect(html).toMatch(/<h2[^>]*>Opponents<\/h2>/);
    const rows = [...html.matchAll(/<li>(.*?)<\/li>/g)].map(([, row = '']) =>
      [...row.matchAll(/<span[^>]*>(.*?)<\/span>/g)].map(([, cell]) => cell),
    );
    expect(rows).toEqual([
      ['Seat 1', 'Ava', 'Tight-aggressive'],
      ['Seat 2', 'Ben', 'Tight-aggressive'],
      ['Seat 3', 'Cal', 'Tight-aggressive'],
      ['Seat 4', 'Dee', 'Tight-aggressive'],
      ['Seat 6', 'Eli', 'Tight-aggressive'],
      ['You', 'Seat 5'],
    ]);
    const buttons = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map(([, label]) => label);
    expect(buttons).toEqual(['← Home', 'Cancel', 'Start game']);
    expect(html.match(/<(input|select|textarea)[\s>]/g)).toEqual([
      '<input ',
      '<input ',
      '<select ',
    ]);
    expect(html).not.toContain('aria-label="Table"');
  });
});
