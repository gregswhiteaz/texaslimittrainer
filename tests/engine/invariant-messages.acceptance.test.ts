import { describe, expect, it, vi } from 'vitest';
import {
  applyAction,
  createHand,
  type Action,
  type ActionRecord,
  type HandState,
  type PlayerState,
} from '../../src/engine/hand';
import { checkState, checkStep, type Violation } from '../../src/engine/invariants';
import { runPlaytest } from '../../src/playtest/runner';

vi.setConfig({ testTimeout: 30_000 });

const STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };

function act(state: HandState, type: Action['type'], amount?: number): HandState {
  const seat = state.toAct as number;
  const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
  const result = applyAction(state, action);
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

const play = (state: HandState, moves: [Action['type'], number?][]): HandState =>
  moves.reduce((s, [type, amount]) => act(s, type, amount), state);

const withPlayers = (
  state: HandState,
  patches: Record<number, Partial<PlayerState>>,
): HandState => ({
  ...state,
  players: state.players.map((p) => ({ ...p, ...patches[p.seat] })),
});

/** Intentionally malformed hole cards the type system would otherwise forbid. */
const holeCards = (cards: number[]) => cards as unknown as PlayerState['holeCards'];

// 6 seats at $160, button 1, deck 0..51: deal order 2,3,4,5,6,1, so seat 2 holds 2c 3h (0, 6),
// seat 3 holds 2d 3s (1, 7). S is the flop after seat 2 bets $4: burned 5c (12), board 5d 5h 5s.
const dealt = createHand({
  stakes: STAKES,
  seats: [1, 2, 3, 4, 5, 6].map((seat) => ({ seat, stack: 160 })),
  button: 1,
  deck: Array.from({ length: 52 }, (_, i) => i),
});
const flop = play(dealt, [['call', 4], ['call', 4], ['fold'], ['fold'], ['call', 2], ['check']]);
const S = act(flop, 'bet', 4);
const foldOut = play(S, [['fold'], ['fold'], ['fold']]);
const showdown = play(
  flop,
  Array.from({ length: 12 }, () => ['check'] as [Action['type']]),
);
const QC = 40;

const one = (invariant: string, message: string): Violation[] => [{ invariant, message }];
const cards = (message: string) => one('cards', message);

describe('TASK-1.27 invariant messages and checks', () => {
  it('names the seat and hole-card count', () => {
    expect(checkState(withPlayers(S, { 3: { holeCards: holeCards([10]) } }))).toEqual(
      cards('seat 3 has 1 hole card but should have 2'),
    );
    expect(checkState(withPlayers(S, { 3: { holeCards: holeCards([1, 7, 30]) } }))).toEqual(
      cards('seat 3 has 3 hole cards but should have 2'),
    );
    expect(checkState(withPlayers(S, { 5: { holeCards: holeCards([]) } }))).toEqual(
      cards('seat 5 has 0 hole cards but should have 2'),
    );
    expect(
      checkState(
        withPlayers(S, { 3: { holeCards: holeCards([10]) }, 5: { holeCards: holeCards([]) } }),
      ),
    ).toEqual(cards('seat 3 has 1 hole card but should have 2'));
    expect(checkState({ ...S, board: S.board.slice(0, 2) })).toEqual(
      cards('flop has 2 board and 1 burn cards'),
    );
  });

  it('names the mismatched award', () => {
    const shares = checkState({
      ...foldOut,
      result: {
        endedBy: 'fold',
        showdown: [],
        awards: [
          { pot: 0, amount: 12, winners: [{ seat: 2, amount: 8 }] },
          { pot: 0, amount: 8, winners: [{ seat: 2, amount: 12 }] },
        ],
      },
    });
    expect(shares).toEqual(one('chips', 'award 1 (main pot) is $12 but its winners get $8'));
    expect(shares[0]?.message).not.toContain('players put in');

    const total = checkState({
      ...foldOut,
      result: {
        endedBy: 'fold',
        showdown: [],
        awards: [{ pot: 0, amount: 21, winners: [{ seat: 2, amount: 21 }] }],
      },
    });
    expect(total).toEqual(one('chips', 'awards pay $21 but players put in $20'));
  });

  it('reports cards not dealt from their deck position', () => {
    const [b1, ...burnRest] = S.burned;
    const [f1, ...boardRest] = S.board;
    expect(b1).toBe(12);
    expect(f1).toBe(13);
    expect(checkState(withPlayers(S, { 3: { holeCards: [QC, 7] } }))).toEqual(
      cards('seat 3 hole card 1 is Qc but the deck deals 2d'),
    );
    expect(
      checkState(withPlayers(S, { 2: { holeCards: [1, 6] }, 3: { holeCards: [0, 7] } })),
    ).toEqual(cards('seat 2 hole card 1 is 2d but the deck deals 2c'));
    expect(checkState({ ...S, burned: [QC, ...burnRest] })).toEqual(
      cards('burn card 1 is Qc but the deck deals 5c'),
    );
    expect(checkState({ ...S, board: [QC, ...boardRest] })).toEqual(
      cards('board card 1 is Qc but the deck deals 5d'),
    );
    const turn = play(S, [
      ['call', 4],
      ['call', 4],
      ['call', 4],
    ]);
    expect(turn.street).toBe('turn');
    expect(checkState({ ...turn, board: [...turn.board.slice(0, 3), QC] })).toEqual(
      cards('board card 4 is Qc but the deck deals 6d'),
    );
    expect(checkState({ ...S, deck: S.deck.slice(0, 14) })).toEqual(
      cards('board card 2 is 5h but the deck deals no card'),
    );

    for (let size = 3; size <= 10; size++) {
      const summary = runPlaytest({ hands: 20, seed: 7, size }, undefined, { onAction: checkStep });
      expect(summary.violations, `size ${size}`).toBe(0);
    }
  });

  it('reports a broken action history', () => {
    expect(checkState({ ...S, actions: [] })).toEqual([
      { invariant: 'legal-action', message: 'history is empty after the deal' },
    ]);
    const onShowdown = {
      street: 'showdown',
      seat: 3,
      type: 'check',
      amount: 0,
      added: 0,
    } as unknown as ActionRecord;
    expect(checkState({ ...S, actions: [...S.actions, onShowdown] })).toEqual([
      {
        invariant: 'legal-action',
        message: 'history record 10 is on showdown, which is not a betting street',
      },
    ]);
    for (const clean of [dealt, flop, S, foldOut, showdown]) expect(checkState(clean)).toEqual([]);
  });
});
