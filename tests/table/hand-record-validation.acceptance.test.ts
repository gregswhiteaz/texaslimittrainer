import { describe, expect, it } from 'vitest';
import { tagPolicy } from '../../src/bots/tag';
import { replayCodeFromWords } from '../../src/engine/deck';
import type { HandState } from '../../src/engine/hand';
import { playerView } from '../../src/engine/player-view';
import { handRecord, parseHandRecord, type HandRecord } from '../../src/table/hand-record';
import {
  applyUserAction,
  completedHand,
  dealHand,
  nextStep,
  seatSession,
  stepBot,
  type CompletedHand,
  type SessionConfig,
  type TableState,
} from '../../src/table/session';
import { AVA_UNCONTESTED, KINGS_SHOWDOWN } from '../support/table-scenarios';

const SESSION = '0123456789abcdef0123456789abcdef';
const AT = new Date('2026-11-23T10:00:00Z');

type Json = Record<string, unknown>;

function recordOf(table: TableState): HandRecord {
  return handRecord(completedHand(table) as CompletedHand, {
    sessionId: SESSION,
    handNumber: 1,
    config: table.config,
    completedAt: AT,
  });
}

/** A seated session's first hand, played by bots and the user's tagPolicy. */
function played(input: Partial<SessionConfig>): TableState {
  let t = dealHand(seatSession(input), replayCodeFromWords([0x9e3779b9, 1, 2, 3]));
  while (nextStep(t) !== 'done') {
    t =
      nextStep(t) === 'bot'
        ? stepBot(t)
        : applyUserAction(t, tagPolicy(playerView(t.hand as HandState, t.config.userSeat)));
  }
  return t;
}

/** A deep copy of `record` changed by `edit`. */
function edited(record: HandRecord, edit: (copy: Json) => void): Json {
  const copy = structuredClone(record) as unknown as Json;
  edit(copy);
  return copy;
}

const at = (value: unknown, ...keys: (string | number)[]): Json =>
  keys.reduce<unknown>((v, k) => (v as Json)[k], value) as Json;

describe('hand record validation acceptance', () => {
  it('parseHandRecord rejects cross-field inconsistencies and unbounded lengths', () => {
    const kings = recordOf(KINGS_SHOWDOWN);
    expect(parseHandRecord(kings)).toBe(kings);
    expect(kings.userSeat).toBe(5);
    expect(kings.shown?.shown.map((s) => s.seat)).toEqual([2]);
    const [userA, userB] = kings.userHoleCards;
    const benCard = (kings.shown?.shown[0]?.holeCards as readonly number[])[0];

    const faults: [field: string, edit: (copy: Json) => void][] = [
      ['actions[3].seat', (c) => (at(c, 'actions', 3).seat = 7)],
      ['shown.shown[0].seat', (c) => (at(c, 'shown', 'shown', 0).seat = 7)],
      ['result.showdown[0].seat', (c) => (at(c, 'result', 'showdown', 0).seat = 7)],
      [
        'result.awards[0].winners[0].seat',
        (c) => (at(c, 'result', 'awards', 0, 'winners', 0).seat = 7),
      ],
      ['result.returned.seat', (c) => (at(c, 'result').returned = { seat: 7, amount: 4 })],
      ['button', (c) => (c.button = 7)],
      ['cards', (c) => (at(c, 'board')[0] = userA)],
      [
        'cards',
        (c) =>
          (at(c, 'shown', 'shown') as unknown as unknown[]).push({
            seat: 3,
            holeCards: [benCard, 0],
          }),
      ],
      [
        'shown.shown[1].holeCards',
        (c) =>
          (at(c, 'shown', 'shown') as unknown as unknown[]).push({ seat: 5, holeCards: [0, 1] }),
      ],
      ['userHoleCards', (c) => (c.userHoleCards = [userB, userB])],
      ['level', (c) => (c.level = 1)],
      ['seats[0].name', (c) => (at(c, 'seats', 0).name = 'x'.repeat(41))],
      ['actions', (c) => (c.actions = Array.from({ length: 401 }, () => at(c, 'actions', 0)))],
      [
        'result.showdown',
        (c) =>
          (at(c, 'result').showdown = Array.from({ length: 11 }, () =>
            at(c, 'result', 'showdown', 0),
          )),
      ],
      [
        'actions[2]',
        (c) => {
          const actions = [...(c.actions as unknown[])];
          Reflect.deleteProperty(actions, 2);
          c.actions = actions;
        },
      ],
    ];
    for (const [field, edit] of faults) {
      expect(() => parseHandRecord(edited(kings, edit)), field).toThrow(
        new RangeError(`Invalid hand record: ${field}`),
      );
    }
    // Names of up to 40 characters are allowed.
    expect(() =>
      parseHandRecord(edited(kings, (c) => (at(c, 'seats', 0).name = 'x'.repeat(40)))),
    ).not.toThrow();

    const sitAndGo = recordOf(played({ gameType: 'sit-and-go' }));
    expect(sitAndGo.level).toBe(1);
    expect(parseHandRecord(sitAndGo)).toBe(sitAndGo);
    expect(() => parseHandRecord({ ...sitAndGo, level: null })).toThrow(
      new RangeError('Invalid hand record: level'),
    );

    const foldOut = recordOf(AVA_UNCONTESTED);
    expect(foldOut.shown).toBeNull();
    expect(parseHandRecord(foldOut)).toBe(foldOut);
    const tenPlayers = recordOf(played({ players: 10 }));
    expect(tenPlayers.seats).toHaveLength(10);
    expect(parseHandRecord(tenPlayers)).toBe(tenPlayers);
  });
});
