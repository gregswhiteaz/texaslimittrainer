import { describe, expect, it } from 'vitest';
import { minimumStack, type Action, type HandState } from '../../src/engine/hand';
import type { SeatPolicy } from '../../src/engine/player-view';
import {
  DEFAULT_SESSION_CONFIG,
  SIT_AND_GO_LEVEL_1,
  applyUserAction,
  dealHand,
  nextHand,
  nextStep,
  resolveSessionConfig,
  seatSession,
  startingStack,
  stepBot,
  tableStake,
  userActions,
  type TableState,
} from '../../src/table/session';
import { headerText } from '../../src/table/table-view';
import { SCENARIO_CODE } from '../support/table-scenarios';

function checkOrFold(actions: readonly Action[]): Action {
  const pick = actions.find((a) => a.type === 'check') ?? actions.find((a) => a.type === 'fold');
  if (pick === undefined) throw new Error('No check or fold offered');
  return pick;
}
const botCheckOrFold: SeatPolicy = (view) => checkOrFold(view.legalActions);

/** Everyone folds to the big blind, who wins the blinds. */
function playOut(table: TableState): TableState {
  let t = dealHand(table, SCENARIO_CODE);
  while (nextStep(t) !== 'done') {
    t =
      nextStep(t) === 'bot'
        ? stepBot(t, botCheckOrFold)
        : applyUserAction(t, checkOrFold(userActions(t)));
  }
  return t;
}

describe('game type', () => {
  it('header names the game type and shows sit-and-go limits without a dollar sign', () => {
    expect(headerText(seatSession({ gameType: 'sit-and-go' }).config, 1)).toBe(
      'Sit-and-go · 6 players · 20/40 · Hand #1',
    );
    expect(headerText(DEFAULT_SESSION_CONFIG, 3)).toBe('Cash · 6 players · $4/$8 · Hand #3');
  });

  it('sit-and-go resolves without a stake and never refills a short or busted seat', () => {
    const sng = resolveSessionConfig({ gameType: 'sit-and-go' });
    expect('stake' in sng).toBe(false);
    expect(resolveSessionConfig({})).toStrictEqual(DEFAULT_SESSION_CONFIG);
    expect(tableStake(sng)).toEqual({ smallBet: 20, bigBet: 40 });
    expect(tableStake(DEFAULT_SESSION_CONFIG)).toBe(DEFAULT_SESSION_CONFIG.stake);
    expect(startingStack(sng)).toBe(1500);
    expect(startingStack(DEFAULT_SESSION_CONFIG)).toBe(160);
    expect(Object.isFrozen(SIT_AND_GO_LEVEL_1)).toBe(true);

    const done = playOut(seatSession({ gameType: 'sit-and-go' }));
    const hand = done.hand as HandState;
    const short = minimumStack(done.stakes) - 1;
    const shortened: TableState = {
      ...done,
      hand: {
        ...hand,
        players: hand.players.map((p) => (p.seat === 1 ? { ...p, stack: short } : p)),
      },
    };
    const next = nextHand(shortened);
    expect(next.stacks.find((s) => s.seat === 1)?.stack).toBe(short);
    expect(next.stacks.filter((s) => s.seat !== 1).map((s) => s.stack)).toEqual(
      hand.players.filter((p) => p.seat !== 1).map((p) => p.stack),
    );
    const busted = nextHand({
      ...done,
      hand: { ...hand, players: hand.players.map((p) => (p.seat === 1 ? { ...p, stack: 0 } : p)) },
    });
    expect(busted.stacks.find((s) => s.seat === 1)?.stack).toBe(0);
  });
});
