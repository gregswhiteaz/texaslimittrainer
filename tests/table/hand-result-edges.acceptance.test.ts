import { describe, expect, it } from 'vitest';
import { parseCards } from '../../src/engine/cards';
import { handName, handResultView } from '../../src/table/hand-result';
import type { TableState } from '../../src/table/session';
import { KINGS_SHOWDOWN } from '../support/table-scenarios';

describe('Hand result edge cases', () => {
  it('a high card on the board is named, not the first card', () => {
    expect(handName(parseCards('9c 2d Ks Jd 6c 4h 3s'))).toBe('King high');
  });

  it('a winner who is not seated throws a RangeError', () => {
    const table: TableState = {
      ...KINGS_SHOWDOWN,
      seats: KINGS_SHOWDOWN.seats.filter((s) => s.seat !== 2),
    };
    expect(() => handResultView(table)).toThrow(new RangeError('Seat 2 is not at the table'));
    expect(() => handResultView(table)).toThrow(RangeError);
  });
});
