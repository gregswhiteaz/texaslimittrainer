import { describe, expect, it } from 'vitest';
import { parseCard } from '../../src/engine/cards';
import type { HandState } from '../../src/engine/hand';
import { netResult, resultText, reviewSummary } from '../../src/table/review';
import { completedHand, type CompletedHand, type TableState } from '../../src/table/session';
import { tableView } from '../../src/table/table-view';
import {
  CALL_THEN_FOLD,
  RAISE_TAKES_BLINDS,
  REVIEW_FOUR,
  REVIEW_LOST_48,
  REVIEW_WON_56,
  SHOWN_HANDS,
  SIDE_POT_SHOWDOWN,
  TEN_SEAT_SHOWDOWN,
} from '../support/table-scenarios';

function record(table: TableState): CompletedHand {
  const hand = completedHand(table);
  if (hand === null) throw new Error('Hand not complete');
  return hand;
}

/** The user's final stack minus starting stack, read from the engine's players. */
function stackChange(table: TableState): number {
  const user = (table.hand as HandState).players.find((p) => p.seat === table.config.userSeat);
  if (user === undefined) throw new Error('User not dealt in');
  return user.stack - user.startingStack;
}

function userPosition(table: TableState): string | null {
  return tableView(table).seats.find((s) => s.isUser)?.position ?? null;
}

describe('TASK-9.4 review summary model', () => {
  it('netResult is award shares plus returned minus chips put in', () => {
    const cases: [TableState, number][] = [
      [REVIEW_LOST_48, -48],
      [REVIEW_WON_56, 56],
      [REVIEW_FOUR, -20],
      [RAISE_TAKES_BLINDS, 6],
      [CALL_THEN_FOLD, -8],
      [SIDE_POT_SHOWDOWN, 40],
    ];
    for (const [table, net] of cases) {
      expect(netResult(record(table))).toBe(net);
      expect(netResult(record(table))).toBe(stackChange(table));
    }
    const raise = record(RAISE_TAKES_BLINDS);
    expect(raise.result.returned).toEqual({ seat: 5, amount: 4 });
    // Without the returned $4 the user would show a $2 loss.
    expect(netResult({ ...raise, result: { ...raise.result, returned: undefined } })).toBe(2);
    expect(
      netResult({ ...raise, result: { ...raise.result, returned: { seat: 2, amount: 4 } } }),
    ).toBe(2);
  });

  it('resultText words a win, a loss and a zero', () => {
    expect(resultText(56)).toBe('You won $56');
    expect(resultText(-48)).toBe('You lost $48');
    expect(resultText(0)).toBe('You broke even');
    expect(resultText(1)).toBe('You won $1');
    expect(resultText(-4)).toBe('You lost $4');
  });

  it('reviewSummary reads the hand number, cards, position, result and replay code', () => {
    const lost = record(REVIEW_LOST_48);
    const summary = reviewSummary(lost, 133);
    expect(summary).toEqual({
      handNumber: 133,
      holeCards: [parseCard('Ah'), parseCard('9s')],
      position: 'Cutoff',
      net: -48,
      resultText: 'You lost $48',
      replayCode: '9e3779b9000000010000000200000003',
    });
    expect(summary.holeCards).not.toBe(lost.userHoleCards);
    expect(lost.userDecisions).toHaveLength(5);
    expect(summary.position).toBe(userPosition(REVIEW_LOST_48));

    const shown = reviewSummary(record(SHOWN_HANDS), 1);
    expect(shown.position).toBe('Big blind');
    expect(shown.net).toBe(-4);
    expect(shown.position).toBe(userPosition(SHOWN_HANDS));

    const ten = reviewSummary(record(TEN_SEAT_SHOWDOWN), 1);
    expect(ten.position).toBe('Cutoff');
    expect(ten.position).toBe(userPosition(TEN_SEAT_SHOWDOWN));
  });
});
