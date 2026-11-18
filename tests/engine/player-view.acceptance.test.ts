import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { Card } from '../../src/engine/cards';
import {
  applyAction,
  createHand,
  type Action,
  type HandState,
  type SeatNumber,
} from '../../src/engine/hand';
import {
  actWith,
  showdownOf,
  type EarlierShowdown,
  type PlayerView,
} from '../../src/engine/player-view';
import { REPO_ROOT, runInSandbox, TOOLCHAIN_TIMEOUT_MS } from '../support/sandbox';

const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };

/** 0-based deck index i holds card 51 - i. */
const REVERSED = Array.from({ length: 52 }, (_, i) => 51 - i);
const at = (index: number) => REVERSED[index] as Card;

function newHand(): HandState {
  return createHand({
    stakes: STAKES_4_8,
    seats: [1, 2, 3, 4, 5, 6].map((seat) => ({ seat, stack: 160 })),
    button: 1,
    deck: REVERSED,
  });
}

type Step = [SeatNumber, Action['type'], number?];

function play(state: HandState, ...steps: Step[]): HandState {
  let current = state;
  for (const [seat, type, amount] of steps) {
    const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
    const result = applyAction(current, action);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    current = result.state;
  }
  return current;
}

/** Button 1, 6 seats: everyone calls and the big blind checks. */
const LIMP_6: Step[] = [
  [4, 'call', 4],
  [5, 'call', 4],
  [6, 'call', 4],
  [1, 'call', 4],
  [2, 'call', 2],
  [3, 'check'],
];
const CHECK_AROUND: Step[] = [2, 3, 4, 5, 6, 1].map((seat) => [seat, 'check']);

const VIEW_KEYS =
  'seat holeCards stakes button street board players pots currentBet betCount toAct actions legalActions earlierShowdowns'.split(
    ' ',
  );
const PLAYER_KEYS =
  'seat startingStack stack folded allIn streetContribution totalContribution hasActed'.split(' ');

const ENGINE_FILES = ['cards', 'hand-evaluator', 'hand', 'player-view'];

function sandboxFiles(probe: string): Record<string, string> {
  const files: Record<string, string> = { 'src/engine/probe.ts': probe };
  for (const name of ENGINE_FILES) {
    const path = `src/engine/${name}.ts`;
    files[path] = readFileSync(join(REPO_ROOT, path), 'utf8');
  }
  return files;
}

describe('player-view acceptance', () => {
  it('AC#1 the engine passes the acting seat only its own view', () => {
    const prev = play(newHand(), ...LIMP_6, ...CHECK_AROUND, ...CHECK_AROUND, ...CHECK_AROUND);
    const shown = showdownOf(prev);
    expect(shown).not.toBeNull();
    const earlier = [shown as EarlierShowdown];
    const state = play(newHand(), ...LIMP_6, [2, 'check']);

    const seen: PlayerView[] = [];
    const spy = vi.fn((view: PlayerView): Action => {
      seen.push(view);
      return { seat: 3, type: 'check' };
    });
    const result = actWith(state, spy, earlier);

    expect(spy).toHaveBeenCalledTimes(1);
    const view = seen[0] as PlayerView;
    const call = (seat: SeatNumber, amount: number) => ({
      street: 'preflop',
      seat,
      type: 'call',
      amount,
      added: amount,
    });
    expect(view).toEqual({
      seat: 3,
      holeCards: [50, 44],
      stakes: STAKES_4_8,
      button: 1,
      street: 'flop',
      board: [38, 37, 36],
      players: [1, 2, 3, 4, 5, 6].map((seat) => ({
        seat,
        startingStack: 160,
        stack: 156,
        folded: false,
        allIn: false,
        streetContribution: 0,
        totalContribution: 4,
        hasActed: seat === 2,
      })),
      pots: [{ amount: 24, eligible: [1, 2, 3, 4, 5, 6] }],
      currentBet: 0,
      betCount: 0,
      toAct: 3,
      actions: [
        { street: 'preflop', seat: 2, type: 'small-blind', amount: 2, added: 2 },
        { street: 'preflop', seat: 3, type: 'big-blind', amount: 4, added: 4 },
        call(4, 4),
        call(5, 4),
        call(6, 4),
        call(1, 4),
        call(2, 2),
        { street: 'preflop', seat: 3, type: 'check', amount: 0, added: 0 },
        { street: 'flop', seat: 2, type: 'check', amount: 0, added: 0 },
      ],
      legalActions: [
        { seat: 3, type: 'check' },
        { seat: 3, type: 'bet', amount: 4 },
      ],
      earlierShowdowns: earlier,
    });
    expect(view.board).not.toContain(at(12));

    // The earlier hand's six shown hands, each the hole cards that seat held in `prev`.
    expect(view.earlierShowdowns[0]?.shown).toHaveLength(6);
    for (const hand of view.earlierShowdowns[0]?.shown ?? []) {
      expect(hand.holeCards).toEqual(prev.players.find((p) => p.seat === hand.seat)?.holeCards);
    }

    expect(Object.keys(view).sort()).toEqual([...VIEW_KEYS].sort());
    for (const player of view.players) {
      expect(Object.keys(player).sort()).toEqual([...PLAYER_KEYS].sort());
      expect(player).not.toHaveProperty('holeCards');
    }
    for (const hidden of ['deck', 'burned', 'result']) expect(view).not.toHaveProperty(hidden);

    expect(result.ok && result.state.actions.at(-1)).toEqual({
      street: 'flop',
      seat: 3,
      type: 'check',
      amount: 0,
      added: 0,
    });
  });

  it(
    'AC#3 decision code typed on PlayerView rejects the full game state',
    () => {
      const header = [
        "import { legalActions, type Action, type HandState } from './hand';",
        "import { actWith, playerView, type PlayerView, type SeatPolicy } from './player-view';",
        '',
        'declare const state: HandState;',
        'declare const policy: SeatPolicy;',
      ];
      const broken = runInSandbox(
        sandboxFiles(
          [
            ...header,
            'export const a = policy(state);',
            'export const b = actWith(state, (s: HandState) => legalActions(s)[0] as Action);',
            'export const unused: PlayerView | typeof playerView | null = null;',
            '',
          ].join('\n'),
        ),
        'typecheck',
      );
      expect(broken.exitCode, broken.output).not.toBe(0);
      const errors = [
        ...broken.output.matchAll(/src\/engine\/probe\.ts\((\d+),\d+\): error TS2345/g),
      ];
      expect(
        errors.map((m) => Number(m[1])),
        broken.output,
      ).toEqual([6, 7]);
      expect(broken.output).toContain('PlayerView');

      const control = runInSandbox(
        sandboxFiles(
          [
            ...header,
            'export const a = policy(playerView(state, 1));',
            'export const b = actWith(state, (v: PlayerView) => v.legalActions[0] as Action);',
            'export const unused: typeof legalActions | null = null;',
            '',
          ].join('\n'),
        ),
        'typecheck',
      );
      expect(control.exitCode, control.output).toBe(0);
    },
    TOOLCHAIN_TIMEOUT_MS,
  );
});
