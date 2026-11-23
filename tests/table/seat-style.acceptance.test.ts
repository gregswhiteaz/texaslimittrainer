import { describe, expect, it } from 'vitest';
import { decideStyle } from '../../src/bots/decide';
import { decideRock } from '../../src/bots/rock';
import { decideTag } from '../../src/bots/tag';
import { botRandom } from '../../src/engine/bot-random';
import { replayCodeFromWords } from '../../src/engine/deck';
import type { Action } from '../../src/engine/hand';
import type { PlayerView } from '../../src/engine/player-view';
import { handleAdviceRequest } from '../../src/table/advice-service';
import {
  applyBotDecision,
  applyUserAction,
  botsClockwise,
  botTurn,
  configForGameType,
  configForLineUp,
  configWithSeatStyle,
  dealHand,
  DEFAULT_SESSION_CONFIG,
  nextHand,
  nextStep,
  seatSession,
  userActions,
  type BotStyle,
  type SessionConfig,
} from '../../src/table/session';

const MAX_HANDS = 200;

const rows = (config: SessionConfig): string[] =>
  botsClockwise(config).map((s) => `${s.seat} ${s.name} ${s.style}`);

/**
 * Plays `config` from replay codes [k, 1, 2, 3] (the user always takes the first legal action), sending every
 * bot decision through the advice worker's handler. For each decision by `seat` it checks the turn's style is
 * `style` and the action equals `expected(view, seed)`. Stops after the first hand in which one of those
 * decisions differs from TAG's on the same view and seed; returns whether one did.
 */
function playSeat(
  config: SessionConfig,
  seat: number,
  style: BotStyle,
  expected: (view: PlayerView, seed: number) => Action,
): boolean {
  let table = seatSession(config);
  for (let k = 1; k <= MAX_HANDS; k++) {
    table = dealHand(table, replayCodeFromWords([k, 1, 2, 3]));
    let differs = false;
    while (nextStep(table) !== 'done') {
      if (nextStep(table) === 'user') {
        table = applyUserAction(table, userActions(table)[0] as Action);
        continue;
      }
      const turn = botTurn(table);
      const response = handleAdviceRequest({
        id: k,
        kind: 'bot',
        view: turn.view,
        style: turn.style,
        seed: turn.seed,
      });
      if (!response.ok) throw new Error(response.error.message);
      const action = response.value as Action;
      if (turn.view.seat === seat) {
        expect(turn.style).toBe(style);
        expect(action).toEqual(expected(turn.view, turn.seed));
        if (
          JSON.stringify(action) !==
          JSON.stringify(decideTag(turn.view, { random: botRandom(turn.seed) }))
        ) {
          differs = true;
        }
      }
      table = applyBotDecision(table, turn, action);
    }
    if (differs) return true;
    table = nextHand(table);
  }
  return false;
}

describe('change the style of one bot seat (TASK-2.8)', () => {
  it('changing the third bot row from Maniac to Rock keeps TAG, Calling station, Rock and TAG on the other rows', () => {
    const m = configForLineUp(DEFAULT_SESSION_CONFIG, 6, 'Mixed');
    expect(rows(m)).toEqual([
      '6 Ava TAG',
      '1 Ben Calling station',
      '2 Cal Maniac',
      '3 Dee Rock',
      '4 Eli TAG',
    ]);

    const edited = configWithSeatStyle(m, 'Mixed', 2, 'Rock');

    expect(rows(edited)).toEqual([
      '6 Ava TAG',
      '1 Ben Calling station',
      '2 Cal Rock',
      '3 Dee Rock',
      '4 Eli TAG',
    ]);
    // User seat, button, game type, stake and speed are m's.
    expect({ ...edited, seats: m.seats, lineUp: m.lineUp }).toEqual(m);
    expect(edited.lineUp).toBe('Custom');
    expect(configWithSeatStyle(edited, 'Mixed', 2, 'Maniac')).toEqual(m);
  });

  it('start game with seat 2 changed to Rock seats a Rock that plays the Rock policy and records the line-up Custom', () => {
    const config = configForGameType(
      configWithSeatStyle(configForLineUp(DEFAULT_SESSION_CONFIG, 6, 'Mixed'), 'Mixed', 2, 'Rock'),
      'cash',
      { smallBet: 4, bigBet: 8 },
    );
    expect(config.lineUp).toBe('Custom');
    const table = seatSession(config);
    expect(table.config.lineUp).toBe('Custom');
    expect(table.seats.find((s) => s.seat === 2)).toEqual({
      seat: 2,
      name: 'Cal',
      kind: 'bot',
      style: 'Rock',
    });

    expect(playSeat(config, 2, 'Rock', (view) => decideRock(view))).toBe(true);
  });

  it('a seat changed to Rock and back to its tough style keeps the line-up name Tough', () => {
    const t = configForLineUp(DEFAULT_SESSION_CONFIG, 6, 'Tough');
    for (const [seat, original] of [
      [1, 'TAG'],
      [6, 'Maniac'],
    ] as const) {
      expect(t.seats.find((s) => s.seat === seat)?.style).toBe(original);
      const rock = configWithSeatStyle(t, 'Tough', seat, 'Rock');
      expect(rock.lineUp).toBe('Custom');
      const back = configWithSeatStyle(rock, 'Tough', seat, original);
      expect(back.lineUp).toBe('Tough');
      expect(back.seats).toEqual(t.seats);

      const started = configForGameType(back, 'cash', DEFAULT_SESSION_CONFIG.stake);
      expect(started.lineUp).toBe('Tough');
      expect(seatSession(started).config.lineUp).toBe('Tough');
    }
  });

  it('seats changed to calling station, maniac or rock play their own policy rather than TAG', () => {
    const m = configForLineUp(DEFAULT_SESSION_CONFIG, 6, 'Mixed');
    expect(m.seats.find((s) => s.seat === 6)?.style).toBe('TAG');
    for (const style of ['Calling station', 'Maniac', 'Rock'] as const) {
      const config = configWithSeatStyle(m, 'Mixed', 6, style);
      expect(config.lineUp).toBe('Custom');
      expect(seatSession(config).seats.find((s) => s.seat === 6)?.style).toBe(style);

      expect(
        playSeat(config, 6, style, (view, seed) => decideStyle(view, style, botRandom(seed))),
      ).toBe(true);
    }
  });
});
