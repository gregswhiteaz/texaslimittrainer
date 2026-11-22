import { describe, expect, it } from 'vitest';
import { GRADE_LABELS, gradeView } from '../../src/advice/grade';
import { BOT_NAMES } from '../../src/bots/lineup';
import { replayCodeFromWords } from '../../src/engine/deck';
import type { Action } from '../../src/engine/hand';
import { opensReview, reviewEntries, userReviewEntries } from '../../src/table/review';
import {
  applyUserAction,
  completedHand,
  configForGameType,
  configForPlayers,
  dealHand,
  DEFAULT_SESSION_CONFIG,
  nextHand,
  nextStep,
  seatSession,
  stepBot,
  TABLE_SIZES,
  userActions,
  type CompletedHand,
  type SessionConfig,
  type TableState,
} from '../../src/table/session';
import { positionName, tableView } from '../../src/table/table-view';
import { SCENARIO_CODE } from '../support/table-scenarios';

const S = 'Small blind';
const G = 'Big blind';
const U = 'Under the gun';
const H = 'Hijack';
const C = 'Cutoff';
const B = 'Button';
const POSITIONS: Readonly<Record<number, readonly string[]>> = {
  2: [G, S],
  3: [S, G, B],
  4: [S, G, C, B],
  5: [S, G, H, C, B],
  6: [S, G, U, H, C, B],
  7: [S, G, U, `${U} +1`, H, C, B],
  8: [S, G, U, `${U} +1`, `${U} +2`, H, C, B],
  9: [S, G, U, `${U} +1`, `${U} +2`, `${U} +3`, H, C, B],
  10: [S, G, U, `${U} +1`, `${U} +2`, `${U} +3`, `${U} +4`, H, C, B],
};
const SIT_AND_GO = configForGameType(
  DEFAULT_SESSION_CONFIG,
  'sit-and-go',
  DEFAULT_SESSION_CONFIG.stake,
);

function checkOrCall(table: TableState): Action {
  const actions = userActions(table);
  const pick = actions.find((a) => a.type === 'check') ?? actions.find((a) => a.type === 'call');
  if (pick === undefined) throw new Error('No check or call offered');
  return pick;
}

/** Bots act through stepBot, the user checks when legal, otherwise calls, until the hand is done. */
function playOut(table: TableState): TableState {
  let current = table;
  for (;;) {
    const step = nextStep(current);
    if (step === 'done') return current;
    current = step === 'bot' ? stepBot(current) : applyUserAction(current, checkOrCall(current));
  }
}

describe('Table size acceptance', () => {
  it('every size from 2 to 10 seats the user and size minus 1 bots with the size in the header', () => {
    for (const n of TABLE_SIZES) {
      for (const base of [DEFAULT_SESSION_CONFIG, SIT_AND_GO]) {
        const config = configForPlayers(base, n);
        const userSeat = Math.min(5, n);
        expect(config.players).toBe(n);
        expect(config.gameType).toBe(base.gameType);
        expect(config.seats.map((s) => s.seat)).toEqual(Array.from({ length: n }, (_, i) => i + 1));
        const users = config.seats.filter((s) => s.kind === 'user');
        expect(users).toEqual([{ seat: userSeat, name: 'You', kind: 'user', style: null }]);
        expect(config.userSeat).toBe(userSeat);
        const bots = config.seats.filter((s) => s.kind === 'bot');
        expect(bots.map((s) => s.name)).toEqual(BOT_NAMES.slice(0, n - 1));
        expect(bots.every((s) => s.style === 'TAG')).toBe(true);
        expect(config.button).toBe((userSeat % n) + 1);

        const table = dealHand(seatSession(config), SCENARIO_CODE);
        expect(table.hand?.players).toHaveLength(n);
        const view = tableView(table);
        expect(view.seats).toHaveLength(n);
        expect(view.header).toBe(
          base.gameType === 'cash'
            ? `Cash · ${n} players · $4/$8 · Hand #1`
            : `Sit-and-go · ${n} players · 20/40 · Hand #1`,
        );
      }
    }
    expect(configForPlayers(DEFAULT_SESSION_CONFIG, 6)).toEqual(DEFAULT_SESSION_CONFIG);
    expect(configForPlayers(SIT_AND_GO, 6)).toEqual(SIT_AND_GO);
  });

  it('heads-up the button posts the small blind and is labelled Small blind', () => {
    let table = dealHand(seatSession(configForPlayers(DEFAULT_SESSION_CONFIG, 2)), SCENARIO_CODE);
    const hand = table.hand;
    expect(hand?.button).toBe(1);
    expect(hand?.actions.slice(0, 2).map(({ type, seat, amount }) => [type, seat, amount])).toEqual(
      [
        ['small-blind', 1, 2],
        ['big-blind', 2, 4],
      ],
    );
    expect(hand?.toAct).toBe(1);
    const seatOf = (t: TableState, seat: number) => tableView(t).seats.find((s) => s.seat === seat);
    expect(seatOf(table, 1)).toMatchObject({
      name: 'Ava',
      isButton: true,
      action: 'Small blind $2',
    });
    expect(seatOf(table, 2)).toMatchObject({ isUser: true, action: 'Big blind $4', position: G });

    // Pinned for the e2e heads-up check: the button bot does not fold preflop.
    table = stepBot(table);
    expect(table.hand?.actions[2]).toMatchObject({ seat: 1 });
    expect(table.hand?.actions[2]?.type).not.toBe('fold');
    expect(nextStep(table)).toBe('user');

    table = dealHand(nextHand(playOut(table)), SCENARIO_CODE);
    expect(table.hand?.button).toBe(2);
    expect(table.hand?.actions[0]).toMatchObject({ type: 'small-blind', seat: 2, amount: 2 });
    expect(seatOf(table, 2)).toMatchObject({ isButton: true, position: S });
  });

  it('position names at 2 to 10 seats follow the Button, blinds, Cutoff, Hijack, Under the gun rule', () => {
    expect(TABLE_SIZES).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const n of TABLE_SIZES) {
      const seats = Array.from({ length: n }, (_, i) => i + 1);
      expect(seats.map((seat) => positionName(seat, seats, n))).toEqual(POSITIONS[n]);

      const table = dealHand(
        seatSession(configForPlayers(DEFAULT_SESSION_CONFIG, n)),
        SCENARIO_CODE,
      );
      const { userSeat, button } = table.config;
      const user = tableView(table).seats.find((s) => s.isUser);
      expect(user?.position).toBe(positionName(userSeat, seats, button));
      expect(POSITIONS[n]).toContain(user?.position);
    }
  });

  it('review grades every user decision at 2 and 10 players', () => {
    for (const n of [2, 10]) {
      let table = seatSession(configForPlayers(DEFAULT_SESSION_CONFIG, n));
      let reviewed: CompletedHand | null = null;
      for (let k = 1; k <= 20 && reviewed === null; k += 1) {
        table = playOut(dealHand(table, replayCodeFromWords([0x9e3779b9, n, k, 0])));
        const done = completedHand(table);
        if (
          done !== null &&
          opensReview(done) &&
          done.userDecisions.some((d) => d.view.street !== 'preflop')
        ) {
          reviewed = done;
        }
        table = nextHand(table);
      }
      expect(reviewed, `a reviewable hand at ${n} players`).not.toBeNull();
      const hand = reviewed as CompletedHand;
      const entries = reviewEntries(hand);
      const shown = userReviewEntries(hand);
      expect(entries).toHaveLength(hand.userDecisions.length);
      expect(shown).toHaveLength(hand.userDecisions.length);
      hand.userDecisions.forEach((decision, i) => {
        expect(entries[i]?.grade).toBe(gradeView(decision.view, decision.action.type).grade);
        expect(Object.values(GRADE_LABELS)).toContain(entries[i]?.gradeLabel);
        expect(Object.values(GRADE_LABELS)).toContain(shown[i]?.gradeLabel);
      });
    }
  });

  it('the chosen size survives the game type and stake choice', () => {
    const big: SessionConfig = { ...DEFAULT_SESSION_CONFIG, stake: { smallBet: 10, bigBet: 20 } };
    for (const n of TABLE_SIZES) {
      const sized = configForPlayers(DEFAULT_SESSION_CONFIG, n);
      for (const gameType of ['cash', 'sit-and-go'] as const) {
        const started = configForGameType(sized, gameType, big.stake);
        expect(started).toMatchObject({
          gameType,
          players: n,
          seats: sized.seats,
          userSeat: sized.userSeat,
          button: sized.button,
        });
        expect('stake' in started).toBe(gameType === 'cash');
        if (started.gameType === 'cash') expect(started.stake).toEqual(big.stake);
        expect(seatSession(started).config).toEqual(started);
      }
    }
    expect(
      configForGameType(configForPlayers(DEFAULT_SESSION_CONFIG, 6), 'cash', big.stake),
    ).toEqual(configForGameType(DEFAULT_SESSION_CONFIG, 'cash', big.stake));
  });
});
