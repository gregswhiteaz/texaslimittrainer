import type { Card } from '../engine/cards';
import { shuffledDeck, type ReplayCode } from '../engine/deck';
import {
  applyAction,
  assertChips,
  createHand,
  forceFold,
  legalActions,
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
import { botDecisionSeed, botRandom } from '../engine/bot-random';
import type { ObservedOpponent } from '../advice/ranges';
import {
  addStyleCounts,
  EMPTY_STYLE_COUNTS,
  handStyleCounts,
  styleStats,
  type StyleCounts,
} from '../stats/style-stats';
import { decideTag } from '../bots/tag';
import {
  BOT_NAMES,
  lineUpSessionConfig,
  nextReplacementName,
  seatLineUp,
  type LineUpPreset,
  type LineUpSeat,
} from '../bots/lineup';

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
/** REQ-009.1, REQ-009.6: the chosen preset's name, or Custom when any bot style differs from that preset's
 *  assignment (another preset's pattern is still Custom). */
export type LineUpName = 'Mixed' | 'Tough' | 'Soft' | 'Custom';
/** TASK-2.11 / TASK-3.18 widen: 'realistic'. */
export type Speed = 'rapid';
/** Every LineUpName. */
export const LINE_UPS: readonly LineUpName[] = Object.freeze(['Mixed', 'Tough', 'Soft', 'Custom']);
/** Every Speed. */
export const SPEEDS: readonly Speed[] = Object.freeze(['rapid']);

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

/** REQ-005.2: the players options, 2..10 including the user, ascending. */
export const TABLE_SIZES: readonly number[] = Object.freeze([2, 3, 4, 5, 6, 7, 8, 9, 10]);

/** `config` seated for `players` (D-4): seats 1..players; the user at min(USER_SEAT, players); TAG bots named
 *  BOT_NAMES in ascending seat order; button = the seat after the user. Game type, stake, speed and line-up
 *  are kept. RangeError if `players` is not an integer from 2 to 10. */
export function configForPlayers(config: SessionConfig, players: number): SessionConfig {
  if (!TABLE_SIZES.includes(players)) {
    throw new RangeError('Table size must be a whole number from 2 to 10');
  }
  const userSeat = Math.min(USER_SEAT, players);
  let bot = 0;
  const seats = Array.from({ length: players }, (_, index): SessionSeat => {
    const seat = index + 1;
    return seat === userSeat
      ? { seat, name: 'You', kind: 'user', style: null }
      : { seat, name: BOT_NAMES[bot++] as string, kind: 'bot', style: 'TAG' };
  });
  return { ...config, players, seats, userSeat, button: (userSeat % players) + 1 };
}

/** `config` seated for `players` with `preset`'s line-up (TASK-2.5 D-4): user at min(USER_SEAT, players),
 *  button the seat after the user, bots from seatLineUp, lineUp = preset. Game type, stake and speed are kept.
 *  RangeError on a bad size or an unknown preset. */
export function configForLineUp(
  config: SessionConfig,
  players: number,
  preset: LineUpPreset,
): SessionConfig {
  const sized = configForPlayers(config, players);
  return lineUpSessionConfig(sized, preset, seatLineUp(preset, players, sized.userSeat));
}

/** REQ-009.2: the styles a bot seat can take, in Game Config option order. */
export const BOT_STYLES: readonly BotStyle[] = Object.freeze([
  'TAG',
  'Calling station',
  'Maniac',
  'Rock',
]);

/** REQ-009.3/009.6: `config` with bot `seat` set to `style` and the line-up name re-resolved against `preset`
 *  (Custom when any bot differs from the preset). Everything else is kept. RangeError on an unknown style, a
 *  seat that is not a bot, or as lineUpSessionConfig. */
export function configWithSeatStyle(
  config: SessionConfig,
  preset: LineUpPreset,
  seat: number,
  style: BotStyle,
): SessionConfig {
  if (!BOT_STYLES.includes(style)) throw new RangeError(`Unknown bot style: ${String(style)}`);
  if (!config.seats.some((s) => s.seat === seat && s.kind === 'bot')) {
    throw new RangeError(`Seat ${seat} is not a bot seat`);
  }
  const seats = config.seats.map((s): LineUpSeat =>
    s.kind === 'user'
      ? { seat: s.seat, kind: 'user', style: null, name: null }
      : { seat: s.seat, kind: 'bot', style: s.seat === seat ? style : s.style, name: s.name },
  );
  return lineUpSessionConfig(config, preset, seats);
}

/** REQ-009.5: one style per bot seat, each BOT_STYLES[w % 4] for a fresh word w from `nextWord` (exactly
 *  uniform since 2^32 is a multiple of 4), drawn in botsClockwise order. RangeError if a word is not an integer
 *  in 0..2^32-1. */
export function randomBotStyles(
  config: SessionConfig,
  nextWord: () => number,
): Readonly<Record<number, BotStyle>> {
  const styles: Record<number, BotStyle> = {};
  for (const { seat } of botsClockwise(config)) {
    const w = nextWord();
    if (!Number.isInteger(w) || w < 0 || w > 0xffffffff) {
      throw new RangeError(`Random word out of range: ${String(w)}`);
    }
    styles[seat] = BOT_STYLES[w % BOT_STYLES.length] as BotStyle;
  }
  return Object.freeze(styles);
}

/** `config` with every seat in `styles` set through configWithSeatStyle against `preset`. Throws as that does. */
export function configWithSeatStyles(
  config: SessionConfig,
  preset: LineUpPreset,
  styles: Readonly<Record<number, BotStyle>>,
): SessionConfig {
  return Object.entries(styles).reduce(
    (c, [seat, style]) => configWithSeatStyle(c, preset, Number(seat), style),
    config,
  );
}

/** The bot seats in clockwise order, starting with the first bot clockwise from the user. */
export function botsClockwise(config: SessionConfig): readonly SessionSeat[] {
  const distance = (seat: number): number =>
    (seat - config.userSeat + config.players) % config.players;
  return config.seats
    .filter((s) => s.kind === 'bot')
    .sort((a, b) => distance(a.seat) - distance(b.seat));
}

const MAX_NAME_LENGTH = 40;

function isWholeNumber(value: unknown): value is number {
  return Number.isSafeInteger(value);
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A string of 1 to 40 characters: the name rule for configs, session records and hand records (A-5). */
export function isSeatName(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 1 && value.length <= MAX_NAME_LENGTH;
}

/** RangeError('Invalid session config: <field>') unless `value` is a valid SessionConfig: a known game type
 *  (a cash stake that passes the engine's stake rules, else assertChips's RangeError; no stake in a
 *  sit-and-go), players equal to the number of seats, dense ascending seats 1..10 with 1-40 character names,
 *  exactly one user seat at userSeat with no style, a known style on every bot, a seated button, and a known
 *  line-up and speed. Never coerces. */
export function assertSessionConfig(value: unknown): asserts value is SessionConfig {
  const fail = (field: string): never => {
    throw new RangeError(`Invalid session config: ${field}`);
  };
  if (!isRecord(value)) return fail('config');
  const config = value;
  if (config.gameType === 'cash') {
    const { stake } = config;
    if (
      !isRecord(stake) ||
      typeof stake.smallBet !== 'number' ||
      typeof stake.bigBet !== 'number'
    ) {
      return fail('stake');
    }
    // The engine's stake rules and message ('Invalid stakes'), so a restore reports what createHand would.
    assertChips(stakesFor({ smallBet: stake.smallBet, bigBet: stake.bigBet }), []);
  } else if (config.gameType === 'sit-and-go') {
    if (Object.hasOwn(config, 'stake')) fail('stake');
  } else {
    fail('gameType');
  }
  const { seats } = config;
  if (!Array.isArray(seats)) return fail('seats');
  if (!TABLE_SIZES.includes(config.players as number) || config.players !== seats.length) {
    fail('players');
  }
  if (!isWholeNumber(config.userSeat)) fail('userSeat');
  let users = 0;
  let previous = 0;
  for (let i = 0; i < seats.length; i++) {
    const field = `seats[${i}]`;
    const item: unknown = seats[i];
    if (!(i in seats) || !isRecord(item)) return fail(field);
    if (!isWholeNumber(item.seat) || item.seat < 1 || item.seat > 10 || item.seat <= previous) {
      fail(`${field}.seat`);
    }
    previous = item.seat as number;
    if (!isSeatName(item.name)) fail(`${field}.name`);
    if (item.kind === 'user') {
      users += 1;
      if (item.style !== null) fail(`${field}.style`);
      if (item.seat !== config.userSeat) fail('userSeat');
    } else if (item.kind === 'bot') {
      if (!BOT_STYLES.includes(item.style as BotStyle)) fail(`${field}.style`);
    } else {
      fail(`${field}.kind`);
    }
  }
  if (users !== 1) fail('seats');
  if (
    !isWholeNumber(config.button) ||
    !seats.some((s: { seat: unknown }) => s.seat === config.button)
  ) {
    fail('button');
  }
  if (!LINE_UPS.includes(config.lineUp as LineUpName)) fail('lineUp');
  if (!SPEEDS.includes(config.speed as Speed)) fail('speed');
}

/** `input` merged over the first-use defaults and made consistent, then validated (D-6). Given `players`
 *  without `seats`, the table is reseated for that size (configForPlayers) before `userSeat`/`button` are
 *  re-applied. Given `seats`, `players` defaults to their number, `userSeat` to the one user seat, and a
 *  button that is not a seat to the seat after the user. A sit-and-go drops the stake. RangeError as
 *  assertSessionConfig when the result is still inconsistent or unknown. */
export function resolveSessionConfig(input: Partial<SessionConfig> = {}): SessionConfig {
  const defaults: SessionConfig = DEFAULT_SESSION_CONFIG;
  const stake = (input as Partial<CashSessionConfig>).stake ?? DEFAULT_SESSION_CONFIG.stake;
  let merged = { ...defaults, ...input } as SessionConfig;
  if (input.players !== undefined && input.seats === undefined) {
    if (merged.players !== merged.seats.length) {
      merged = configForPlayers(merged, merged.players);
      if (input.userSeat !== undefined) merged = { ...merged, userSeat: input.userSeat };
      if (input.button !== undefined) merged = { ...merged, button: input.button };
    }
  } else if (input.seats !== undefined) {
    const { seats } = merged;
    const users = seats.filter((s) => s.kind === 'user');
    const userSeat =
      input.userSeat ?? (users.length === 1 ? (users[0] as SessionSeat).seat : merged.userSeat);
    let { button } = merged;
    if (input.button === undefined && !seats.some((s) => s.seat === button)) {
      const index = seats.findIndex((s) => s.seat === userSeat);
      if (index >= 0) button = (seats[(index + 1) % seats.length] as SessionSeat).seat;
    }
    merged = { ...merged, players: input.players ?? seats.length, userSeat, button };
  }
  const config = configForGameType(merged, merged.gameType, stake);
  assertSessionConfig(config);
  return config;
}

export interface UserDecision {
  readonly view: PlayerView;
  readonly action: Action;
  /** Observed-stat snapshot at this decision (TASK-8.1 supplies it); the review regrades with it. */
  readonly observed?: readonly ObservedOpponent[];
  /** True iff the hint was opened at this decision before acting (TASK-8.2); absent otherwise. */
  readonly hinted?: boolean;
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
  /** Position of the next replacement bot's name in the replacement-name sequence (0 at seating). */
  readonly nextBotName: number;
  /** Per-session bot id of each bot seat (seat → id); the user seat has none. */
  readonly botIds: Readonly<Record<number, number>>;
  /** The id the next replacement bot gets. */
  readonly nextBotId: number;
  /** The user's rebuys in this session (REQ-007.3). */
  readonly rebuys: number;
}
/** 'rebuy': no hand is dealt and the user is busted, so nothing is dealt until the user rebuys (D-4).
 *  'stopped': a sit-and-go seat is on 0, so nothing more is dealt (TASK-3.21 D-1, until TASK-5.2/5.7). */
export type NextStep = 'deal' | 'bot' | 'user' | 'done' | 'rebuy' | 'stopped';

/** handsPlayed, nextBotId, nextBotName and rebuys are at most this, so hand numbers, bot ids, replacement-name
 *  positions and rebuy counts stay safe integers (A-3). */
export const MAX_SESSION_COUNT = 1_000_000_000;

/** Bot ids 1..k for the bot seats in ascending seat order. */
export function initialBotIds(seats: readonly SessionSeat[]): Readonly<Record<number, number>> {
  const ids: Record<number, number> = {};
  [...seats]
    .filter((s) => s.kind === 'bot')
    .sort((a, b) => a.seat - b.seat)
    .forEach((s, index) => {
      ids[s.seat] = index + 1;
    });
  return ids;
}

export function seatSession(input?: Partial<SessionConfig>): TableState {
  const config = resolveSessionConfig(input);
  const stack = startingStack(config);
  const botIds = initialBotIds(config.seats);
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
    nextBotName: 0,
    botIds,
    nextBotId: Object.keys(botIds).length + 1,
    rebuys: 0,
  };
}

/** D-3: true iff the game is cash and the user has 0 chips between hands: the final stack of a finished hand,
 *  or the stack before the deal when no hand is dealt. Always false mid-hand. */
export function userBusted(table: TableState): boolean {
  const { config, hand } = table;
  if (config.gameType !== 'cash') return false;
  if (hand === null) {
    return table.stacks.find((s) => s.seat === config.userSeat)?.stack === 0;
  }
  return hand.result !== null && hand.players.find((p) => p.seat === config.userSeat)?.stack === 0;
}

/** TASK-3.21 D-1: true iff the game is a sit-and-go and some seat has 0 chips between hands: the final stacks
 *  of a finished hand, or the stacks before the deal when no hand is dealt. Always false mid-hand (A-6). */
export function sitAndGoStopped(table: TableState): boolean {
  const { config, hand } = table;
  if (config.gameType !== 'sit-and-go') return false;
  if (hand === null) return table.stacks.some((s) => s.stack === 0);
  return hand.result !== null && hand.players.some((p) => p.stack === 0);
}

/** REQ-007.2: the busted user's stack set to the buy-in and one more rebuy counted; nothing else changes.
 *  RangeError if a hand is dealt, the user is not busted, or rebuys is already MAX_SESSION_COUNT. */
export function rebuy(table: TableState): TableState {
  if (table.hand !== null) throw new RangeError('No rebuy during a hand');
  const { config } = table;
  // userBusted already implies cash; the gameType test narrows config for its stake.
  if (config.gameType !== 'cash' || !userBusted(table)) {
    throw new RangeError('No rebuy: the user has chips');
  }
  if (table.rebuys >= MAX_SESSION_COUNT)
    throw new RangeError('No rebuy: the rebuy limit is reached');
  const { userSeat, stake } = config;
  return {
    ...table,
    stacks: table.stacks.map((s) =>
      s.seat === userSeat ? { seat: s.seat, stack: buyIn(stake) } : s,
    ),
    rebuys: table.rebuys + 1,
  };
}

export function nextStep(table: TableState): NextStep {
  const { hand } = table;
  if (hand === null) {
    if (userBusted(table)) return 'rebuy';
    return sitAndGoStopped(table) ? 'stopped' : 'deal';
  }
  if (hand.result !== null) return 'done';
  return hand.toAct === table.config.userSeat ? 'user' : 'bot';
}

/** A-1: true iff a hand is dealt and has no result (nextStep is 'user' or 'bot'). */
export function handInProgress(table: TableState): boolean {
  const step = nextStep(table);
  return step === 'user' || step === 'bot';
}

/** REQ-004.8: `table` with the user's hand folded by forceFold when a hand is in progress and the user holds
 *  cards and is not all-in; otherwise `table` itself (same object). userDecisions is never changed. */
export function foldUserToLeave(table: TableState): TableState {
  const { hand } = table;
  if (hand === null || !handInProgress(table)) return table;
  const user = hand.players.find((p) => p.seat === table.config.userSeat);
  if (user === undefined || user.folded || user.allIn) return table;
  return { ...table, hand: forceFold(hand, user.seat) };
}

export function dealHand(table: TableState, code: ReplayCode): TableState {
  const step = nextStep(table);
  if (step === 'stopped') throw new RangeError('The sit-and-go has stopped: a seat has no chips');
  if (step === 'rebuy') throw new RangeError('The user has no chips: rebuy first');
  if (step !== 'deal') throw new RangeError('Not a deal step');
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

/** ms until the next hand is dealt: NEXT_HAND_DELAY_MS when the hand is done, not held, did not bust the
 *  user and did not stop the sit-and-go; else null. */
export function nextHandDelay(table: TableState, hold = false): number | null {
  return nextStep(table) === 'done' && !hold && !userBusted(table) && !sitAndGoStopped(table)
    ? NEXT_HAND_DELAY_MS
    : null;
}

/** The session ready for the next deal: final stacks carried, button one seat on, hand number + 1.
 *  Every seat keeps its chips (REQ-007.4). In cash a user on $0 waits at Rebuy (userBusted) and a bot on $0
 *  is replaced by a new bot of the same style (REQ-007.5): next unused replacement name, a fresh buy-in and the
 *  next bot id. A sit-and-go seat on 0 stops the sit-and-go (sitAndGoStopped). */
export function nextHand(table: TableState): TableState {
  const { hand, config } = table;
  if (nextStep(table) !== 'done' || hand === null) throw new RangeError('Not a next-hand step');
  let seats = table.seats;
  let nextBotName = table.nextBotName;
  let botIds = table.botIds;
  let nextBotId = table.nextBotId;
  const stacks = hand.players.map(({ seat, stack }) => {
    const current = seats.find((s) => s.seat === seat) as SessionSeat;
    if (config.gameType === 'cash' && current.kind === 'bot') {
      if (stack > 0) return { seat, stack };
      const { style } = current;
      const { name, next } = nextReplacementName(
        nextBotName,
        seats.map((s) => s.name),
      );
      nextBotName = next;
      botIds = { ...botIds, [seat]: nextBotId };
      nextBotId += 1;
      seats = seats.map((s) => (s.seat === seat ? { seat, kind: 'bot', name, style } : s));
      return { seat, stack: buyIn(config.stake) };
    }
    // Carried as is (REQ-007.4): a short seat plays its chips, a cash user on $0 waits at Rebuy / Leave table
    // (REQ-007.2) and a sit-and-go seat on 0 stops the sit-and-go (D-1).
    return { seat, stack };
  });
  const order = seats.map((s) => s.seat);
  const button = order[(order.indexOf(hand.button) + 1) % order.length] as SeatNumber;
  return {
    ...table,
    seats,
    stacks,
    button,
    handNumber: table.handNumber + 1,
    hand: null,
    replayCode: null,
    userDecisions: [],
    nextBotName,
    botIds,
    nextBotId,
  };
}

/** Style counts of the finished hands this session, by per-session bot id (TASK-8.1, D-2 alternative). Held by
 *  the table's session hook, not on TableState, and persisted in the session record's `observed` (TASK-8.6). A
 *  missing id means 0 hands. */
export type ObservedCounts = Readonly<Record<number, StyleCounts>>;

/** `counts` plus the finished hand, for each dealt-in bot by the id it had in that hand, so a bot replaced
 *  after it busts keeps its own count (A-2). */
export function countObserved(counts: ObservedCounts, done: CompletedHand): ObservedCounts {
  const next: Record<number, StyleCounts> = { ...counts };
  for (const { seat, botId } of done.seats) {
    if (botId === null) continue;
    next[botId] = addStyleCounts(next[botId] ?? EMPTY_STYLE_COUNTS, handStyleCounts(done, seat));
  }
  return next;
}

/** The user's observed-stats snapshot (TASK-8.1 A-1): one entry per bot seat whose current bot has finished at
 *  least one hand in `counts`, ascending seat, with its unrounded VPIP and PFR. Never the user's seat. */
export function userObservedSnapshot(
  table: TableState,
  counts: ObservedCounts,
): ObservedOpponent[] {
  const snapshot: ObservedOpponent[] = [];
  for (const { seat } of table.seats) {
    const id = table.botIds[seat];
    const c = id === undefined ? undefined : counts[id];
    if (c === undefined || c.handsDealt < 1) continue;
    const stats = styleStats(c);
    snapshot.push({
      seat,
      hands: c.handsDealt,
      vpip: stats.vpip as number,
      pfr: stats.pfr as number,
    });
  }
  return snapshot;
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

/** One bot action on the bot's own view: `policy` when given, else the seeded TAG decision
 *  `decideTag(view, { random: botRandom(botDecisionSeed(replayCode, view)) })`, as the app worker decides a TAG seat. */
export function stepBot(table: TableState, policy?: SeatPolicy): TableState {
  const turn = botTurn(table);
  const action =
    policy === undefined
      ? decideTag(turn.view, { random: botRandom(turn.seed) })
      : policy(turn.view);
  return applyBotDecision(table, turn, action);
}

/** Records the decision with a copy of `observed` when given (A-4) and `hinted: true` only when hinted
 *  (TASK-8.2). Throws RangeError if not the user's turn or the action is illegal. */
export function applyUserAction(
  table: TableState,
  action: Action,
  observed?: readonly ObservedOpponent[],
  hinted = false,
): TableState {
  if (nextStep(table) !== 'user' || table.hand === null) {
    throw new RangeError("Not the user's turn");
  }
  const view = playerView(table.hand, table.config.userSeat);
  const applied = applyAction(table.hand, action);
  if (!applied.ok) throw new RangeError(applied.error.message);
  return {
    ...table,
    hand: applied.state,
    userDecisions: [
      ...table.userDecisions,
      {
        view,
        action,
        ...(observed === undefined ? {} : { observed: observed.map((o) => ({ ...o })) }),
        ...(hinted ? { hinted: true } : {}),
      },
    ],
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
  readonly seats: readonly (SessionSeat & {
    readonly startingStack: number;
    /** Per-session bot id (TableState.botIds); null for the user. */
    readonly botId: number | null;
  })[];
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
    seats: table.seats.map((s) => ({
      ...s,
      startingStack: dealtIn(s.seat).startingStack,
      botId: table.botIds[s.seat] ?? null,
    })),
    userSeat,
    userHoleCards: [user.holeCards[0], user.holeCards[1]],
    actions: hand.actions,
    board: hand.board,
    shown: showdownOf(hand),
    result: hand.result,
    userDecisions: table.userDecisions,
  };
}
