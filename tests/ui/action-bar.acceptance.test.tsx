import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { replayCodeFromWords, shuffledDeck } from '../../src/engine/deck';
import { applyAction, createHand, legalActions, type HandState } from '../../src/engine/hand';
import { playerView } from '../../src/engine/player-view';
import { actionBar, type ActionBarModel } from '../../src/table/action-bar';
import { ActionBar } from '../../src/ui/table/ActionBar';

const STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
const DECK = shuffledDeck(replayCodeFromWords([1, 2, 3, 4]));

function newHand(button: number): HandState {
  return createHand({
    stakes: STAKES,
    seats: [1, 2, 3, 4, 5, 6].map((seat) => ({ seat, stack: 160 })),
    button,
    deck: DECK,
  });
}

/** Applies each `seat:type` move in turn, e.g. '3:fold 4:call'; the seat must be the one to act. */
function play(hand: HandState, moves: string): HandState {
  let state = hand;
  for (const move of moves.split(' ')) {
    const [seat, type] = move.split(':');
    expect(state.toAct).toBe(Number(seat));
    const action = legalActions(state).find((a) => a.type === type);
    if (action === undefined) throw new Error(`Seat ${seat} cannot ${type}`);
    const applied = applyAction(state, action);
    if (!applied.ok) throw new Error(applied.error.message);
    state = applied.state;
  }
  return state;
}

interface RenderedButton {
  text: string;
  disabled: boolean;
}

function renderBar(model: ActionBarModel): RenderedButton[] {
  const html = renderToString(<ActionBar model={model} onAct={() => undefined} />);
  const group = /^<div role="group" aria-label="Your actions"[^>]*>(.*)<\/div>$/s.exec(html)?.[1];
  if (group === undefined) throw new Error(`No "Your actions" group in ${html}`);
  return [...group.matchAll(/<button([^>]*)>(.*?)<\/button>/gs)].map(
    ([, attrs = '', body = '']) => ({
      text: body.replace(/<!-- -->/g, ''),
      disabled: /\sdisabled=""/.test(attrs),
    }),
  );
}

function userBar(hand: HandState): RenderedButton[] {
  return renderBar(actionBar(playerView(hand, 5)));
}

const PREFLOP_LIMPED = '3:call 4:call 5:call 6:call 1:call 2:check';

describe('Action bar acceptance', () => {
  it('flop with no bet facing offers Check and Bet $4 and no Fold', () => {
    const hand = play(newHand(6), `${PREFLOP_LIMPED} 1:check 2:check 3:check 4:check`);
    expect(hand.street).toBe('flop');
    const buttons = userBar(hand);
    expect(buttons.map((b) => b.text)).toEqual(['Check', 'Bet $4']);
    expect(buttons.every((b) => !b.disabled)).toBe(true);
    expect(buttons.some((b) => b.text.includes('Fold'))).toBe(false);
  });

  it('preflop facing the big blind offers Fold, Call $4 and Raise to $8', () => {
    const hand = play(newHand(6), '3:fold 4:fold');
    const buttons = userBar(hand);
    expect(buttons.map((b) => b.text)).toEqual(['Fold', 'Call $4', 'Raise to $8']);
    expect(buttons.every((b) => !b.disabled)).toBe(true);
  });

  it('turn facing an $8 bet offers Fold, Call $8 and Raise to $16', () => {
    const hand = play(
      newHand(6),
      `${PREFLOP_LIMPED} 1:check 2:check 3:check 4:check 5:check 6:check 1:bet 2:fold 3:fold 4:fold`,
    );
    expect(hand.street).toBe('turn');
    const buttons = userBar(hand);
    expect(buttons.map((b) => b.text)).toEqual(['Fold', 'Call $8', 'Raise to $16']);
    expect(buttons.every((b) => !b.disabled)).toBe(true);
  });

  it('big blind in an unraised pot offers Check and Raise to $8 and no Fold', () => {
    const hand = play(newHand(3), '6:call 1:call 2:call 3:call 4:call');
    expect(hand.street).toBe('preflop');
    expect(hand.actions.at(-1)).toMatchObject({ seat: 4, type: 'call', amount: 2 });
    const buttons = userBar(hand);
    expect(buttons.map((b) => b.text)).toEqual(['Check', 'Raise to $8']);
    expect(buttons.every((b) => !b.disabled)).toBe(true);
    expect(buttons.some((b) => b.text.includes('Fold'))).toBe(false);
  });

  it('off-turn and finished hands show a disabled bar with no actions', () => {
    const botToAct = play(newHand(6), '3:fold');
    expect(botToAct.toAct).toBe(4);
    const finished = play(newHand(6), '3:fold 4:fold 5:fold 6:fold 1:fold');
    expect(finished.result).not.toBeNull();

    for (const model of [
      actionBar(playerView(botToAct, 5)),
      actionBar(playerView(finished, 5)),
      actionBar(null),
    ]) {
      expect(model.enabled).toBe(false);
      expect(model.buttons.map((b) => b.action)).toEqual([null, null, null]);
      expect(renderBar(model)).toEqual(
        ['Fold', 'Call', 'Raise'].map((text) => ({ text, disabled: true })),
      );
    }
  });
});
