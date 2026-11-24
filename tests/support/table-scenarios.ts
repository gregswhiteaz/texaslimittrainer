// Scripted table states shared by the Vitest tests and the e2e scene harness (no test-runner imports).
import type { ObservedOpponent } from '../../src/advice/ranges';
import { parseCard, type Card } from '../../src/engine/cards';
import { replayCodeFromWords } from '../../src/engine/deck';
import {
  applyAction,
  createHand,
  legalActions,
  type HandState,
  type SeatNumber,
} from '../../src/engine/hand';
import { EMPTY_STYLE_COUNTS, type StyleCounts } from '../../src/stats/style-stats';
import { hintedAt, NO_HINT, toggleHint } from '../../src/table/hint';
import {
  DEFAULT_SESSION_CONFIG,
  USER_SEAT,
  applyUserAction,
  configForPlayers,
  dealHand,
  initialBotIds,
  resolveSessionConfig,
  seatSession,
  stakesFor,
  type BotStyle,
  type CashSessionConfig,
  type SessionConfig,
  type SessionSeat,
  type TableState,
} from '../../src/table/session';

/** 9e3779b9 00000001 00000002 00000003, the pinned replay code of the e2e specs. */
export const SCENARIO_CODE = replayCodeFromWords([0x9e3779b9, 1, 2, 3]);

const STYLES: Partial<Record<number, BotStyle>> = { 2: 'Calling station', 3: 'Maniac', 4: 'Rock' };

/** The Table storyboard's line-up: Ben Calling station, Cal Maniac, Dee Rock, Ava and Eli TAG. */
export const STORYBOARD_CONFIG: CashSessionConfig = {
  ...DEFAULT_SESSION_CONFIG,
  seats: DEFAULT_SESSION_CONFIG.seats.map((s): SessionSeat =>
    s.kind === 'bot' ? { ...s, style: STYLES[s.seat] ?? 'TAG' } : s,
  ),
};
const STAKES = stakesFor(STORYBOARD_CONFIG.stake);
const STACKS = [214, 158, 305, 198, 192, 229].map((stack, i) => ({ seat: i + 1, stack }));

/** Seat 5 gets A♥ 9♠; the board runs K♠ 9♦ 4♣, 2♥, 7♣; every other card in ascending order. */
function storyboardDeck(): Card[] {
  const fixed = new Map<number, Card>(
    (
      [
        [4, 'Ah'],
        [10, '9s'],
        [13, 'Ks'],
        [14, '9d'],
        [15, '4c'],
        [17, '2h'],
        [19, '7c'],
      ] as const
    ).map(([index, text]) => [index, parseCard(text)]),
  );
  const taken = new Set(fixed.values());
  const rest = Array.from({ length: 52 }, (_, card) => card).filter((card) => !taken.has(card));
  return Array.from({ length: 52 }, (_, index) => fixed.get(index) ?? (rest.shift() as Card));
}

/** Applies each `seat:type` move in turn, e.g. '3:fold 4:call'; throws unless that seat is to act. */
export function play(hand: HandState, moves: string): HandState {
  let state = hand;
  for (const move of moves.split(' ')) {
    const [seat, type] = move.split(':');
    if (state.toAct !== Number(seat)) throw new Error(`Seat ${state.toAct} is to act, not ${seat}`);
    const action = legalActions(state).find((a) => a.type === type);
    if (action === undefined) throw new Error(`Seat ${seat} cannot ${type}`);
    const applied = applyAction(state, action);
    if (!applied.ok) throw new Error(applied.error.message);
    state = applied.state;
  }
  return state;
}

function tableAt(hand: HandState): TableState {
  return {
    config: STORYBOARD_CONFIG,
    stakes: STAKES,
    seats: STORYBOARD_CONFIG.seats,
    stacks: STACKS,
    hand,
    replayCode: SCENARIO_CODE,
    userDecisions: [],
    handNumber: 133,
    button: 6,
    nextBotName: 0,
    botIds: initialBotIds(STORYBOARD_CONFIG.seats),
    nextBotId: 6,
    rebuys: 0,
  };
}

/** Moves of the storyboard hand, one entry per named state, with the seat to act afterwards. */
const STEPS = [
  { name: 'PREFLOP', moves: '3:fold 4:fold 5:raise', toAct: 6 },
  { name: 'FLOP_BET', moves: '6:call 1:fold 2:call 2:bet', toAct: 5 },
  { name: 'TURN_BET', moves: '5:call 6:call 2:check 5:bet', toAct: 6 },
  { name: 'RIVER', moves: '6:fold 2:call 2:check', toAct: 5 },
  { name: 'SHOWDOWN', moves: '5:check', toAct: null },
] as const;
type StateName = (typeof STEPS)[number]['name'];

/** Seat 5's moves go through applyUserAction with `observed` as each decision's snapshot (no hint), so the
 *  states after a user move carry userDecisions; every other move goes through play. */
function buildStoryboard(observed?: readonly ObservedOpponent[]): {
  named: Record<StateName, TableState>;
  history: TableState[];
} {
  let table = tableAt(
    createHand({ stakes: STAKES, seats: STACKS, button: 6, deck: storyboardDeck() }),
  );
  const history = [table];
  const named = {} as Record<StateName, TableState>;
  for (const step of STEPS) {
    for (const move of step.moves.split(' ')) {
      table = playMove(table, move, observed);
      history.push(table);
    }
    const hand = table.hand as HandState;
    if (hand.toAct !== step.toAct) throw new Error(`${step.name}: seat ${hand.toAct} is to act`);
    named[step.name] = table;
  }
  return { named, history };
}

/** One `seat:type` move: the user's (seat 5) through applyUserAction with `observed`, any other through play. */
function playMove(
  table: TableState,
  move: string,
  observed?: readonly ObservedOpponent[],
): TableState {
  const hand = table.hand as HandState;
  const [seat, type] = move.split(':');
  if (Number(seat) !== USER_SEAT) return { ...table, hand: play(hand, move) };
  if (hand.toAct !== USER_SEAT) throw new Error(`Seat ${hand.toAct} is to act, not ${seat}`);
  const action = legalActions(hand).find((a) => a.type === type);
  if (action === undefined) throw new Error(`Seat ${seat} cannot ${type}`);
  return applyUserAction(table, action, observed);
}

const STORYBOARD = buildStoryboard();
export const { PREFLOP, FLOP_BET, TURN_BET, RIVER, SHOWDOWN } = STORYBOARD.named;
/** Every state of the storyboard hand from the blinds to SHOWDOWN, one per move. */
export const STORYBOARD_HISTORY: readonly TableState[] = STORYBOARD.history;

/** The storyboard SHOWDOWN state with `observed` as the snapshot of every user decision. */
export function storyboardShowdown(observed?: readonly ObservedOpponent[]): TableState {
  return buildStoryboard(observed).named.SHOWDOWN;
}

/** The storyboard's preflop decision: 3 and 4 fold, the user (seat 5, CO, A♥ 9♠) is to act in an unopened pot. */
export const PREFLOP_DECISION = STORYBOARD_HISTORY[2] as TableState;
/** The storyboard's turn decision: Ben (seat 2) checks the turn to the user. */
export const TURN_DECISION = STORYBOARD_HISTORY[10] as TableState;

/** Observed counts of `handsDealt` hands with `voluntary` VPIP and `preflopRaised` PFR hands (other counts 0). */
export function observedStyle(
  handsDealt: number,
  voluntary: number,
  preflopRaised: number,
): StyleCounts {
  return { ...EMPTY_STYLE_COUNTS, handsDealt, voluntary, preflopRaised };
}

/** Ten seats (user seat 5), pinned deal: every seat calls or checks preflop, then the flop is checked to the
 *  user, so nine opponents are live. */
export const TEN_SEAT_FLOP: TableState = ((): TableState => {
  let table = dealHand(seatSession(configForPlayers(DEFAULT_SESSION_CONFIG, 10)), SCENARIO_CODE);
  const user = table.config.userSeat;
  for (;;) {
    const hand = table.hand as HandState;
    if (hand.street === 'flop' && hand.toAct === user) return table;
    const legal = legalActions(hand);
    const action = legal.find((a) => a.type === 'check') ?? legal.find((a) => a.type === 'call');
    if (action === undefined) throw new Error('TEN_SEAT_FLOP: no check or call');
    const applied = applyAction(hand, action);
    if (!applied.ok) throw new Error(applied.error.message);
    table = { ...table, hand: applied.state };
  }
})();

/** Ten seats (user seat 5), pinned deal: every seat calls or checks on every street to a showdown; the user's
 *  four decisions (preflop call, then flop, turn and river checks) are recorded without a snapshot. */
export const TEN_SEAT_SHOWDOWN: TableState = ((): TableState => {
  let table = dealHand(seatSession(configForPlayers(DEFAULT_SESSION_CONFIG, 10)), SCENARIO_CODE);
  for (;;) {
    const hand = table.hand as HandState;
    if (hand.result !== null) return table;
    const legal = legalActions(hand);
    const action = legal.find((a) => a.type === 'check') ?? legal.find((a) => a.type === 'call');
    if (action === undefined) throw new Error('TEN_SEAT_SHOWDOWN: no check or call');
    if (hand.toAct === table.config.userSeat) {
      table = applyUserAction(table, action);
      continue;
    }
    const applied = applyAction(hand, action);
    if (!applied.ok) throw new Error(applied.error.message);
    table = { ...table, hand: applied.state };
  }
})();

/** Six seats with the user at seat 1 (the small blind, as button is 6); bots TAG. */
export const SEAT_1_CONFIG: SessionConfig = resolveSessionConfig({
  seats: ['You', 'Ben', 'Cal', 'Dee', 'Ava', 'Eli'].map((name, i): SessionSeat =>
    i === 0
      ? { seat: 1, name, kind: 'user', style: null }
      : { seat: i + 1, name, kind: 'bot', style: 'TAG' },
  ),
  userSeat: 1,
  button: 6,
});

/** The seat-1 session just after the deal (seat 3 to act). */
export const SEAT_1_DEALT: TableState = dealHand(seatSession(SEAT_1_CONFIG), SCENARIO_CODE);

/** The given deck indexes hold the given cards; every other index gets the rest in ascending card order. */
export function fixedDeck(fixed: Readonly<Record<number, string>>): Card[] {
  const placed = new Map(
    Object.entries(fixed).map(([index, text]) => [Number(index), parseCard(text)]),
  );
  const taken = new Set(placed.values());
  const rest = Array.from({ length: 52 }, (_, card) => card).filter((card) => !taken.has(card));
  return Array.from({ length: 52 }, (_, index) => placed.get(index) ?? (rest.shift() as Card));
}

/** Default six seats at $160, button 6, hand 1, dealt from fixedDeck(fixed) and played through `moves`; the
 *  user's moves are recorded as decisions, as in a live session. */
function defaultTableAfter(fixed: Readonly<Record<number, string>>, moves: string): TableState {
  return userTableAfter(fixed, moves);
}

/** Ben (seat 2, Kd 7c) wins the $122 pot at showdown with a pair of kings over You (Ah 9s). */
export const KINGS_SHOWDOWN: TableState = defaultTableAfter(
  { 1: 'Kd', 7: '7c', 4: 'Ah', 10: '9s', 13: 'Ks', 14: '9d', 15: '4c', 17: '2h', 19: '6s' },
  '3:fold 4:fold 5:raise 6:fold 1:fold 2:raise 5:call 2:bet 5:raise 2:call 2:bet 5:raise 2:call 2:bet 5:raise 2:raise 5:call',
);

/** KINGS_SHOWDOWN (or `table`, a finished hand) with its final stacks replaced by `stacks` (ascending seat order). */
export function withFinalStacks(stacks: number[], table: TableState = KINGS_SHOWDOWN): TableState {
  const hand = table.hand as HandState;
  return {
    ...table,
    hand: { ...hand, players: hand.players.map((p, i) => ({ ...p, stack: stacks[i] as number })) },
  };
}

/** Everyone folds to Ava's (seat 1, 2c 3h) $4 flop bet: she wins $12 uncontested ($4 bet returned). */
export const AVA_UNCONTESTED: TableState = defaultTableAfter(
  {},
  '3:fold 4:fold 5:call 6:fold 1:call 2:check 1:bet 2:fold 5:fold',
);

/** Ava (Kc Kd) and Ben (Qc Qd) both play the 5c-9c board straight and split the $60 pot. */
export const SPLIT_STRAIGHT: TableState = defaultTableAfter(
  { 0: 'Kc', 6: 'Kd', 1: 'Qc', 7: 'Qd', 13: '5c', 14: '6d', 15: '7h', 17: '8s', 19: '9c' },
  '3:call 4:fold 5:fold 6:fold 1:raise 2:call 3:fold 1:bet 2:call 1:bet 2:call 1:bet 2:call',
);

/**
 * Default six seats at $160 (or `stacks[seat]`), hand 1, dealt from fixedDeck(fixed) and played through `moves`.
 * Moves of the user (seat 5) go through applyUserAction with `observed` as the decision's snapshot, so each
 * captures the user's view; every other move goes through play. `hints[i]` is the number of Hint / Hide hint
 * selections at the user's i-th decision (0-based), run through the real hint state machine before acting.
 */
export function userTableAfter(
  fixed: Readonly<Record<number, string>>,
  moves: string,
  button: SeatNumber = 6,
  stacks: Readonly<Record<number, number>> = {},
  observed?: readonly ObservedOpponent[],
  hints: Readonly<Record<number, number>> = {},
): TableState {
  const session = seatSession({ button });
  const start: TableState = {
    ...session,
    stacks: session.stacks.map(({ seat, stack }) => ({ seat, stack: stacks[seat] ?? stack })),
  };
  let table: TableState = {
    ...start,
    hand: createHand({ stakes: start.stakes, seats: start.stacks, button, deck: fixedDeck(fixed) }),
    replayCode: SCENARIO_CODE,
  };
  for (const move of moves.split(' ')) {
    const hand = table.hand as HandState;
    const [seat, type] = move.split(':');
    if (Number(seat) !== USER_SEAT) {
      table = { ...table, hand: play(hand, move) };
      continue;
    }
    if (hand.toAct !== USER_SEAT) throw new Error(`Seat ${hand.toAct} is to act, not ${seat}`);
    const action = legalActions(hand).find((a) => a.type === type);
    if (action === undefined) throw new Error(`Seat ${seat} cannot ${type}`);
    let hint = NO_HINT;
    for (let i = 0; i < (hints[table.userDecisions.length] ?? 0); i++) {
      hint = toggleHint(hint, hand).state;
    }
    table = applyUserAction(table, action, observed, hintedAt(hint, table.hand));
  }
  return table;
}

/** User Ah 9s, Ben Kd 7c; the board runs Ks 9d 4c, 2h, 6s. */
export const REVIEW_DECK = {
  1: 'Kd',
  7: '7c',
  4: 'Ah',
  10: '9s',
  13: 'Ks',
  14: '9d',
  15: '4c',
  17: '2h',
  19: '6s',
};

/** 4 user and 9 bot decisions to a showdown that Ben wins: raise, flop bet, turn check, river call. */
export const REVIEW_FOUR: TableState = userTableAfter(
  REVIEW_DECK,
  '3:fold 4:fold 5:raise 6:fold 1:fold 2:call 2:check 5:bet 2:call 2:check 5:check 2:bet 5:call',
);

/** The user calls Cal's preflop raise, then folds to Ben's re-raise. */
export const CALL_THEN_FOLD: TableState = userTableAfter(
  REVIEW_DECK,
  '3:raise 4:fold 5:call 6:fold 1:fold 2:raise 3:call 5:fold 2:check 3:bet 2:fold',
);

/** Hand 133: the user (Ah 9s, cutoff) puts in $48 over 5 decisions and loses the $98 pot to Ben's kings. */
export const REVIEW_LOST_48: TableState = {
  ...userTableAfter(
    REVIEW_DECK,
    '3:fold 4:fold 5:raise 6:fold 1:fold 2:raise 5:raise 2:call 2:bet 5:raise 2:call 2:bet 5:raise 2:call 2:bet 5:call',
  ),
  handNumber: 133,
};

/** Board Ks 9d 4c 2h 6s: Ben (Kd 7c) bets the river and shows a pair of kings; Dee (5c 5d) and the user (Ah 9s)
 *  call and muck. Ava (2c 3c), Cal (2d 3d) and Eli (2s 3h) fold preflop. */
export const REVIEW_DEE_MUCKS: TableState = userTableAfter(
  { ...REVIEW_DECK, 3: '5c', 9: '5d' },
  '3:fold 4:call 5:raise 6:fold 1:fold 2:call 4:call 2:check 4:check 5:check 2:check 4:check 5:check 2:bet 4:call 5:call',
);

/** The user (Ah As, cutoff) puts in $16 and wins the whole $72 pot with aces: net +56. */
export const REVIEW_WON_56: TableState = userTableAfter(
  {
    0: 'Qc',
    6: 'Jd',
    1: 'Kd',
    7: '7c',
    2: 'Tc',
    8: 'Th',
    3: '5c',
    9: '5d',
    4: 'Ah',
    10: 'As',
    13: 'Ks',
    14: '9d',
    15: '4c',
    17: '2h',
    19: '6s',
  },
  '3:raise 4:call 5:raise 6:fold 1:raise 2:call 3:call 4:fold 5:call' +
    ' 1:check 2:check 3:check 5:check'.repeat(3),
);

/** The user's one decision is a preflop fold; Ben wins the blinds. */
export const PREFLOP_FOLD_ONLY: TableState = userTableAfter(
  REVIEW_DECK,
  '3:fold 4:fold 5:fold 6:fold 1:fold',
);

/** Button 3: every bot folds to the user in the big blind, who makes no decision. */
export const BB_WALK: TableState = userTableAfter(
  REVIEW_DECK,
  '6:fold 1:fold 2:fold 3:fold 4:fold',
  3,
);

/**
 * Button 3, river checked through on 2c 7d 9h Jc 3s: Dee (4h 4s) and You (8h 8s) show and lose, Ava (5h 5s) mucks
 * behind the eights, and Ben (Kh Ks) shows and wins $16.
 */
export const SHOWN_HANDS: TableState = userTableAfter(
  {
    0: '4h',
    6: '4s',
    1: '8h',
    7: '8s',
    3: '5h',
    9: '5s',
    4: 'Kh',
    10: 'Ks',
    13: '2c',
    14: '7d',
    15: '9h',
    17: 'Jc',
    19: '3s',
  },
  '6:fold 1:call 2:call 3:fold 4:call 5:check' + ' 4:check 5:check 1:check 2:check'.repeat(3),
  3,
);

/** The user's lone preflop raise takes the blinds. */
export const RAISE_TAKES_BLINDS: TableState = userTableAfter(
  REVIEW_DECK,
  '3:fold 4:fold 5:raise 6:fold 1:fold 2:fold',
);

/** $4/$8 flop capped at $16: the user has $12 in and faces the fourth bet (Fold, Call $4). */
export const CAPPED_FLOP: TableState = userTableAfter(
  {},
  '3:fold 4:fold 5:call 6:call 1:fold 2:check 2:check 5:bet 6:raise 2:fold 5:raise 6:raise',
);

export const LIMP_THEN_BET = '3:fold 4:fold 5:call 6:fold 1:fold 2:check 2:bet';

/** The user ($7) limps and faces a $4 flop bet holding $3 (Fold, Call all-in $3). */
export const CALL_ALL_IN: TableState = userTableAfter({}, LIMP_THEN_BET, 6, { 5: 7 });

/** The user ($10) limps and faces a $4 flop bet holding $6 (Fold, Call $4, Raise all-in to $6). */
export const RAISE_ALL_IN: TableState = userTableAfter({}, LIMP_THEN_BET, 6, { 5: 10 });

/** The user ($7) limps and the flop is checked to them holding $3 (Check, Bet all-in $3). */
export const BET_ALL_IN: TableState = userTableAfter(
  {},
  '3:fold 4:fold 5:call 6:fold 1:fold 2:check 2:check',
  6,
  { 5: 7 },
);

/** You Ah As, Ben Kh Ks, Ava Qh Qs; the board runs 2c 7d 9h, Jc, 3s. */
export const SIDE_POT_DECK = {
  4: 'Ah',
  10: 'As',
  1: 'Kh',
  7: 'Ks',
  0: 'Qh',
  6: 'Qs',
  13: '2c',
  14: '7d',
  15: '9h',
  17: 'Jc',
  19: '3s',
};

/** The user ($20) is all-in on the flop; Ava and Ben each put in $60 by the turn's end. */
export const SIDE_POT_MOVES =
  '3:fold 4:fold 5:raise 6:fold 1:raise 2:raise 5:call 1:call' +
  ' 1:bet 2:raise 5:call 1:raise 2:call' +
  ' 1:bet 2:raise 1:raise 2:raise 1:call';

/** River, Ava to act: main pot $60 {Ava, Ben, You} and side pot $80 {Ava, Ben}. */
export const SIDE_POT_RIVER: TableState = userTableAfter(SIDE_POT_DECK, SIDE_POT_MOVES, 6, {
  5: 20,
});

/** River checked through: You win the $60 main pot (aces), Ben the $80 side pot (kings); Ava shows queens. */
export const SIDE_POT_SHOWDOWN: TableState = userTableAfter(
  SIDE_POT_DECK,
  `${SIDE_POT_MOVES} 1:check 2:check`,
  6,
  { 5: 20 },
);
