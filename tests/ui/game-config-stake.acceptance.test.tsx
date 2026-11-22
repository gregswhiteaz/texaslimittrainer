import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CASH_STAKES, DEFAULT_SESSION_CONFIG, type Stake } from '../../src/table/session';
import { GameConfigScreen } from '../../src/ui/config/GameConfigScreen';

const OPTIONS = ['$2 / $4', '$3 / $6', '$4 / $8', '$6 / $12', '$10 / $20', '$20 / $40'];
const BUY_INS = [80, 120, 160, 240, 400, 800].map((n) => `$${n} (20 big bets)`);
const REAL_MONEY =
  /deposit|payment|\bpay\b|purchase|buy chips|cash[- ]?out|withdraw|real[- ]?money|convert|currency|credit card/i;

const render = (stake: Stake): string =>
  renderToString(
    <GameConfigScreen
      config={{ ...DEFAULT_SESSION_CONFIG, stake }}
      onStart={() => undefined}
      onCancel={() => undefined}
    />,
  ).replace(/<!-- -->/g, '');

const selects = (html: string): string[] => html.match(/<select[\s\S]*?<\/select>/g) ?? [];
const optionTexts = (select: string): string[] =>
  [...select.matchAll(/<option[^>]*>(.*?)<\/option>/g)].map(([, t = '']) => t);
const selectedTexts = (select: string): string[] =>
  [...select.matchAll(/<option[^>]*selected=""[^>]*>(.*?)<\/option>/g)].map(([, t = '']) => t);
const buyInValue = (html: string): string | undefined =>
  /<dt>Buy-in<\/dt><dd>(.*?)<\/dd>/.exec(html)?.[1];

describe('Game Config stake acceptance', () => {
  it('game config offers exactly six stakes with $4 / $8 selected', () => {
    const html = render(DEFAULT_SESSION_CONFIG.stake);

    const all = selects(html);
    expect(all.map((s) => /id="([^"]*)"/.exec(s)?.[1])).toEqual(['config-players', 'config-stake']);
    const select = all.find((s) => s.includes('id="config-stake"')) ?? '';
    expect(select).toMatch(/^<select id="config-stake"/);
    expect(html).toContain('<label for="config-stake">Stakes (small bet / big bet)</label>');
    expect(optionTexts(select)).toEqual(OPTIONS);
    expect(selectedTexts(select)).toEqual(['$4 / $8']);
    expect(buyInValue(html)).toBe('$160 (20 big bets)');
  });

  it('buy-in reads 20 big bets of the chosen stake and offers no control', () => {
    const html = render({ smallBet: 3, bigBet: 6 });
    expect(buyInValue(html)).toBe('$120 (20 big bets)');
    expect(buyInValue(html)).not.toMatch(/<input|<select|<textarea|<button|contenteditable/);
    expect(selects(html).map((s) => [/id="([^"]*)"/.exec(s)?.[1], selectedTexts(s)])).toEqual([
      ['config-players', ['6 (6-max)']],
      ['config-stake', ['$3 / $6']],
    ]);

    CASH_STAKES.forEach((stake, i) => {
      const each = render(stake);
      expect(buyInValue(each)).toBe(BUY_INS[i]);
      expect(
        selectedTexts(selects(each).find((s) => s.includes('id="config-stake"')) ?? ''),
      ).toEqual([OPTIONS[i]]);
    });
  });

  it('no stake or buy-in text or control offers deposit, payment or real money', () => {
    for (const stake of CASH_STAKES) {
      const html = render(stake);

      expect(html.replace(/<[^>]*>/g, ' ')).not.toMatch(REAL_MONEY);
      const controls = html.match(/<(button|select|input|textarea|a)[\s>][\s\S]*?<\/\1>/g) ?? [];
      for (const control of controls) expect(control).not.toMatch(REAL_MONEY);
      const buttons = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map(([, t]) => t);
      expect(buttons).toEqual(['← Home', 'Cancel', 'Start game']);
      expect(selects(html)).toHaveLength(2);
      expect(html).not.toMatch(/<(a|form)[\s>]/);
      expect((html.match(/<input[^>]*>/g) ?? []).map((i) => /type="radio"/.test(i))).toEqual([
        true,
        true,
      ]);
    }
  });
});
