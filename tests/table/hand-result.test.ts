import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseCards } from '../../src/engine/cards';
import { replayCodeFromWords } from '../../src/engine/deck';
import type { HandResult, HandState } from '../../src/engine/hand';
import { HAND_CATEGORIES, evaluate, handCategory } from '../../src/engine/hand-evaluator';
import { handName, handResultView } from '../../src/table/hand-result';
import { dealHand, nextStep, seatSession, stepBot, type TableState } from '../../src/table/session';
import { KINGS_SHOWDOWN, SCENARIO_CODE } from '../support/table-scenarios';

const named = (hole: string, board: string): string => handName(parseCards(`${hole} ${board}`));

/** KINGS_SHOWDOWN with its result replaced by `awards` (a crafted completed hand). */
function withAwards(awards: HandResult['awards']): TableState {
  const hand = KINGS_SHOWDOWN.hand as HandState;
  const result = hand.result as HandResult;
  return { ...KINGS_SHOWDOWN, hand: { ...hand, result: { ...result, awards } } };
}

describe('hand result', () => {
  it('handName names every category with its ranks', () => {
    const examples: [string, string, string][] = [
      ['Kd 7c', 'Ks 9d 4c 2h 6s', 'Pair of kings'],
      ['3h 8h', 'Jd 6h 9h 3c 8s', 'Two pair, eights and threes'],
      ['Kc Kd', '5c 6d 7h 8s 9c', 'Straight'],
      ['Ah 9s', 'Ks 9d 4c 2h 7c', 'Pair of nines'],
      ['Ah Kd', 'Qs 9d 4c 2h 7c', 'Ace high'],
      ['Kh Kd', 'Qs Qd 4c 4h 7c', 'Two pair, kings and queens'],
      ['7h 7d', '7s 9d 9c 9h 2c', 'Full house, nines over sevens'],
      ['Ah 2d', '3s 4d 5c 9h Kc', 'Straight'],
      ['Ad Kd', 'Qd Jd Td 2c 3h', 'Straight flush'],
      ['7h 7d', '7s 7c 9d 2h 3c', 'Four of a kind, sevens'],
      ['7h 7d', '7s 9d 2c 4h Kc', 'Three of a kind, sevens'],
      ['Ah 2h', '5h 9h Kh 3c 4d', 'Flush'],
      ['5s 4s', '3s 2s As 9d Kc', 'Straight flush'],
      ['Ts 9h', '8c 7d 6s', 'Straight'],
      ['2c 2d', '5h 5s 5c Ah', 'Full house, fives over twos'],
      ['Qc Qd', 'Qh 3s 3c 3d', 'Full house, queens over threes'],
    ];
    for (const [hole, board, name] of examples) expect(named(hole, board), hole).toBe(name);

    const categories = new Set(
      examples
        .filter(([hole, board]) => parseCards(`${hole} ${board}`).length === 7)
        .map(([hole, board]) => handCategory(evaluate(parseCards(`${hole} ${board}`)))),
    );
    expect([...categories].sort()).toEqual([...HAND_CATEGORIES].sort());

    expect(() => handName(parseCards('Ah Kd Qs 9d'))).toThrow(RangeError);
    expect(() => handName(parseCards('Ah Ah Qs 9d 2c'))).toThrow(RangeError);
  });

  it("the result model lists winners in award order and exposes only winners' cards", () => {
    const seated = seatSession();
    const dealt = dealHand(seated, replayCodeFromWords([7, 1, 2, 3]));
    expect(nextStep(dealt)).toBe('bot');
    for (const table of [seated, dealt, stepBot(dealt)]) expect(handResultView(table)).toBeNull();

    const kings = handResultView(KINGS_SHOWDOWN);
    expect(kings).toEqual({
      endedBy: 'showdown',
      winners: [
        {
          seat: 2,
          name: 'Ben',
          isUser: false,
          amount: 122,
          text: 'Ben wins $122',
          handName: 'Pair of kings',
          holeCards: parseCards('Kd 7c'),
        },
      ],
    });
    const json = JSON.stringify(kings);
    const holeCards = [...json.matchAll(/"holeCards":(\[[^\]]*\]|null)/g)].map((m) => m[1]);
    expect(holeCards).toEqual([JSON.stringify(parseCards('Kd 7c'))]);
    for (const card of parseCards('Ah 9s')) expect(json).not.toContain(`${card}`);
    expect(json.toLowerCase()).not.toContain(SCENARIO_CODE);
    expect(json).not.toContain('9e3779b9');

    const split = handResultView(
      withAwards([
        {
          pot: 0,
          amount: 61,
          winners: [
            { seat: 2, amount: 31 },
            { seat: 4, amount: 30 },
          ],
        },
      ]),
    );
    expect(split?.winners.map((w) => [w.seat, w.amount, w.text])).toEqual([
      [2, 31, 'Ben wins $31'],
      [4, 30, 'Dee wins $30'],
    ]);

    const twice = handResultView(
      withAwards([
        { pot: 0, amount: 100, winners: [{ seat: 2, amount: 100 }] },
        { pot: 1, amount: 22, winners: [{ seat: 2, amount: 22 }] },
      ]),
    );
    expect(twice?.winners.map((w) => [w.seat, w.amount])).toEqual([[2, 122]]);

    const user = handResultView(
      withAwards([{ pot: 0, amount: 122, winners: [{ seat: 5, amount: 122 }] }]),
    );
    expect(user?.winners[0]?.isUser).toBe(true);
    expect(user?.winners[0]?.text).toMatch(/^You win \$/);
    expect(user?.winners[0]?.text).toBe('You win $122');

    const source = readFileSync(new URL('../../src/table/hand-result.ts', import.meta.url), 'utf8');
    const imports = [...source.matchAll(/from '([^']+)'/g)].map((m) => m[1]);
    expect(imports.length).toBeGreaterThan(0);
    for (const path of imports) {
      expect(path).not.toMatch(/^react(-dom)?(\/|$)/);
      expect(path).not.toMatch(/\/ui\//);
    }
  });
});
