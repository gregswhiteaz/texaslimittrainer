import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { replayCodeFromWords } from '../../src/engine/deck';
import type { Action, HandState } from '../../src/engine/hand';
import { playerView } from '../../src/engine/player-view';
import { actionBar, actionLabel, userActionBar } from '../../src/table/action-bar';
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
});
