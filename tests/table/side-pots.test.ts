import { describe, expect, it } from 'vitest';
import type { HandResult, HandState } from '../../src/engine/hand';
import { handResultView } from '../../src/table/hand-result';
import type { TableState } from '../../src/table/session';
import { potLabel, potLines, tableView } from '../../src/table/table-view';
import {
  SIDE_POT_DECK,
  SIDE_POT_MOVES,
  SIDE_POT_RIVER,
  SIDE_POT_SHOWDOWN,
  SPLIT_SIDE_POT_SHOWDOWN,
  userTableAfter,
} from '../support/table-scenarios';

const sidePotAfter = (moves: string): TableState =>
  userTableAfter(SIDE_POT_DECK, moves, 6, { 5: 20 });

/** SIDE_POT_SHOWDOWN with its result replaced by `awards` (a crafted completed hand). */
function withAwards(awards: HandResult['awards']): TableState {
  const hand = SIDE_POT_SHOWDOWN.hand as HandState;
  const result = hand.result as HandResult;
  return { ...SIDE_POT_SHOWDOWN, hand: { ...hand, result: { ...result, awards } } };
}

const amounts = (table: TableState): number[] => tableView(table).pots.map((p) => p.amount);

describe('side pots', () => {
  it('pot lines and pot results follow the engine pots and awards', () => {
    expect(potLabel(0, 2)).toBe('Main pot');
    expect(potLabel(1, 2)).toBe('Side pot');
    expect(potLabel(1, 3)).toBe('Side pot 1');
    expect(potLabel(2, 3)).toBe('Side pot 2');
    expect(potLines(null, false)).toEqual([]);

    // Street bets go to the last line.
    const bet = sidePotAfter(`${SIDE_POT_MOVES} 1:bet`);
    expect(amounts(bet)).toEqual([60, 88]);
    expect(tableView(bet).pot).toBe(148);
    expect(tableView(bet).pots.map((p) => p.text)).toEqual(['Main pot $60', 'Side pot $88']);

    // Every intermediate state: the lines, when shown, add up to the single total.
    const moves = `${SIDE_POT_MOVES} 1:bet 2:call`.split(' ');
    let shown = 0;
    for (let n = 1; n <= moves.length; n++) {
      const model = tableView(sidePotAfter(moves.slice(0, n).join(' ')));
      if (model.pots.length === 0) continue;
      shown++;
      expect(model.pots.reduce((sum, p) => sum + p.amount, 0)).toBe(model.pot);
    }
    expect(shown).toBeGreaterThan(0);

    // The all-in partway through the flop keeps the single total until the street ends.
    const allIn = sidePotAfter(
      '3:fold 4:fold 5:raise 6:fold 1:raise 2:raise 5:call 1:call 1:bet 2:raise 5:call',
    );
    expect((allIn.hand as HandState).players.find((p) => p.seat === 5)?.allIn).toBe(true);
    expect(tableView(allIn).pots).toEqual([]);

    expect(tableView(SIDE_POT_RIVER).pots.map((p) => [p.pot, p.label, p.amount])).toEqual([
      [0, 'Main pot', 60],
      [1, 'Side pot', 80],
    ]);
    expect(tableView(SIDE_POT_SHOWDOWN).pots).toEqual([]);
    expect(tableView(SIDE_POT_SHOWDOWN).pot).toBe(0);

    const result = handResultView(SIDE_POT_SHOWDOWN);
    expect(result?.pots).toEqual([
      {
        pot: 0,
        label: 'Main pot',
        amount: 60,
        winners: [{ seat: 5, isUser: true, text: 'You win $60' }],
        potText: 'Main pot $60',
        winnersText: 'You win $60',
        text: 'Main pot $60 · You win $60',
      },
      {
        pot: 1,
        label: 'Side pot',
        amount: 80,
        winners: [{ seat: 2, isUser: false, text: 'Ben wins $80' }],
        potText: 'Side pot $80',
        winnersText: 'Ben wins $80',
        text: 'Side pot $80 · Ben wins $80',
      },
    ]);

    const three = handResultView(
      withAwards([
        { pot: 0, amount: 60, winners: [{ seat: 5, amount: 60 }] },
        { pot: 1, amount: 40, winners: [{ seat: 2, amount: 40 }] },
        {
          pot: 2,
          amount: 81,
          winners: [
            { seat: 2, amount: 41 },
            { seat: 1, amount: 40 },
          ],
        },
      ]),
    );
    expect(three?.pots?.map((p) => p.label)).toEqual(['Main pot', 'Side pot 1', 'Side pot 2']);
    expect(three?.pots?.[2]?.text).toBe('Side pot 2 $81 · Ben wins $41, Ava wins $40');

    const split = handResultView(
      withAwards([
        { pot: 0, amount: 60, winners: [{ seat: 5, amount: 60 }] },
        {
          pot: 1,
          amount: 81,
          winners: [
            { seat: 2, amount: 41 },
            { seat: 1, amount: 40 },
          ],
        },
      ]),
    );
    expect(split?.pots?.[1]?.text).toBe('Side pot $81 · Ben wins $41, Ava wins $40');
    // Each seat's shares over the pot lines add up to its Winners amount.
    for (const view of [result, three, split]) {
      for (const winner of view?.winners ?? []) {
        const shares = (view?.pots ?? [])
          .flatMap((p) => p.winners)
          .filter((w) => w.seat === winner.seat)
          .map((w) => Number(/\$(\d+)$/.exec(w.text)?.[1]));
        expect(
          shares.reduce((sum, share) => sum + share, 0),
          `seat ${winner.seat}`,
        ).toBe(winner.amount);
      }
    }

    const single = handResultView(
      withAwards([{ pot: 0, amount: 140, winners: [{ seat: 5, amount: 140 }] }]),
    );
    expect(single?.pots ?? []).toEqual([]);
    expect(single).not.toHaveProperty('pots');

    // Ben folds to Ava's river bet: her $8 comes back and the awards exclude it.
    const uncalled = sidePotAfter(`${SIDE_POT_MOVES} 1:bet 2:fold`);
    expect((uncalled.hand as HandState).result?.returned).toEqual({ seat: 1, amount: 8 });
    expect(handResultView(uncalled)?.pots?.map((p) => p.text)).toEqual([
      'Main pot $60 · You win $60',
      'Side pot $80 · Ava wins $80',
    ]);
  });

  it('pot result text is built from potText and winnersText', () => {
    const split81 = (pot: number): HandResult['awards'][number] => ({
      pot,
      amount: 81,
      winners: [
        { seat: 2, amount: 41 },
        { seat: 1, amount: 40 },
      ],
    });
    const main60 = { pot: 0, amount: 60, winners: [{ seat: 5 as const, amount: 60 }] };
    const views = [
      handResultView(SIDE_POT_SHOWDOWN),
      handResultView(
        withAwards([
          main60,
          { pot: 1, amount: 40, winners: [{ seat: 2, amount: 40 }] },
          split81(2),
        ]),
      ),
      handResultView(withAwards([main60, split81(1)])),
      handResultView(SPLIT_SIDE_POT_SHOWDOWN),
    ];
    for (const view of views) {
      expect(view?.pots?.length).toBeGreaterThanOrEqual(2);
      for (const p of view?.pots ?? []) {
        expect(p.potText).toBe(`${p.label} $${p.amount}`);
        expect(p.winnersText).toBe(p.winners.map((w) => w.text).join(', '));
        expect(p.text).toBe(`${p.potText} · ${p.winnersText}`);
      }
    }
    expect(views[3]?.pots?.map((p) => [p.potText, p.winnersText])).toEqual([
      ['Main pot $60', 'You win $60'],
      ['Side pot $81', 'Ben wins $41, Ava wins $40'],
    ]);

    // The crafted split scene keeps its chips: contributions equal the awards, and the stacks total is unchanged.
    const split = SPLIT_SIDE_POT_SHOWDOWN.hand as HandState;
    const dealt = SIDE_POT_SHOWDOWN.hand as HandState;
    const sum = (ns: number[]): number => ns.reduce((a, b) => a + b, 0);
    expect(sum(split.players.map((p) => p.totalContribution))).toBe(
      sum((split.result?.awards ?? []).map((a) => a.amount)),
    );
    expect(sum(split.players.map((p) => p.stack))).toBe(sum(dealt.players.map((p) => p.stack)));
  });

  it('an award to an unseated seat throws RangeError', () => {
    const table = {
      ...SIDE_POT_SHOWDOWN,
      seats: SIDE_POT_SHOWDOWN.seats.filter((s) => s.seat !== 2),
    };
    expect(() => handResultView(table)).toThrow(new RangeError('Seat 2 is not at the table'));
  });
});
