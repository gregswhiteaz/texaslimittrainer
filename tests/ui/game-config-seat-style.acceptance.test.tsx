import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LINE_UP_PRESETS } from '../../src/bots/lineup';
import {
  botsClockwise,
  configForLineUp,
  DEFAULT_SESSION_CONFIG,
  type SessionConfig,
} from '../../src/table/session';
import { GameConfigScreen } from '../../src/ui/config/GameConfigScreen';

const render = (config: SessionConfig): string =>
  renderToString(
    <GameConfigScreen config={config} onStart={() => undefined} onCancel={() => undefined} />,
  ).replace(/<!-- -->/g, '');

const botRowHtml = (html: string): string[] =>
  [...html.matchAll(/<li>(.*?)<\/li>/g)]
    .map(([, row = '']) => row)
    .filter((row) => !row.startsWith('<span class="seat-label">You<'));
const cell = (row: string, pattern: RegExp): string => pattern.exec(row)?.[1] ?? '';
const selectsOf = (row: string): string[] => row.match(/<select[\s\S]*?<\/select>/g) ?? [];
const optionsOf = (select: string): string[] => select.match(/<option[^>]*>.*?<\/option>/g) ?? [];
const selectedText = (row: string): string[] =>
  [...row.matchAll(/<option[^>]*selected=""[^>]*>(.*?)<\/option>/g)].map(([, t = '']) => t);

describe('Game Config per-seat style acceptance (TASK-2.8)', () => {
  it('every bot row offers exactly TAG, Calling station, Maniac and Rock with its own style selected', () => {
    for (const players of [2, 6, 10]) {
      for (const preset of LINE_UP_PRESETS) {
        const config = configForLineUp(DEFAULT_SESSION_CONFIG, players, preset);
        const html = render(config);
        const bots = botsClockwise(config);
        const rows = botRowHtml(html);

        expect(rows).toHaveLength(players - 1);
        rows.forEach((row, i) => {
          const bot = bots[i];
          const name = cell(row, /<span class="seat-name">(.*?)<\/span>/);
          expect(name).toBe(bot?.name);
          const selects = selectsOf(row);
          expect(selects).toHaveLength(1);
          const select = selects[0] ?? '';
          expect(select).toMatch(new RegExp(`^<select aria-label="Style for ${name}"`));
          expect(select).not.toMatch(/ id="/);
          const options = optionsOf(select);
          expect(options.map((o) => cell(o, /value="([^"]*)"/))).toEqual([
            'TAG',
            'Calling station',
            'Maniac',
            'Rock',
          ]);
          expect(options.map((o) => cell(o, />(.*?)<\/option>/))).toEqual([
            'Tight-aggressive',
            'Calling station',
            'Maniac',
            'Rock',
          ]);
          expect(row).not.toMatch(/Random/);
          const selected = options.filter((o) => o.includes('selected=""'));
          expect(selected.map((o) => cell(o, /value="([^"]*)"/))).toEqual([bot?.style]);
          expect(cell(row, /<label class="config-style">(.*?)<select/)).toBe('Style');
        });
      }
    }
  });

  it('bot rows show the calling station, maniac and rock labels as the selected option', () => {
    const soft = botRowHtml(render(configForLineUp(DEFAULT_SESSION_CONFIG, 6, 'Soft')));
    expect(soft.map((row) => selectedText(row))).toEqual([
      ['Calling station'],
      ['Rock'],
      ['Calling station'],
      ['Rock'],
      ['Calling station'],
    ]);

    const tough = botRowHtml(render(configForLineUp(DEFAULT_SESSION_CONFIG, 6, 'Tough')));
    expect(selectedText(tough[0] ?? '')).toEqual(['Maniac']);
  });
});
