import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
  applyAction,
  createHand,
  legalActions,
  type HandState,
  type Stakes,
} from '../../src/engine/hand';
import { playerView } from '../../src/engine/player-view';
import { actionBar, type ActionBarModel, type AmountUnit } from '../../src/table/action-bar';
import { ActionBar } from '../../src/ui/table/ActionBar';
import { fixedDeck } from '../support/table-scenarios';

const CASH: Stakes = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
/** Sit-and-go level 3: blinds 20/40, limits 40/80 (REQ-008.2). */
const SNG_L3: Stakes = { smallBlind: 20, bigBlind: 40, smallBet: 40, bigBet: 80 };
/** Everyone folds to the user (seat 5), who limps; the big blind (seat 2) checks. */
const LIMP = '3:fold 4:fold 5:call 6:fold 1:fold 2:check';

/** Six seats 1–6, button 6, every seat at `stack` unless `stacks` says otherwise. */
function newHand(stakes: Stakes, stack: number, stacks: Readonly<Record<number, number>> = {}) {
  return createHand({
    stakes,
    seats: [1, 2, 3, 4, 5, 6].map((seat) => ({ seat, stack: stacks[seat] ?? stack })),
    button: 6,
    deck: fixedDeck({}),
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

/** The user's (seat 5) enabled button texts; fails if any button is disabled. */
function userButtons(hand: HandState, unit?: AmountUnit): string[] {
  expect(hand.toAct).toBe(5);
  const buttons = renderBar(actionBar(playerView(hand, 5), unit));
  expect(buttons.every((b) => !b.disabled)).toBe(true);
  return buttons.map((b) => b.text);
}

function userAction(hand: HandState, type: string) {
  return actionBar(playerView(hand, 5)).buttons.find((b) => b.action?.type === type)?.action;
}

describe('Action bar on capped streets and short stacks', () => {
  it('a capped flop offers Fold and Call $4 and no Raise', () => {
    const hand = play(
      newHand(CASH, 160),
      '3:fold 4:fold 5:call 6:call 1:fold 2:check 2:check 5:bet 6:raise 2:fold 5:raise 6:raise',
    );
    expect(hand.street).toBe('flop');
    expect(hand.betCount).toBe(4);
    expect(hand.currentBet).toBe(16);
    expect(userButtons(hand)).toEqual(['Fold', 'Call $4']);
  });

  it('with $3 facing a $4 bet the bar offers Fold and Call all-in $3 and no Raise', () => {
    const hand = play(newHand(CASH, 160, { 5: 7 }), `${LIMP} 2:bet`);
    expect(hand.street).toBe('flop');
    expect(userButtons(hand)).toEqual(['Fold', 'Call all-in $3']);
    expect(userAction(hand, 'call')).toEqual({ seat: 5, type: 'call', amount: 3 });
  });

  it('with exactly $4 facing a $4 bet the bar offers Fold and Call $4 and no Raise', () => {
    const hand = play(newHand(CASH, 160, { 5: 8 }), `${LIMP} 2:bet`);
    expect(userButtons(hand)).toEqual(['Fold', 'Call $4']);
  });

  it('a sit-and-go bar facing 40 chips reads Call 40 and Raise to 80 without a $ sign', () => {
    const hand = play(newHand(SNG_L3, 1500), `${LIMP} 2:bet`);
    const texts = userButtons(hand, 'chips');
    expect(texts).toEqual(['Fold', 'Call 40', 'Raise to 80']);
    expect(texts.some((text) => text.includes('$'))).toBe(false);
  });

  it('with $6 facing a $4 flop bet the bar offers Fold, Call $4 and Raise all-in to $6', () => {
    const hand = play(newHand(CASH, 160, { 5: 10 }), `${LIMP} 2:bet`);
    expect(hand.players.find((p) => p.seat === 5)).toMatchObject({
      stack: 6,
      streetContribution: 0,
    });
    expect(userButtons(hand)).toEqual(['Fold', 'Call $4', 'Raise all-in to $6']);
    expect(userAction(hand, 'raise')).toEqual({ seat: 5, type: 'raise', amount: 6 });
  });

  it('with $3 and no bet facing the bar offers Check and Bet all-in $3 and no Fold', () => {
    const hand = play(newHand(CASH, 160, { 5: 7 }), `${LIMP} 2:check`);
    expect(hand.street).toBe('flop');
    expect(userButtons(hand)).toEqual(['Check', 'Bet all-in $3']);
  });

  it('after a short all-in raise to $5 the bar offers Fold and Call $1 and no Raise', () => {
    const hand = play(
      newHand(CASH, 160, { 6: 9 }),
      '3:fold 4:fold 5:call 6:call 1:fold 2:check 2:check 5:bet 6:raise 2:call',
    );
    expect(hand.actions.at(-2)).toMatchObject({ seat: 6, type: 'raise', amount: 5 });
    expect(hand.players.find((p) => p.seat === 6)?.stack).toBe(0);
    expect(userButtons(hand)).toEqual(['Fold', 'Call $1']);
  });

  it("an idle button's click handler submits nothing", () => {
    const spy = vi.fn();
    const group = ActionBar({ model: actionBar(null), onAct: spy }) as ReactElement<{
      children: ReactElement<{ onClick: () => void; disabled: boolean }>[];
    }>;
    const buttons = group.props.children;
    expect(buttons).toHaveLength(3);
    for (const button of buttons) {
      expect(button.props.disabled).toBe(true);
      button.props.onClick();
    }
    expect(spy).not.toHaveBeenCalled();
  });

  it("a disabled bar's buttons submit nothing even when they carry actions", () => {
    const spy = vi.fn();
    const hand = play(newHand(CASH, 160), `${LIMP} 2:bet`);
    const model: ActionBarModel = { ...actionBar(playerView(hand, 5)), enabled: false };
    expect(model.buttons.every((b) => b.action !== null)).toBe(true);
    const group = ActionBar({ model, onAct: spy }) as ReactElement<{
      children: ReactElement<{ onClick: () => void; disabled: boolean }>[];
    }>;
    const buttons = group.props.children;
    expect(buttons).toHaveLength(3);
    for (const button of buttons) {
      expect(button.props.disabled).toBe(true);
      button.props.onClick();
    }
    expect(spy).not.toHaveBeenCalled();
  });
});
