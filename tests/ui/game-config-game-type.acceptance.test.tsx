import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  configForGameType,
  DEFAULT_SESSION_CONFIG,
  type SessionConfig,
} from '../../src/table/session';
import { GameConfigScreen } from '../../src/ui/config/GameConfigScreen';

const REAL_MONEY =
  /deposit|payment|\bpay\b|purchase|buy chips|cash[- ]?out|withdraw|real[- ]?money|convert|currency|credit card/i;
const SIT_AND_GO = configForGameType(
  DEFAULT_SESSION_CONFIG,
  'sit-and-go',
  DEFAULT_SESSION_CONFIG.stake,
);

const render = (config: SessionConfig): string =>
  renderToString(
    <GameConfigScreen config={config} onStart={() => undefined} onCancel={() => undefined} />,
  ).replace(/<!-- -->/g, '');

const strip = (html: string): string => html.replace(/<[^>]*>/g, '');
const rows = (html: string): string[] =>
  [...html.matchAll(/<dt>(.*?)<\/dt>/g)].map(([, dt = '']) => strip(dt));
const radios = (html: string): string[] => html.match(/<input[^>]*type="radio"[^>]*>/g) ?? [];
const checkedValues = (html: string): string[] =>
  radios(html)
    .filter((r) => r.includes('name="game-type"') && r.includes('checked=""'))
    .map((r) => /value="([^"]*)"/.exec(r)?.[1] ?? '');

describe('Game Config game type acceptance', () => {
  it('game type offers exactly Cash game and Sit-and-go with Cash game checked', () => {
    const html = render(DEFAULT_SESSION_CONFIG);

    const groups =
      html.match(
        /<div[^>]*role="radiogroup"[^>]*aria-labelledby="config-game-type"[^>]*>[\s\S]*?<\/div>/g,
      ) ?? [];
    expect(groups).toHaveLength(1);
    const group = groups[0] ?? '';
    expect(group).toMatch(/^<div[^>]*aria-labelledby="config-game-type"/);
    expect(/<[^>]*id="config-game-type"[^>]*>(.*?)<\//.exec(html)?.[1]).toBe('Game type');

    const inputs = radios(group);
    expect(inputs).toHaveLength(2);
    expect(inputs.every((i) => i.includes('name="game-type"'))).toBe(true);
    expect(inputs.map((i) => /value="([^"]*)"/.exec(i)?.[1])).toEqual(['cash', 'sit-and-go']);
    expect(
      [...group.matchAll(/<label>(.*?)<\/label>/g)].map(([, label = '']) => strip(label)),
    ).toEqual(['Cash game', 'Sit-and-go']);
    expect(checkedValues(html)).toEqual(['cash']);
    expect(rows(html)).toEqual([
      'Game type',
      'Players at the table',
      'Stakes (small bet / big bet)',
      'Buy-in',
      'Speed',
    ]);
  });

  it('a sit-and-go config shows no stake selector or buy-in', () => {
    const html = render(SIT_AND_GO);

    expect(checkedValues(html)).toEqual(['sit-and-go']);
    expect(html.match(/<select id="[^"]*"/g)).toEqual(['<select id="config-players"']);
    expect(html).not.toContain('config-stake');
    expect(html).not.toContain('Stakes (small bet / big bet)');
    expect(html).not.toContain('Buy-in');
    expect(rows(html)).toEqual(['Game type', 'Players at the table', 'Speed']);
    const buttons = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map(([, t]) => t);
    expect(buttons).toEqual(['← Home', 'Randomise line-up', 'Cancel', 'Start game']);
  });

  it('game type choice offers no real-money text or other inputs', () => {
    for (const config of [DEFAULT_SESSION_CONFIG, SIT_AND_GO]) {
      const html = render(config);

      expect(strip(html)).not.toMatch(REAL_MONEY);
      const inputs = html.match(/<input[^>]*>/g) ?? [];
      expect(inputs.map((i) => /type="radio"/.test(i))).toEqual([true, true, true, true, true]);
      expect(html).not.toMatch(/<(a|form|textarea)[\s>]/);
    }
  });
});
