import { describe, expect, it } from 'vitest';
import { drawOuts } from '../../src/advice/ranges';
import { parseCards } from '../../src/engine/cards';

const outs = (hole: string, board: string) => drawOuts(parseCards(hole), parseCards(board));

describe('TASK-7.28 straight-draw outs need a hole card in the draw', () => {
  it('AC#1 a board-only open-ended run gives no straight-draw outs', () => {
    // The 7c only pairs the board's 5-6-7-8; the 2d is outside the run.
    expect(outs('7c 2d', '5h 6s 7h 8d')).toEqual([]);
    // The 8c also only pairs the board.
    expect(outs('8c 2d', '5h 6s 7h 8d')).toEqual([]);
  });

  it('AC#4 a hole card that extends the run gives the 8 straight-draw outs', () => {
    expect(outs('8c 2d', '5h 6s 7h')).toEqual(parseCards('4c 4d 4h 4s 9c 9d 9h 9s'));
  });

  it('AC#3 a made flush lists no straight-draw outs', () => {
    expect(outs('9h 8h', '7h 6h 2h')).toEqual([]);
  });
});
