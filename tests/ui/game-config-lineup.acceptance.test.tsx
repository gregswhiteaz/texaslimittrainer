import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LINE_UP_PRESETS } from '../../src/bots/lineup';
import {
  configForLineUp,
  DEFAULT_SESSION_CONFIG,
  type SessionConfig,
} from '../../src/table/session';
import { GameConfigScreen } from '../../src/ui/config/GameConfigScreen';

const render = (config: SessionConfig): string =>
  renderToString(
    <GameConfigScreen config={config} onStart={() => undefined} onCancel={() => undefined} />,
  ).replace(/<!-- -->/g, '');

const lineUpGroup = (html: string): string =>
  /<div[^>]*role="radiogroup"[^>]*aria-labelledby="config-lineup"[^>]*>[\s\S]*?<\/div>/.exec(
    html,
  )?.[0] ?? '';
const presetRadios = (html: string): string[] =>
  lineUpGroup(html).match(/<input[^>]*type="radio"[^>]*>/g) ?? [];
const valueOf = (input: string): string => /value="([^"]*)"/.exec(input)?.[1] ?? '';
const checkedPresets = (html: string): string[] =>
  presetRadios(html)
    .filter((r) => r.includes('checked=""'))
    .map(valueOf);
const seatRows = (html: string): string[][] =>
  [...html.matchAll(/<li>(.*?)<\/li>/g)].map(([, row = '']) =>
    [
      ...row.matchAll(/<span[^>]*>(.*?)<\/span>/g),
      ...row.matchAll(/<option[^>]*selected=""[^>]*>(.*?)<\/option>/g),
    ].map(([, cell = '']) => cell),
  );
const botRows = (html: string): string[][] => seatRows(html).filter((r) => r[0] !== 'You');

describe('Game Config line-up acceptance', () => {
  it('a fresh game config selects Mixed and lists TAG, Calling station, Maniac, Rock, TAG clockwise from the user', () => {
    const html = render(DEFAULT_SESSION_CONFIG);

    expect(/<[^>]*id="config-lineup"[^>]*>(.*?)<\//.exec(html)?.[1]).toBe('Line-up');
    const radios = presetRadios(html);
    expect(radios.every((r) => r.includes('name="line-up"'))).toBe(true);
    expect(radios.map(valueOf)).toEqual(['Mixed', 'Tough', 'Soft']);
    expect(
      [...lineUpGroup(html).matchAll(/<label>(.*?)<\/label>/g)].map(([, l = '']) =>
        l.replace(/<[^>]*>/g, ''),
      ),
    ).toEqual(['Mixed', 'Tough', 'Soft']);
    expect(checkedPresets(html)).toEqual(['Mixed']);
    expect(seatRows(html)).toEqual([
      ['Seat 6', 'Ava', 'Tight-aggressive'],
      ['Seat 1', 'Ben', 'Calling station'],
      ['Seat 2', 'Cal', 'Maniac'],
      ['Seat 3', 'Dee', 'Rock'],
      ['Seat 4', 'Eli', 'Tight-aggressive'],
      ['You', 'Seat 5'],
    ]);
  });

  it('tough at 9 players lists 8 rows with only the first bot clockwise a Maniac', () => {
    const html = render(configForLineUp(DEFAULT_SESSION_CONFIG, 9, 'Tough'));

    expect(checkedPresets(html)).toEqual(['Tough']);
    const rows = botRows(html);
    expect(rows).toHaveLength(8);
    expect(rows[0]).toEqual(['Seat 6', 'Ava', 'Maniac']);
    expect(rows.filter((r) => r[2] === 'Maniac')).toHaveLength(1);
    expect(rows.slice(1).every((r) => r[2] === 'Tight-aggressive')).toBe(true);
    expect(rows.map((r) => r[0])).toEqual([
      'Seat 6',
      'Seat 7',
      'Seat 8',
      'Seat 9',
      'Seat 1',
      'Seat 2',
      'Seat 3',
      'Seat 4',
    ]);
  });

  it('heads-up tough lists a single TAG bot', () => {
    const html = render(configForLineUp(DEFAULT_SESSION_CONFIG, 2, 'Tough'));

    expect(checkedPresets(html)).toEqual(['Tough']);
    expect(botRows(html)).toEqual([['Seat 1', 'Ava', 'Tight-aggressive']]);
    expect(seatRows(html).at(-1)).toEqual(['You', 'Seat 2']);
  });

  it('every preset at 10 players lists 9 rows with distinct names', () => {
    for (const preset of LINE_UP_PRESETS) {
      const config = configForLineUp(DEFAULT_SESSION_CONFIG, 10, preset);
      const html = render(config);

      expect(checkedPresets(html)).toEqual([preset]);
      const names = botRows(html).map((r) => r[1]);
      expect(names).toHaveLength(9);
      expect(new Set(names).size).toBe(9);
      const seated = config.seats.map((s) => s.name);
      expect(new Set(seated).size).toBe(10);
    }
  });
});
