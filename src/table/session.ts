import type { Card } from '../engine/cards';
import { shuffledDeck, type ReplayCode } from '../engine/deck';
import {
  applyAction,
  createHand,
  legalActions,
  minimumStack,
  type Action,
  type ActionRecord,
  type HandResult,
  type HandState,
  type PlayerState,
  type SeatNumber,
  type Stakes,
} from '../engine/hand';
import {
  playerView,
  showdownOf,
  type EarlierShowdown,
  type PlayerView,
  type SeatPolicy,
} from '../engine/player-view';
import { botDecisionSeed } from '../engine/bot-random';
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

/** REQ-006.1: the cash stakes offered on Game Config, ascending; first-use default $4/$8. */
export const CASH_STAKES: readonly Stake[] = Object.freeze(
  [2, 3, 4, 6, 10, 20].map((smallBet) => Object.freeze({ smallBet, bigBet: 2 * smallBet })),
);

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

/** REQ-005.1: a cash game carries a stake; a sit-and-go has none (D-3). */
export type GameType = 'cash' | 'sit-and-go';
/** REQ-009.1, REQ-009.6: the preset name, or Custom when the bot styles match no preset. */
export type LineUpName = 'Mixed' | 'Tough' | 'Soft' | 'Custom';
/** TASK-2.11 / TASK-3.18 widen: 'realistic'. */
export type Speed = 'rapid';

interface SessionConfigBase {
  /** 2..10 including the user (REQ-005.2); equals seats.length. */
  readonly players: number;
  readonly lineUp: LineUpName;
  /** Ascending seat order; one 'user' seat at userSeat; bots carry a style. */
  readonly seats: readonly SessionSeat[];
  readonly speed: Speed;
  readonly userSeat: SeatNumber;
  /** Starting dealer button. */
  readonly button: SeatNumber;
}
export interface CashSessionConfig extends SessionConfigBase {
  readonly gameType: 'cash';
  readonly stake: Stake;
}
export interface SitAndGoSessionConfig extends SessionConfigBase {
  readonly gameType: 'sit-and-go';
}
/** Plain, JSON-serialisable session configuration (D-2). */
export type SessionConfig = CashSessionConfig | SitAndGoSessionConfig;
export const DEFAULT_SESSION_CONFIG: CashSessionConfig = {
  gameType: 'cash',
  players: DEFAULT_SEATS.length,
  stake: { smallBet: 4, bigBet: 8 },
  lineUp: 'Custom',
  seats: DEFAULT_SEATS,
  speed: 'rapid',
  userSeat: USER_SEAT,
  button: DEFAULT_BUTTON,
};

/** REQ-008.1: every sit-and-go seat starts with 1,500 chips. */
export const SIT_AND_GO_STARTING_CHIPS = 1500;
/** REQ-008.2 level 1 (blinds 10/20); fixed until TASK-5.4 adds the level schedule. */
export const SIT_AND_GO_LEVEL_1: Stake = Object.freeze({ smallBet: 20, bigBet: 40 });

/** The limits the table plays: the cash stake, or the sit-and-go level-1 limits. */
export function tableStake(config: SessionConfig): Stake {
  return config.gameType === 'cash' ? config.stake : SIT_AND_GO_LEVEL_1;
}

/** Chips each seat starts with: the cash buy-in, or 1,500 in a sit-and-go. */
export function startingStack(config: SessionConfig): number {
  return config.gameType === 'cash' ? buyIn(config.stake) : SIT_AND_GO_STARTING_CHIPS;
}

/** `config` with the chosen game type; `stake` is kept only for a cash game. */
export function configForGameType(
  config: SessionConfig,
  gameType: GameType,
  stake: Stake,
): SessionConfig {
  const { players, lineUp, seats, speed, userSeat, button } = config;
  const common = { players, lineUp, seats, speed, userSeat, button };
  return gameType === 'cash' ? { gameType, ...common, stake } : { gameType, ...common };
}

/** `input` merged over the first-use defaults; a sit-and-go drops the stake. Not validated (A-11). */
export function resolveSessionConfig(input: Partial<SessionConfig> = {}): SessionConfig {
  const merged = { ...DEFAULT_SESSION_CONFIG, ...input };
  return configForGameType(merged, merged.gameType, merged.stake);
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
  /** Button of the current hand (the next hand before the deal). */
  readonly button: SeatNumber;
}
export type NextStep = 'deal' | 'bot' | 'user' | 'done';

export function seatSession(input?: Partial<SessionConfig>): TableState {
  const config = resolveSessionConfig(input);
  const stack = startingStack(config);
  return {
    config,
    stakes: stakesFor(tableStake(config)),
    seats: config.seats,
    stacks: config.seats.map(({ seat }) => ({ seat, stack })),
    hand: null,
    replayCode: null,
    userDecisions: [],
    handNumber: 1,
    button: config.button,
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
    button: table.button,
    deck: shuffledDeck(code),
  });
  return { ...table, hand, replayCode: code };
}

/** REQ-011.1: at Rapid a bot acts on the next scheduler tick; no artificial wait. */
export const RAPID_BOT_DELAY_MS = 0;

/** ms the table waits before starting a bot's decision at `speed` (TASK-3.18 adds Realistic). */
export function botActionDelayMs(speed: Speed): number {
  switch (speed) {
    case 'rapid':
      return RAPID_BOT_DELAY_MS;
  }
}

/** REQ-024.3: the pause between a hand's result and the next deal. */
export const NEXT_HAND_DELAY_MS = 1500;

/** ms until the next hand is dealt: NEXT_HAND_DELAY_MS when the hand is done and not held; else null. */
export function nextHandDelay(table: TableState, hold = false): number | null {
  return nextStep(table) === 'done' && !hold ? NEXT_HAND_DELAY_MS : null;
}

/** The session ready for the next deal: final stacks carried, button one seat on, hand number + 1. */
export function nextHand(table: TableState): TableState {
  const { hand } = table;
  if (nextStep(table) !== 'done' || hand === null) throw new RangeError('Not a next-hand step');
  const minimum = minimumStack(table.stakes);
  const stacks = hand.players.map(({ seat, stack }) => ({
    seat,
    // TEMPORARY (TASK-3.4 Q-4): tops seats below minimumStack back to 20 big bets (the cash buy-in; 800
    // in a sit-and-go at 20/40) because the engine has no all-in yet. Removal is an acceptance criterion on TASK-1.16 / TASK-3.11 (whichever lands last).
    stack: stack < minimum ? buyIn(tableStake(table.config)) : stack,
  }));
  const seats = table.seats.map((s) => s.seat);
  const button = seats[(seats.indexOf(hand.button) + 1) % seats.length] as SeatNumber;
  return {
    ...table,
    stacks,
    button,
    handNumber: table.handNumber + 1,
    hand: null,
    replayCode: null,
    userDecisions: [],
  };
}

/**
 * A pending bot decision. Only `view`, `style` and `seed` go to the advice worker; `hand` is the
 * staleness token.
 */
export interface BotTurn {
  readonly hand: HandState;
  readonly view: PlayerView;
  readonly style: BotStyle;
  /** botDecisionSeed(replayCode, view): the replay code stays on the main thread (REQ-028.1). */
  readonly seed: number;
}

/** The bot to act: its view (playerView(hand, hand.toAct)), its seat's style ('TAG' if null) and its seed. */
export function botTurn(table: TableState): BotTurn {
  const { hand, replayCode } = table;
  if (nextStep(table) !== 'bot' || hand === null || hand.toAct === null || replayCode === null) {
    throw new RangeError('Not a bot turn');
  }
  const seat = hand.toAct;
  const style = table.seats.find((s) => s.seat === seat)?.style ?? 'TAG';
  const view = playerView(hand, seat);
  return { hand, view, style, seed: botDecisionSeed(replayCode, view) };
}

/** Applies `action` iff table.hand === turn.hand; else returns `table` unchanged. Throws RangeError if illegal. */
export function applyBotDecision(table: TableState, turn: BotTurn, action: Action): TableState {
  if (table.hand !== turn.hand) return table;
  const applied = applyAction(turn.hand, action);
  if (!applied.ok) throw new RangeError(applied.error.message);
  return { ...table, hand: applied.state };
}

/** One bot action through `policy` on the bot's own view. */
export function stepBot(table: TableState, policy: SeatPolicy = tagPolicy): TableState {
  const turn = botTurn(table);
  return applyBotDecision(table, turn, policy(turn.view));
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
  const dealtIn = (seat: SeatNumber): PlayerState => {
    const player = hand.players.find((p) => p.seat === seat);
    if (player === undefined) throw new RangeError(`Seat ${seat} is not dealt in`);
    return player;
  };
  const { userSeat } = table.config;
  const user = dealtIn(userSeat);
  return {
    replayCode,
    stakes: hand.stakes,
    button: hand.button,
    seats: table.seats.map((s) => ({ ...s, startingStack: dealtIn(s.seat).startingStack })),
    userSeat,
    userHoleCards: [user.holeCards[0], user.holeCards[1]],
    actions: hand.actions,
    board: hand.board,
    shown: showdownOf(hand),
    result: hand.result,
    userDecisions: table.userDecisions,
  };
}
