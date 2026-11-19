// Scripted table states shared by the Vitest tests and the e2e scene harness (no test-runner imports).
import { parseCard, type Card } from '../../src/engine/cards';
import { replayCodeFromWords } from '../../src/engine/deck';
import {
  applyAction,
  createHand,
  legalActions,
  type HandState,
  type SeatNumber,
} from '../../src/engine/hand';
import {
  DEFAULT_SESSION_CONFIG,
  USER_SEAT,
  applyUserAction,
  dealHand,
  resolveSessionConfig,
  seatSession,
  stakesFor,
  type BotStyle,
  type SessionConfig,
  type SessionSeat,
  type TableState,
} from '../../src/table/session';

/** 9e3779b9 00000001 00000002 00000003, the pinned replay code of the e2e specs. */
export const SCENARIO_CODE = replayCodeFromWords([0x9e3779b9, 1, 2, 3]);

const STYLES: Partial<Record<number, BotStyle>> = { 2: 'Calling station', 3: 'Maniac', 4: 'Rock' };

/** The Table storyboard's line-up: Ben Calling station, Cal Maniac, Dee Rock, Ava and Eli TAG. */
export const STORYBOARD_CONFIG: SessionConfig = {
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

function buildStoryboard(): { named: Record<StateName, TableState>; history: TableState[] } {
  let hand = createHand({ stakes: STAKES, seats: STACKS, button: 6, deck: storyboardDeck() });
  const history = [tableAt(hand)];
  const named = {} as Record<StateName, TableState>;
  for (const step of STEPS) {
    for (const move of step.moves.split(' ')) {
      hand = play(hand, move);
      history.push(tableAt(hand));
    }
    if (hand.toAct !== step.toAct) throw new Error(`${step.name}: seat ${hand.toAct} is to act`);
    named[step.name] = history.at(-1) as TableState;
  }
  return { named, history };
}

const STORYBOARD = buildStoryboard();
export const { PREFLOP, FLOP_BET, TURN_BET, RIVER, SHOWDOWN } = STORYBOARD.named;
/** Every state of the storyboard hand from the blinds to SHOWDOWN, one per move. */
export const STORYBOARD_HISTORY: readonly TableState[] = STORYBOARD.history;

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

/** Default six seats at $160, button 6, hand 1, dealt from fixedDeck(fixed) and played through `moves`. */
function defaultTableAfter(fixed: Readonly<Record<number, string>>, moves: string): TableState {
  const table = seatSession();
  const hand = createHand({
    stakes: table.stakes,
    seats: table.stacks,
    button: 6,
    deck: fixedDeck(fixed),
  });
  return { ...table, hand: play(hand, moves), replayCode: SCENARIO_CODE };
}

/** Ben (seat 2, Kd 7c) wins the $122 pot at showdown with a pair of kings over You (Ah 9s). */
export const KINGS_SHOWDOWN: TableState = defaultTableAfter(
  { 1: 'Kd', 7: '7c', 4: 'Ah', 10: '9s', 13: 'Ks', 14: '9d', 15: '4c', 17: '2h', 19: '6s' },
  '3:fold 4:fold 5:raise 6:fold 1:fold 2:raise 5:call 2:bet 5:raise 2:call 2:bet 5:raise 2:call 2:bet 5:raise 2:raise 5:call',
);

/** Everyone folds to Ava's (seat 1, 2c 3h) $4 flop bet: she wins $16 uncontested. */
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
 * Default six seats at $160, hand 1, dealt from fixedDeck(fixed) and played through `moves`. Moves of the user
 * (seat 5) go through applyUserAction, so each captures the user's view; every other move goes through play.
 */
export function userTableAfter(
  fixed: Readonly<Record<number, string>>,
  moves: string,
  button: SeatNumber = 6,
): TableState {
  const start = seatSession({ button });
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
    table = applyUserAction(table, action);
  }
  return table;
}

/** User Ah 9s, Ben Kd 7c; the board runs Ks 9d 4c, 2h, 6s. */
const REVIEW_DECK = {
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

/** The user's lone preflop raise takes the blinds. */
export const RAISE_TAKES_BLINDS: TableState = userTableAfter(
  REVIEW_DECK,
  '3:fold 4:fold 5:raise 6:fold 1:fold 2:fold',
);
