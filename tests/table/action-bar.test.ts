import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { replayCodeFromWords } from '../../src/engine/deck';
import { fullBetTarget, type Action, type HandState } from '../../src/engine/hand';
import { playerView } from '../../src/engine/player-view';
import { actionBar, actionLabel, isShortAllIn, userActionBar } from '../../src/table/action-bar';
import {
  USER_SEAT,
  applyUserAction,
  dealHand,
  nextStep,
  seatSession,
  stepBot,
  userActions,
  type TableState,
} from '../../src/table/session';
import { RAISE_ALL_IN, userTableAfter } from '../support/table-scenarios';

const IDLE = {
  enabled: false,
  buttons: ['Fold', 'Call', 'Raise'].map((label) => ({ label, action: null })),
};

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

describe('action bar', () => {
  it('user action bar follows the session and labels each action', () => {
    expect(userActionBar(seatSession())).toBeNull();

    let table: TableState = dealHand(seatSession(), replayCodeFromWords([7, 1, 2, 3]));
    let botTurns = 0;
    let userTurns = 0;
    while (nextStep(table) !== 'done') {
      const bar = userActionBar(table);
      if (nextStep(table) === 'bot') {
        botTurns++;
        expect(bar).toEqual(IDLE);
        table = stepBot(table);
      } else {
        userTurns++;
        expect(bar).toEqual(actionBar(playerView(table.hand as HandState, USER_SEAT)));
        expect(bar?.enabled).toBe(true);
        expect(bar?.buttons.map((b) => b.action)).toEqual(userActions(table));
        const actions = userActions(table);
        const pick =
          actions.find((a) => a.type === 'check') ?? actions.find((a) => a.type === 'call');
        table = applyUserAction(table, pick as Action);
      }
    }
    expect(botTurns).toBeGreaterThan(0);
    expect(userTurns).toBeGreaterThan(0);
    expect(userActionBar(table)).toEqual(IDLE);
    expect(actionBar(null)).toEqual(IDLE);

    expect(actionLabel({ seat: 5, type: 'call', amount: 10 })).toBe('Call $10');
    expect(actionLabel({ seat: 5, type: 'bet', amount: 20 })).toBe('Bet $20');
    expect(actionLabel({ seat: 5, type: 'raise', amount: 40 })).toBe('Raise to $40');
    expect(actionLabel({ seat: 5, type: 'fold' })).toBe('Fold');
    expect(actionLabel({ seat: 5, type: 'check' })).toBe('Check');

    let turn = dealHand(seatSession(), replayCodeFromWords([7, 1, 2, 3]));
    while (nextStep(turn) === 'bot') turn = stepBot(turn);
    const view = playerView(turn.hand as HandState, USER_SEAT);
    const copy = structuredClone(view);
    const bar = actionBar(deepFreeze(view));
    expect(view).toEqual(copy);
    expect(bar.buttons).not.toBe(view.legalActions);
    expect(bar.buttons.map((b) => b.action)).toEqual(copy.legalActions);
  });

  it('action bar module imports no UI code', () => {
    const source = readFileSync(new URL('../../src/table/action-bar.ts', import.meta.url), 'utf8');
    const specifiers = [...source.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)].map((m) => m[1] ?? '');
    expect(specifiers.length).toBeGreaterThan(0);
    for (const specifier of specifiers) {
      expect(specifier).not.toMatch(/^react(-dom)?(\/|$)/);
      expect(specifier).not.toMatch(/(^|\/)ui(\/|$)/);
    }
    expect(typeof globalThis.document).toBe('undefined');
    expect(typeof globalThis.window).toBe('undefined');
    expect(actionBar(null).enabled).toBe(false);
  });

  it("short all-in labels follow the engine's full bet target", () => {
    const limp = '3:fold 4:fold 5:call 6:fold 1:fold 2:check';
    const userView = (table: TableState) => playerView(table.hand as HandState, USER_SEAT);
    const labels = (table: TableState) => actionBar(userView(table)).buttons.map((b) => b.label);

    const raiseAllIn = userView(RAISE_ALL_IN);
    expect(fullBetTarget(raiseAllIn)).toBe(8);
    expect(fullBetTarget(RAISE_ALL_IN.hand as HandState)).toBe(8);

    const shortRaise = userTableAfter(
      {},
      '3:fold 4:fold 5:call 6:call 1:fold 2:check 2:check 5:bet 6:raise 2:call',
      6,
      { 6: 9 },
    );
    expect(userView(shortRaise).currentBet).toBe(5);
    expect(fullBetTarget(userView(shortRaise))).toBe(8);
    expect(labels(shortRaise)).toEqual(['Fold', 'Call $1']);

    expect(labels(userTableAfter({}, `${limp} 2:check`, 6, { 5: 8 }))).toEqual(['Check', 'Bet $4']);
    expect(labels(userTableAfter({}, `${limp} 2:bet`, 6, { 5: 12 }))).toEqual([
      'Fold',
      'Call $4',
      'Raise to $8',
    ]);

    expect(isShortAllIn(raiseAllIn, { seat: 5, type: 'fold' })).toBe(false);
    expect(isShortAllIn(raiseAllIn, { seat: 5, type: 'check' })).toBe(false);
    expect(isShortAllIn(raiseAllIn, { seat: 5, type: 'call', amount: 4 })).toBe(false);
    expect(isShortAllIn(raiseAllIn, { seat: 5, type: 'raise', amount: 6 })).toBe(true);
    expect(isShortAllIn({ ...raiseAllIn, players: [] }, { seat: 5, type: 'call', amount: 3 })).toBe(
      true,
    );
    expect(actionBar(raiseAllIn)).toEqual(actionBar(raiseAllIn, 'dollars'));
    expect(actionBar(raiseAllIn, 'chips').buttons.map((b) => b.label)).toEqual([
      'Fold',
      'Call 4',
      'Raise all-in to 6',
    ]);
  });
});
