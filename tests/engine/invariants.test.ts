import { describe, expect, it } from 'vitest';
import {
  applyAction,
  createHand,
  type Action,
  type ActionRecord,
  type ApplyResult,
  type HandState,
  type PlayerState,
} from '../../src/engine/hand';
import {
  checkState,
  checkStep,
  describeAction,
  type ActionStep,
  type Violation,
} from '../../src/engine/invariants';

const STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };

/** Applies `type` (and `amount`) for whoever is to act. */
function act(state: HandState, type: Action['type'], amount?: number): HandState {
  const seat = state.toAct as number;
  const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
  const result = applyAction(state, action);
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function play(state: HandState, moves: [Action['type'], number?][]): HandState {
  return moves.reduce((s, [type, amount]) => act(s, type, amount), state);
}

const withPlayers = (
  state: HandState,
  patches: Record<number, Partial<PlayerState>>,
): HandState => ({
  ...state,
  players: state.players.map((p) => ({ ...p, ...patches[p.seat] })),
});

const withPot = (state: HandState, amount: number, eligible: number[]): HandState => ({
  ...state,
  pots: [{ amount, eligible }],
});

// 6 seats at $160, button 1 (SB 2, BB 3), deck 0..51 so seat 2 holds 2c (0) and seat 1 holds 3d (5).
const dealt = createHand({
  stakes: STAKES,
  seats: [1, 2, 3, 4, 5, 6].map((seat) => ({ seat, stack: 160 })),
  button: 1,
  deck: Array.from({ length: 52 }, (_, i) => i),
});
// Preflop: seats 4, 5 call, 6 and 1 fold, 2 completes, 3 checks: pot $16, flop, seat 2 to act.
const flop = play(dealt, [['call', 4], ['call', 4], ['fold'], ['fold'], ['call', 2], ['check']]);
const bet: Action = { seat: 2, type: 'bet', amount: 4 };
const betResult = applyAction(flop, bet);
const S = act(flop, 'bet', 4);
const cleanStep: ActionStep = { before: flop, action: bet, result: betResult };
const foldOut = play(S, [['fold'], ['fold'], ['fold']]);
const showdown = play(
  flop,
  Array.from({ length: 12 }, () => ['check'] as [Action['type']]),
);

const one = (invariant: string, message: string): Violation[] => [{ invariant, message }];
const ok = (state: HandState): ApplyResult => ({ ok: true, state });

describe('invariant checker', () => {
  it('each sub-check flags its corrupted state and passes the clean one', () => {
    expect(S.street).toBe('flop');
    expect(S.pots).toEqual([{ amount: 16, eligible: [2, 3, 4, 5] }]);
    expect(foldOut.result?.endedBy).toBe('fold');
    expect(showdown.result?.endedBy).toBe('showdown');
    for (const clean of [dealt, flop, S, foldOut, showdown]) expect(checkState(clean)).toEqual([]);
    expect(checkStep(cleanStep)).toEqual([]);

    const award = foldOut.result?.awards[0];
    const stateCases: [string, HandState, Violation[]][] = [
      [
        'C1',
        withPlayers(S, { 5: { stack: -1 } }),
        one('chips', 'seat 5 has an invalid stack or contribution'),
      ],
      [
        'C1 street > total',
        withPlayers(S, { 6: { streetContribution: 1 } }),
        one('chips', 'seat 6 has an invalid stack or contribution'),
      ],
      [
        'C2',
        withPlayers(S, { 2: { stack: 153 } }),
        one('chips', 'table holds $961 but the hand started with $960'),
      ],
      [
        'C3 in progress',
        withPot(withPlayers(S, { 4: { stack: 157 } }), 15, [2, 3, 4, 5]),
        one('chips', 'pots hold $15 but completed streets took $16'),
      ],
      [
        'C3 complete',
        {
          ...foldOut,
          result: {
            endedBy: 'fold',
            showdown: [],
            awards: [{ pot: 0, amount: 21, winners: award?.winners ?? [] }],
          },
        },
        one('chips', 'awards pay $21 but players put in $20'),
      ],
      [
        'C3 award shares',
        {
          ...foldOut,
          result: {
            endedBy: 'fold',
            showdown: [],
            awards: [
              { pot: 0, amount: 12, winners: [{ seat: 2, amount: 8 }] },
              { pot: 0, amount: 8, winners: [{ seat: 2, amount: 12 }] },
            ],
          },
        },
        one('chips', 'awards pay $20 but players put in $20'),
      ],
      [
        'C4',
        withPlayers(S, { 4: { stack: 155 }, 5: { stack: 157 } }),
        one('chips', 'seat 4 has $155 but should have $156'),
      ],
      ['B1 betCount', { ...S, betCount: 5 }, one('bet-cap', 'flop has 5 bets (at most 4)')],
      [
        'B1 history',
        {
          ...S,
          actions: [
            ...S.actions,
            ...[8, 12, 16, 20].map((amount): ActionRecord => ({
              street: 'preflop',
              seat: 4,
              type: 'raise',
              amount,
              added: 0,
            })),
          ],
        },
        one('bet-cap', 'preflop has 5 bets (at most 4)'),
      ],
      [
        'P1',
        withPot(S, 16, [5, 4, 3, 2]),
        one('pot-eligibility', 'main pot has a malformed eligible list'),
      ],
      [
        'P1 seat not dealt in',
        withPot(S, 16, [2, 3, 4, 5, 7]),
        one('pot-eligibility', 'main pot has a malformed eligible list'),
      ],
      [
        'P2',
        withPot(S, 16, [2, 3, 4, 5, 6]),
        one('pot-eligibility', 'main pot lists seat 6, which has folded'),
      ],
      [
        'P3',
        withPot(withPlayers(S, { 5: { streetContribution: 4 } }), 12, [2, 3, 4, 5]),
        one('pot-eligibility', 'main pot lists seat 5, which has not contributed to it'),
      ],
      [
        'P4',
        withPot(S, 16, [2, 3, 4]),
        one('pot-eligibility', 'seat 5 holds cards but is not eligible for the main pot'),
      ],
      [
        'P5',
        {
          ...withPlayers(foldOut, { 1: { stack: 180 }, 2: { stack: 152 } }),
          result: {
            endedBy: 'fold',
            showdown: [],
            awards: [{ pot: 0, amount: 20, winners: [{ seat: 1, amount: 20 }] }],
          },
        },
        one('pot-eligibility', 'main pot paid seat 1, which is not eligible'),
      ],
      [
        'P5 winner contributed nothing',
        {
          ...withPot(
            withPlayers(foldOut, { 6: { folded: false, stack: 180 }, 2: { stack: 152 } }),
            0,
            [2, 6],
          ),
          result: {
            endedBy: 'fold',
            showdown: [],
            awards: [{ pot: 0, amount: 20, winners: [{ seat: 6, amount: 20 }] }],
          },
        },
        one('pot-eligibility', 'main pot paid seat 6, which is not eligible'),
      ],
      ['K1', { ...S, board: [52, ...S.board.slice(1)] }, one('cards', '52 is not a card')],
      [
        'K2',
        { ...S, board: S.board.slice(0, 2) },
        one('cards', 'flop has 2 board and 1 burn cards'),
      ],
      [
        'K2 hole cards',
        // Intentionally malformed: a one-card hand the type system would otherwise forbid.
        withPlayers(S, { 3: { holeCards: [10] as unknown as PlayerState['holeCards'] } }),
        one('cards', 'flop has 3 board and 1 burn cards'),
      ],
      ['K3', withPlayers(S, { 2: { holeCards: [5, 6] } }), one('cards', '3d dealt twice')],
    ];
    for (const [name, state, expected] of stateCases) {
      expect(checkState(state), name).toEqual(expected);
    }

    const lastRecord = S.actions[S.actions.length - 1] as ActionRecord;
    const stepCases: [string, ActionStep, Violation[]][] = [
      [
        'L1',
        {
          ...cleanStep,
          result: { ok: false, error: { code: 'illegal-action', message: 'Illegal' } },
        },
        one('legal-action', 'engine rejected seat 2 bets $4 (illegal-action)'),
      ],
      [
        'L2',
        { ...cleanStep, action: { seat: 3, type: 'bet', amount: 4 } },
        one('legal-action', 'seat 3 acted but seat 2 was to act'),
      ],
      [
        'L3',
        { ...cleanStep, action: { seat: 2, type: 'bet', amount: 8 } },
        one('legal-action', 'seat 2 bets $8 is not in the legal set'),
      ],
      [
        'L4',
        { ...cleanStep, before: { ...flop, currentBet: -1 } },
        one('legal-action', 'seat 2 bets $4 does not match the $4 flop betting unit'),
      ],
      [
        'L5',
        {
          ...cleanStep,
          result: ok({ ...S, actions: [...S.actions.slice(0, -1), { ...lastRecord, added: 5 }] }),
        },
        one('legal-action', 'history entry for seat 2 bets $4 does not match the action'),
      ],
      [
        'L5 street',
        {
          ...cleanStep,
          result: ok({
            ...S,
            actions: [...S.actions.slice(0, -1), { ...lastRecord, street: 'preflop' }],
          }),
        },
        one('legal-action', 'history entry for seat 2 bets $4 does not match the action'),
      ],
      [
        'L5 one record',
        { ...cleanStep, result: ok({ ...S, actions: [...S.actions, lastRecord] }) },
        one('legal-action', 'history entry for seat 2 bets $4 does not match the action'),
      ],
    ];
    for (const [name, step, expected] of stepCases) {
      expect(checkStep(step), name).toEqual(expected);
    }
  });

  it('reports several invariants in order and never throws on broken shapes', () => {
    expect(
      checkStep({
        ...cleanStep,
        action: { seat: 2, type: 'bet', amount: 8 },
        result: ok(withPlayers(S, { 2: { stack: 153, holeCards: [5, 6] } })),
      }).map((v) => v.invariant),
    ).toEqual(['chips', 'legal-action', 'cards']);
    expect(
      checkStep({ ...cleanStep, before: { ...flop, toAct: null } }).map((v) => v.message),
    ).toEqual(['seat 2 acted but seat none was to act']);

    const noPots = checkState({ ...S, pots: [] });
    expect(noPots).toContainEqual({
      invariant: 'pot-eligibility',
      message: 'seat 2 holds cards but is not eligible for the main pot',
    });
    expect(
      checkState({
        ...foldOut,
        result: {
          endedBy: 'fold',
          showdown: [],
          awards: [{ pot: 3, amount: 20, winners: [{ seat: 2, amount: 20 }] }],
        },
      }),
    ).toEqual(one('pot-eligibility', 'side pot 3 paid seat 2, which is not eligible'));
    expect(checkState({ ...S, street: 'river' })).toEqual(
      one('cards', 'river has 3 board and 1 burn cards'),
    );
    const raise = { seat: 3, type: 'raise', amount: 8 } as const;
    expect(checkStep({ before: S, action: raise, result: applyAction(S, raise) })).toEqual([]);
    const turn = play(S, [
      ['call', 4],
      ['call', 4],
      ['call', 4],
    ]);
    expect(turn.street).toBe('turn');
    const turnBet = { seat: 2, type: 'bet', amount: 8 } as const;
    expect(
      checkStep({
        before: { ...turn, currentBet: -1 },
        action: turnBet,
        result: applyAction(turn, turnBet),
      }),
    ).toEqual(one('legal-action', 'seat 2 bets $8 does not match the $8 turn betting unit'));
  });

  it('describes actions in the CLI wording', () => {
    expect(
      (
        [
          { seat: 4, type: 'fold' },
          { seat: 4, type: 'check' },
          { seat: 4, type: 'call', amount: 4 },
          { seat: 4, type: 'bet', amount: 8 },
          { seat: 4, type: 'raise', amount: 16 },
        ] as Action[]
      ).map(describeAction),
    ).toEqual([
      'seat 4 folds',
      'seat 4 checks',
      'seat 4 calls $4',
      'seat 4 bets $8',
      'seat 4 raises to $16',
    ]);
  });
});
