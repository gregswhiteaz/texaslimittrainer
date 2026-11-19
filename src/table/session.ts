import type { Card } from '../engine/cards';
import { shuffledDeck, type ReplayCode } from '../engine/deck';
import {
  applyAction,
  createHand,
  legalActions,
  type Action,
  type ActionRecord,
  type HandResult,
  type HandState,
  type SeatNumber,
  type Stakes,
} from '../engine/hand';
import {
  actWith,
  playerView,
  showdownOf,
  type EarlierShowdown,
  type PlayerView,
  type SeatPolicy,
} from '../engine/player-view';
import { tagPolicy } from '../bots/tag';

export interface Stake {
  readonly smallBet: number;
  readonly bigBet: number;
}
/** REQ-006.2: small blind = floor(smallBet / 2), big blind = smallBet. */
export function stakesFor(stake: Stake): Stakes {
  return {
    smallBlind: Math.floor(stake.smallBet / 2),
    bigBlind: stake.smallBet,
    smallBet: stake.smallBet,
    bigBet: stake.bigBet,
  };
}

/** REQ-007.1: 20 × big bet. */
export function buyIn(stake: Stake): number {
  return 20 * stake.bigBet;
}

/** REQ-009.2 style names; stored as-is in SessionConfig (D-2/Q-1). All play tagPolicy until E06. */
export type BotStyle = 'TAG' | 'Calling station' | 'Maniac' | 'Rock';
export interface SessionSeat {
  readonly seat: SeatNumber;
  readonly name: string;
  readonly kind: 'user' | 'bot';
  readonly style: BotStyle | null;
}
export const USER_SEAT: SeatNumber = 5;
export const DEFAULT_BUTTON: SeatNumber = 6;
export const DEFAULT_SEATS: readonly SessionSeat[] = ['Ava', 'Ben', 'Cal', 'Dee', 'You', 'Eli'].map(
  (name, index): SessionSeat => {
    const seat = index + 1;
    return seat === USER_SEAT
      ? { seat, name, kind: 'user', style: null }
      : { seat, name, kind: 'bot', style: 'TAG' };
  },
);

/** TASK-2.4 widens: 'sit-and-go' (no stake). */
export type GameType = 'cash';
/** REQ-009.1, REQ-009.6: the preset name, or Custom when the bot styles match no preset. */
export type LineUpName = 'Mixed' | 'Tough' | 'Soft' | 'Custom';
/** TASK-2.11 / TASK-3.18 widen: 'realistic'. */
export type Speed = 'rapid';

/** Plain, JSON-serialisable session configuration (D-2). */
export interface SessionConfig {
  readonly gameType: GameType;
  /** 2..10 including the user (REQ-005.2); equals seats.length. */
  readonly players: number;
  readonly stake: Stake;
  readonly lineUp: LineUpName;
  /** Ascending seat order; one 'user' seat at userSeat; bots carry a style. */
  readonly seats: readonly SessionSeat[];
  readonly speed: Speed;
  readonly userSeat: SeatNumber;
  /** Starting dealer button. */
  readonly button: SeatNumber;
}
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  gameType: 'cash',
  players: DEFAULT_SEATS.length,
  stake: { smallBet: 4, bigBet: 8 },
  lineUp: 'Custom',
  seats: DEFAULT_SEATS,
  speed: 'rapid',
  userSeat: USER_SEAT,
  button: DEFAULT_BUTTON,
};

/** `input` merged over the first-use defaults; not validated (A-11). */
export function resolveSessionConfig(input: Partial<SessionConfig> = {}): SessionConfig {
  return { ...DEFAULT_SESSION_CONFIG, ...input };
}

export interface UserDecision {
  readonly view: PlayerView;
  readonly action: Action;
}
export interface TableState {
  readonly config: SessionConfig;
  readonly stakes: Stakes;
  readonly seats: readonly SessionSeat[];
  /** Chips per seat before the current hand (buy-in until a hand completes). Ascending seat order. */
  readonly stacks: readonly { readonly seat: SeatNumber; readonly stack: number }[];
  /** Null until dealt. */
  readonly hand: HandState | null;
  readonly replayCode: ReplayCode | null;
  readonly userDecisions: readonly UserDecision[];
  /** 1-based number of the current hand (the next hand before the deal). */
  readonly handNumber: number;
}
export type NextStep = 'deal' | 'bot' | 'user' | 'done';

export function seatSession(input?: Partial<SessionConfig>): TableState {
  const config = resolveSessionConfig(input);
  const stack = buyIn(config.stake);
  return {
    config,
    stakes: stakesFor(config.stake),
    seats: config.seats,
    stacks: config.seats.map(({ seat }) => ({ seat, stack })),
    hand: null,
    replayCode: null,
    userDecisions: [],
    handNumber: 1,
  };
}

export function nextStep(table: TableState): NextStep {
  const { hand } = table;
  if (hand === null) return 'deal';
  if (hand.result !== null) return 'done';
  return hand.toAct === table.config.userSeat ? 'user' : 'bot';
}

export function dealHand(table: TableState, code: ReplayCode): TableState {
  if (nextStep(table) !== 'deal') throw new RangeError('Not a deal step');
  const hand = createHand({
    stakes: table.stakes,
    seats: table.stacks,
    button: table.config.button,
    deck: shuffledDeck(code),
  });
  return { ...table, hand, replayCode: code };
}

/** One bot action through `policy` on the bot's own view. */
export function stepBot(table: TableState, policy: SeatPolicy = tagPolicy): TableState {
  if (nextStep(table) !== 'bot' || table.hand === null) throw new RangeError('Not a bot turn');
  const applied = actWith(table.hand, policy);
  if (!applied.ok) throw new RangeError(applied.error.message);
  return { ...table, hand: applied.state };
}

export function applyUserAction(table: TableState, action: Action): TableState {
  if (nextStep(table) !== 'user' || table.hand === null) {
    throw new RangeError("Not the user's turn");
  }
  const view = playerView(table.hand, table.config.userSeat);
  const applied = applyAction(table.hand, action);
  if (!applied.ok) throw new RangeError(applied.error.message);
  return {
    ...table,
    hand: applied.state,
    userDecisions: [...table.userDecisions, { view, action }],
  };
}

/** The user's legal actions on their turn, else []. */
export function userActions(table: TableState): readonly Action[] {
  return nextStep(table) === 'user' && table.hand !== null ? legalActions(table.hand) : [];
}

export interface CompletedHand {
  readonly replayCode: ReplayCode;
  readonly stakes: Stakes;
  readonly button: SeatNumber;
  readonly seats: readonly (SessionSeat & { readonly startingStack: number })[];
  readonly userSeat: SeatNumber;
  readonly userHoleCards: readonly [Card, Card];
  /** Blinds first, then every action in order, each tagged with its street and seat. */
  readonly actions: readonly ActionRecord[];
  readonly board: readonly Card[];
  /** Hands shown at showdown (showdownOf); null for a fold-out. */
  readonly shown: EarlierShowdown | null;
  readonly result: HandResult;
  /** One entry per user decision, in order, with the user's PlayerView at that moment. */
  readonly userDecisions: readonly UserDecision[];
}

/** Plain-data record of the finished hand; null until the hand has a result. */
export function completedHand(table: TableState): CompletedHand | null {
  const { hand, replayCode } = table;
  if (hand === null || hand.result === null || replayCode === null) return null;
  const startingStack = (seat: SeatNumber): number =>
    hand.players.find((p) => p.seat === seat)?.startingStack ?? 0;
  const { userSeat } = table.config;
  const user = hand.players.find((p) => p.seat === userSeat);
  if (user === undefined) throw new RangeError('User seat is not dealt in');
  return {
    replayCode,
    stakes: hand.stakes,
    button: hand.button,
    seats: table.seats.map((s) => ({ ...s, startingStack: startingStack(s.seat) })),
    userSeat,
    userHoleCards: [user.holeCards[0], user.holeCards[1]],
    actions: hand.actions,
    board: hand.board,
    shown: showdownOf(hand),
    result: hand.result,
    userDecisions: table.userDecisions,
  };
}
