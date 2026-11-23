import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  configForPlayers,
  DEFAULT_SESSION_CONFIG,
  TABLE_SIZES,
  type SessionConfig,
} from '../../src/table/session';
import { GameConfigScreen } from '../../src/ui/config/GameConfigScreen';
import { BOT_NAMES } from '../../src/bots/lineup';

const SIX_MAX_NOTE = 'Advice will be approximate (based on 6-max).';
const FULL_RING_NOTE = 'Advice will be approximate (based on full ring).';
const MIXED_LABELS = ['Tight-aggressive', 'Calling station', 'Maniac', 'Rock'];

const render = (config: SessionConfig): string =>
  renderToString(
    <GameConfigScreen config={config} onStart={() => undefined} onCancel={() => undefined} />,
  ).replace(/<!-- -->/g, '');

const playersDd = (html: string): string =>
  /<dt><label for="config-players">Players at the table<\/label><\/dt><dd>(.*?)<\/dd>/.exec(
    html,
  )?.[1] ?? '';
const playersSelect = (html: string): string =>
  /<select id="config-players"[^>]*>.*?<\/select>/.exec(html)?.[0] ?? '';
const optionValues = (select: string): string[] =>
  [...select.matchAll(/<option value="([^"]*)"/g)].map(([, v = '']) => v);
const optionTexts = (select: string): string[] =>
  [...select.matchAll(/<option[^>]*>(.*?)<\/option>/g)].map(([, t = '']) => t);
const selectedTexts = (select: string): string[] =>
  [...select.matchAll(/<option[^>]*selected=""[^>]*>(.*?)<\/option>/g)].map(([, t = '']) => t);
const dts = (html: string): string[] =>
  [...html.matchAll(/<dt>(.*?)<\/dt>/g)].map(([, dt = '']) => dt.replace(/<[^>]*>/g, ''));
const seatRows = (html: string): string[][] =>
  [...html.matchAll(/<li>(.*?)<\/li>/g)].map(([, row = '']) =>
    [...row.matchAll(/<span[^>]*>(.*?)<\/span>/g)].map(([, cell = '']) => cell),
  );
const noteOf = (html: string): string[] =>
  [...html.matchAll(/<p id="config-players-note"[^>]*>(.*?)<\/p>/g)].map(([, t = '']) => t);

describe('Game Config players acceptance', () => {
  it('players options are exactly 2 to 10 with heads-up, 6-max and full ring labels and 6 selected', () => {
    const html = render(DEFAULT_SESSION_CONFIG);

    expect(dts(html)).toEqual([
      'Game type',
      'Players at the table',
      'Stakes (small bet / big bet)',
      'Buy-in',
      'Speed',
    ]);
    expect(html).toContain('<label for="config-players">Players at the table</label>');
    const dd = playersDd(html);
    expect(dd).toMatch(/^<select id="config-players"/);
    const select = playersSelect(dd);
    expect(optionValues(select)).toEqual(['2', '3', '4', '5', '6', '7', '8', '9', '10']);
    expect(optionTexts(select)).toEqual([
      '2 (heads-up)',
      '3',
      '4',
      '5',
      '6 (6-max)',
      '7',
      '8',
      '9',
      '10 (full ring)',
    ]);
    expect(selectedTexts(select)).toEqual(['6 (6-max)']);
    expect(dd.replace(select, '')).toBe('');
    expect(TABLE_SIZES).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(Object.isFrozen(TABLE_SIZES)).toBe(true);
    for (const name of ['heads-up', '6-max', 'full ring']) {
      expect(optionTexts(select).some((t) => t.includes(`(${name})`))).toBe(true);
    }
  });

  it('3, 4, 5 and 7 players say advice is approximate based on 6-max', () => {
    for (const n of [3, 4, 5, 7]) {
      const html = render(configForPlayers(DEFAULT_SESSION_CONFIG, n));
      const dd = playersDd(html);

      expect(selectedTexts(playersSelect(dd))).toEqual([String(n)]);
      expect(noteOf(dd)).toEqual([SIX_MAX_NOTE]);
      expect(noteOf(html)).toHaveLength(1);
      expect(playersSelect(dd)).toMatch(/^<select[^>]*aria-describedby="config-players-note"/);
    }
  });

  it('8 players says advice is approximate based on full ring', () => {
    const html = render(configForPlayers(DEFAULT_SESSION_CONFIG, 8));
    const dd = playersDd(html);

    expect(selectedTexts(playersSelect(dd))).toEqual(['8']);
    expect(noteOf(dd)).toEqual([FULL_RING_NOTE]);
    expect(noteOf(html)).toHaveLength(1);
    expect(playersSelect(dd)).toMatch(/^<select[^>]*aria-describedby="config-players-note"/);
  });

  it('2, 6, 9 and 10 players show no approximate note and list size minus 1 opponents', () => {
    const exact = [2, 6, 9, 10].map((n) => configForPlayers(DEFAULT_SESSION_CONFIG, n));
    for (const config of [...exact, DEFAULT_SESSION_CONFIG]) {
      const html = render(config);
      expect(html).not.toContain('config-players-note');
      expect(html).not.toContain('aria-describedby');
      expect(html).not.toMatch(/approximate/i);
    }

    for (const n of TABLE_SIZES) {
      const html = render(configForPlayers(DEFAULT_SESSION_CONFIG, n));
      const userSeat = Math.min(5, n);
      const botSeats = Array.from({ length: n - 1 }, (_, i) => ((userSeat + i) % n) + 1);
      expect(seatRows(html)).toEqual([
        ...botSeats.map((seat, i) => [`Seat ${seat}`, BOT_NAMES[i], MIXED_LABELS[i % 4]]),
        ['You', `Seat ${userSeat}`],
      ]);
    }
  });
});
