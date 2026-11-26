import { cardRank, cardSuit, RANK_CHARS, type Card } from '../engine/cards';
import type { SeatNumber } from '../engine/hand';
import {
  evaluate,
  HAND_CATEGORIES,
  handCategory,
  type HandCategory,
} from '../engine/hand-evaluator';
import type { PlayerView } from '../engine/player-view';
import type { HoleCards } from './equity';
import { basisText, OBSERVED_MIN_HANDS } from './explanations';
import { comboCount, HAND_CLASSES, handClassOf, type HandClass } from './hand-class';
import { positionOf } from './preflop';
import type { Position, ReferenceSize } from './preflop-chart';
// The JSON imports stay last, like the chart's.
import handOrder from './ranges/hand-order.json' with { type: 'json' };
import fullRing from './ranges/full-ring.json' with { type: 'json' };
import headsUp from './ranges/heads-up.json' with { type: 'json' };
import sixMax from './ranges/six-max.json' with { type: 'json' };

export type PreflopLine =
  'check' | 'limp' | 'open-raise' | 'call-raise' | 'three-bet' | 'call-three-bet' | 'four-bet';
export const PREFLOP_LINES: readonly PreflopLine[] = [
  'check',
  'limp',
  'open-raise',
  'call-raise',
  'three-bet',
  'call-three-bet',
  'four-bet',
];

interface RangeId {
  readonly position: Position;
  readonly line: PreflopLine;
}

const SIZE_POSITIONS: Readonly<Record<ReferenceSize, readonly Position[]>> = {
  'heads-up': ['BTN', 'BB'],
  '6-max': ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
  'full-ring': ['UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'],
};

/** `check` is the big blind's only; `limp` is everyone's but the big blind's; the other lines apply everywhere. */
function applicableLines(positions: readonly Position[]): readonly RangeId[] {
  return PREFLOP_LINES.flatMap((line) =>
    positions
      .filter((p) => (line === 'check' ? p === 'BB' : line !== 'limp' || p !== 'BB'))
      .map((position) => ({ position, line })),
  );
}

/** Lines each position can take at each reference size: heads-up 12, 6-max 36, full-ring 54 pairs. */
export const APPLICABLE_LINES: Readonly<Record<ReferenceSize, readonly RangeId[]>> = {
  'heads-up': applicableLines(SIZE_POSITIONS['heads-up']),
  '6-max': applicableLines(SIZE_POSITIONS['6-max']),
  'full-ring': applicableLines(SIZE_POSITIONS['full-ring']),
};

export type StrengthClass = 'strong' | 'pair' | 'draw' | 'air';
export type NarrowingAction = 'bet' | 'check' | 'call' | 'raise';
export const KEEP: Readonly<Record<NarrowingAction, readonly StrengthClass[]>> = {
  bet: ['strong', 'pair', 'draw'],
  check: ['pair', 'draw', 'air'],
  call: ['pair', 'draw'],
  raise: ['strong', 'draw'],
};

export interface DefaultRange {
  readonly position: Position;
  readonly line: PreflopLine;
  readonly justification: string;
  /** Parsed from `hands`. */
  readonly classes: ReadonlySet<HandClass>;
}

export interface DefaultRanges {
  readonly referenceSize: ReferenceSize;
  readonly justification: string;
  /** In APPLICABLE_LINES order. */
  readonly ranges: readonly DefaultRange[];
}

export class RangeValidationError extends Error {
  readonly problems: readonly string[];

  constructor(problems: readonly string[]) {
    super('Invalid default ranges:\n- ' + problems.join('\n- '));
    this.name = 'RangeValidationError';
    this.problems = problems;
  }
}

const FORMAT = 'tlh-default-ranges';
const FILE_WORDS = 50;
const RANGE_WORDS = 15;
const ECHO_CHARS = 20;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function wordCount(text: unknown): number {
  return typeof text === 'string' ? (text.match(/\p{L}+/gu) ?? []).length : 0;
}

/** Untrusted text for an error message: the first ECHO_CHARS characters, then '...' if cut. */
function echo(text: string): string {
  return text.length <= ECHO_CHARS ? text : `${text.slice(0, ECHO_CHARS)}...`;
}

const isReferenceSize = (value: unknown): value is ReferenceSize =>
  typeof value === 'string' && Object.hasOwn(APPLICABLE_LINES, value);

const rangeKey = (position: unknown, line: unknown) => `${String(position)} ${String(line)}`;

const R = '[2-9TJQKA]';
const PAIR = new RegExp(`^(${R})\\1(\\+)?$`);
const PAIR_SPAN = new RegExp(`^(${R})\\1-(${R})\\2$`);
const UNPAIRED = new RegExp(`^(${R})(${R})([so])(\\+)?$`);
const UNPAIRED_SPAN = new RegExp(`^(${R})(${R})([so])-\\1(${R})\\3$`);

const rankOf = (char: string | undefined) => RANK_CHARS.indexOf(char ?? '');
const pairClass = (rank: number) => RANK_CHARS.charAt(rank).repeat(2);
const unpairedClass = (high: number, low: number, suited: string) =>
  RANK_CHARS.charAt(high) + RANK_CHARS.charAt(low) + suited;

function span(from: number, to: number): number[] {
  const [low, high] = from <= to ? [from, to] : [to, from];
  return Array.from({ length: high - low + 1 }, (_, i) => low + i);
}

/** The classes one token names, or null if the token is not valid notation. */
function tokenClasses(token: string): HandClass[] | null {
  let m = PAIR.exec(token);
  if (m !== null) {
    const rank = rankOf(m[1]);
    return m[2] === '+' ? span(rank, 12).map(pairClass) : [pairClass(rank)];
  }
  m = PAIR_SPAN.exec(token);
  if (m !== null) return span(rankOf(m[1]), rankOf(m[2])).map(pairClass);
  m = UNPAIRED.exec(token);
  if (m !== null) {
    const [high, low, suited] = [rankOf(m[1]), rankOf(m[2]), m[3] as string];
    if (low >= high) return null;
    const lows = m[4] === '+' ? span(low, high - 1) : [low];
    return lows.map((l) => unpairedClass(high, l, suited));
  }
  m = UNPAIRED_SPAN.exec(token);
  if (m !== null) {
    const [high, a, b, suited] = [rankOf(m[1]), rankOf(m[2]), rankOf(m[4]), m[3] as string];
    if (a >= high || b >= high) return null;
    return span(a, b).map((l) => unpairedClass(high, l, suited));
  }
  return null;
}

/** Whitespace-separated hand-class notation. Throws RangeError(`Invalid range token "<echo>"`). */
export function parseHandRange(text: string): ReadonlySet<HandClass> {
  const tokens = text.split(/\s+/).filter((t) => t !== '');
  if (tokens.length === 0) throw new RangeError(`Invalid range token "${echo(text)}"`);
  const classes = new Set<HandClass>();
  for (const token of tokens) {
    const found = tokenClasses(token);
    if (found === null) throw new RangeError(`Invalid range token "${echo(token)}"`);
    for (const hc of found) classes.add(hc);
  }
  return classes;
}

/** Validates and compiles authored JSON. Throws RangeValidationError listing every problem. */
export function parseDefaultRanges(raw: unknown): DefaultRanges {
  if (!isRecord(raw) || raw.format !== FORMAT || raw.version !== 1) {
    throw new RangeValidationError([`Range file: expected format "${FORMAT}" version 1`]);
  }
  if (!isReferenceSize(raw.referenceSize)) {
    throw new RangeValidationError([
      `Range file: unknown reference size "${echo(String(raw.referenceSize))}"`,
    ]);
  }
  const referenceSize: ReferenceSize = raw.referenceSize;
  const label = `${referenceSize} ranges`;
  const applicable = APPLICABLE_LINES[referenceSize];
  const problems: string[] = [];
  if (wordCount(raw.justification) < FILE_WORDS) {
    problems.push(`${label}: missing plain-English justification (at least ${FILE_WORDS} words)`);
  }
  const found = new Map<string, DefaultRange>();
  for (const entry of Array.isArray(raw.ranges) ? (raw.ranges as unknown[]) : []) {
    const data = isRecord(entry) ? entry : {};
    const key = rangeKey(data.position, data.line);
    const id = applicable.find((r) => rangeKey(r.position, r.line) === key);
    if (id === undefined) {
      problems.push(`${label}: range ${echo(key)} does not apply at ${referenceSize}`);
      continue;
    }
    if (found.has(key)) {
      problems.push(`${label}: duplicate range ${key}`);
      continue;
    }
    if (wordCount(data.justification) < RANGE_WORDS) {
      problems.push(
        `${label}: ${key} is missing its plain-English justification (at least ${RANGE_WORDS} words)`,
      );
    }
    let classes: ReadonlySet<HandClass> = new Set();
    if (typeof data.hands !== 'string' || data.hands.trim() === '') {
      problems.push(`${label}: ${key} has no hands`);
    } else {
      try {
        classes = parseHandRange(data.hands);
      } catch (error) {
        problems.push(`${label}: ${key} has invalid hands: ${(error as Error).message}`);
      }
    }
    found.set(key, { ...id, justification: String(data.justification), classes });
  }
  for (const id of applicable) {
    const key = rangeKey(id.position, id.line);
    if (!found.has(key)) problems.push(`${label}: missing range ${key}`);
  }
  if (problems.length > 0) throw new RangeValidationError(problems);
  return {
    referenceSize,
    justification: raw.justification as string,
    ranges: applicable.map((r) => found.get(rangeKey(r.position, r.line)) as DefaultRange),
  };
}

/** The shipped default ranges, validated at import. */
export const HEADS_UP_RANGES: DefaultRanges = parseDefaultRanges(headsUp);
export const SIX_MAX_RANGES: DefaultRanges = parseDefaultRanges(sixMax);
export const FULL_RING_RANGES: DefaultRanges = parseDefaultRanges(fullRing);
export const DEFAULT_RANGES: Readonly<Record<ReferenceSize, DefaultRanges>> = {
  'heads-up': HEADS_UP_RANGES,
  '6-max': SIX_MAX_RANGES,
  'full-ring': FULL_RING_RANGES,
};

/** The default ranges for `dealtIn` seats: 2 heads-up, 6 six-max, 8-10 full ring; null for other sizes (Q-4). */
export function rangesFor(dealtIn: number): DefaultRanges | null {
  if (dealtIn === 2) return HEADS_UP_RANGES;
  if (dealtIn === 6) return SIX_MAX_RANGES;
  if (dealtIn >= 8 && dealtIn <= 10) return FULL_RING_RANGES;
  return null;
}

/** Throws RangeError('Ranges <size> have no range <position> <line>') if absent. */
export function defaultRange(
  ranges: DefaultRanges,
  position: Position,
  line: PreflopLine,
): DefaultRange {
  const range = ranges.ranges.find((r) => r.position === position && r.line === line);
  if (range === undefined) {
    throw new RangeError(`Ranges ${ranges.referenceSize} have no range ${position} ${line}`);
  }
  return range;
}

const HAND_ORDER_FORMAT = 'tlh-hand-order';

/** Validates the authored hand order (strongest first). Throws RangeValidationError listing every problem. */
export function parseHandOrder(raw: unknown): readonly HandClass[] {
  if (!isRecord(raw) || raw.format !== HAND_ORDER_FORMAT || raw.version !== 1) {
    throw new RangeValidationError([
      `Hand order: expected format "${HAND_ORDER_FORMAT}" version 1`,
    ]);
  }
  const problems: string[] = [];
  if (wordCount(raw.justification) < FILE_WORDS) {
    problems.push(`Hand order: missing plain-English justification (at least ${FILE_WORDS} words)`);
  }
  const order: HandClass[] = [];
  let previous: { readonly hc: HandClass; readonly pct: number } | null = null;
  for (const entry of Array.isArray(raw.hands) ? (raw.hands as unknown[]) : []) {
    if (
      !Array.isArray(entry) ||
      entry.length !== 2 ||
      typeof entry[0] !== 'string' ||
      typeof entry[1] !== 'number' ||
      !Number.isFinite(entry[1])
    ) {
      problems.push(`Hand order: entry ${order.length + 1} is not [class, equity]`);
      continue;
    }
    const [hc, pct] = entry as [string, number];
    if (!HAND_CLASSES.includes(hc)) {
      problems.push(`Hand order: unknown class "${echo(hc)}"`);
      continue;
    }
    if (order.includes(hc)) {
      problems.push(`Hand order: duplicate class ${hc}`);
      continue;
    }
    if (
      previous !== null &&
      (pct > previous.pct ||
        (pct === previous.pct && HAND_CLASSES.indexOf(hc) < HAND_CLASSES.indexOf(previous.hc)))
    ) {
      problems.push(`Hand order: ${hc} is out of order after ${previous.hc}`);
    }
    order.push(hc);
    previous = { hc, pct };
  }
  for (const hc of HAND_CLASSES) {
    if (!order.includes(hc)) problems.push(`Hand order: missing class ${hc}`);
  }
  // Grid order starts with AA, the strongest class.
  const aces = HAND_CLASSES[0] as HandClass;
  if (order[0] !== aces) problems.push(`Hand order: the first class must be ${aces}`);
  if (problems.length > 0) throw new RangeValidationError(problems);
  return order;
}

/** The 169 classes strongest first, from ranges/hand-order.json, validated at import. */
export const HAND_ORDER: readonly HandClass[] = parseHandOrder(handOrder);

export { OBSERVED_MIN_HANDS };
export const OBSERVED_FULL_HANDS = 100;
export const ALL_COMBOS = 1326;

/** A per-decision snapshot of one seat's session stats (REQ-036: part of the advice input). */
export interface ObservedOpponent {
  readonly seat: SeatNumber;
  /** Hands observed this session: integer ≥ 0. */
  readonly hands: number;
  /** Percent 0..100. */
  readonly vpip: number;
  /** Percent 0..100. */
  readonly pfr: number;
}

export interface OpponentBasis {
  readonly seat: SeatNumber;
  /** null = typical player. */
  readonly observedHands: number | null;
  /** 'typical player' | 'based on N hands of this opponent'. */
  readonly text: string;
}

/** Combos of `classes` as a percent of all 1326 starting combos. */
export function rangeWidthPct(classes: ReadonlySet<HandClass>): number {
  let combos = 0;
  for (const hc of classes) combos += comboCount(hc);
  return (combos / ALL_COMBOS) * 100;
}

/** d + (o − d) × min(n, 100) ÷ 100: the default width moved toward the observed one. */
export function scaledWidthPct(d: number, o: number, n: number): number {
  return d + ((o - d) * Math.min(n, OBSERVED_FULL_HANDS)) / OBSERVED_FULL_HANDS;
}

/** The shortest HAND_ORDER prefix whose combos reach `widthPct` % of 1326, at least AA (A-1). */
export function strongestClasses(widthPct: number): ReadonlySet<HandClass> {
  const target = (widthPct / 100) * ALL_COMBOS - 1e-9;
  const classes = new Set<HandClass>();
  let combos = 0;
  for (const hc of HAND_ORDER) {
    if (classes.size > 0 && combos >= target) break;
    classes.add(hc);
    combos += comboCount(hc);
  }
  return classes;
}

const LINE_BY_ACTION: Readonly<Record<'call' | 'raise', readonly PreflopLine[]>> = {
  call: ['limp', 'call-raise', 'call-three-bet'],
  raise: ['open-raise', 'three-bet', 'four-bet'],
};

/** The seat's preflop line: its last voluntary preflop action keyed by the raises before it (A-4). */
export function preflopLineOf(view: PlayerView, seat: SeatNumber): PreflopLine {
  const records = view.actions.filter(
    (a) => a.street === 'preflop' && a.type !== 'small-blind' && a.type !== 'big-blind',
  );
  let raises = 0;
  let line: PreflopLine | null = null;
  for (const record of records) {
    if (record.seat === seat) {
      if (record.type === 'check') line = 'check';
      else if (record.type === 'call' || record.type === 'raise') {
        line = LINE_BY_ACTION[record.type][Math.min(raises, 2)] as PreflopLine;
      }
    }
    if (record.type === 'raise') raises++;
  }
  if (line !== null) return line;
  // No voluntary action (all in on posting a blind): keyed as if the seat had called.
  if (raises === 0) {
    const bb = view.actions.find((a) => a.street === 'preflop' && a.type === 'big-blind');
    return bb?.seat === seat ? 'check' : 'limp';
  }
  return raises === 1 ? 'call-raise' : 'call-three-bet';
}

/** Every two-card combo with neither card in `dead`, ascending [low, high]. */
export function unseenCombos(dead: readonly Card[]): HoleCards[] {
  const combos: HoleCards[] = [];
  for (let a = 0; a < 52; a++) {
    if (dead.includes(a)) continue;
    for (let b = a + 1; b < 52; b++) {
      if (!dead.includes(b)) combos.push([a, b]);
    }
  }
  return combos;
}

/** The combos of `classes` with neither card in `dead`, ascending [low, high] by low*52+high. */
export function expandRange(classes: ReadonlySet<HandClass>, dead: readonly Card[]): HoleCards[] {
  return unseenCombos(dead).filter((combo) => classes.has(handClassOf(combo)));
}

/** 0 = high-card ... 8 = straight-flush (HAND_CATEGORIES is strongest first). */
const categoryIndex = (category: HandCategory) =>
  HAND_CATEGORIES.length - 1 - HAND_CATEGORIES.indexOf(category);

/** The board's own category; 3 or 4 cards from rank multiplicities only. */
function boardCategory(board: readonly Card[]): number {
  if (board.length === 5) return categoryIndex(handCategory(evaluate(board)));
  const counts = new Map<number, number>();
  for (const card of board) counts.set(cardRank(card), (counts.get(cardRank(card)) ?? 0) + 1);
  const sizes = [...counts.values()];
  let category: HandCategory = 'high-card';
  if (sizes.includes(4)) category = 'four-of-a-kind';
  else if (sizes.includes(3)) category = 'three-of-a-kind';
  else if (sizes.filter((n) => n === 2).length >= 2) category = 'two-pair';
  else if (sizes.includes(2)) category = 'one-pair';
  return categoryIndex(category);
}

const TWO_PAIR = categoryIndex('two-pair');

function hasFlushDraw(hole: HoleCards, board: readonly Card[]): boolean {
  const cards = [...hole, ...board];
  return hole.some((h) => cards.filter((c) => cardSuit(c) === cardSuit(h)).length >= 4);
}

/** Bit r set when rank r is present. */
function rankMask(cards: readonly Card[]): number {
  let mask = 0;
  for (const card of cards) mask |= 1 << cardRank(card);
  return mask;
}

/**
 * The lowest v of four consecutive ranks v..v+3, one from a hole card, that one more rank completes at either end;
 * -1 when none. The ace counts below the 2 only to complete 2345, so A234 and JQKA are not open-ended.
 */
function openEnderStart(hole: readonly Card[], board: readonly Card[]): number {
  const fromHole = rankMask(hole);
  const present = fromHole | rankMask(board);
  for (let v = 0; v + 4 <= 12; v++) {
    const run = 0b1111 << v;
    if ((present & run) === run && (fromHole & run) !== 0) return v;
  }
  return -1;
}

function hasOpenEnder(hole: HoleCards, board: readonly Card[]): boolean {
  return openEnderStart(hole, board) >= 0;
}

/** Five consecutive ranks present, the ace also below the 2. */
function hasStraight(cards: readonly Card[]): boolean {
  const present = rankMask(cards);
  // Bit 0 = ace low, bit r + 1 = rank r.
  const extended = (present << 1) | (present >> 12);
  for (let low = 0; low + 5 <= 14; low++) {
    if (((extended >> low) & 0b11111) === 0b11111) return true;
  }
  return false;
}

/**
 * Unseen cards that complete the hero's flush draw (exactly four cards of a suit, one from the hole) or open-ended
 * straight draw (as in hasOpenEnder), ascending, no duplicates; [] on a 5-card board, without such a draw, or when
 * the draw is already made. Pure; reads only its arguments.
 */
export function drawOuts(hole: readonly Card[], board: readonly Card[]): Card[] {
  if (board.length >= 5) return [];
  const cards = [...hole, ...board];
  const seen = new Set(cards);
  const outs = new Set<Card>();
  for (let suit = 0; suit < 4; suit++) {
    const ofSuit = cards.filter((c) => cardSuit(c) === suit).length;
    if (ofSuit === 4 && hole.some((h) => cardSuit(h) === suit)) {
      for (let rank = 0; rank < 13; rank++) outs.add(rank * 4 + suit);
    }
  }
  const v = openEnderStart(hole, board);
  if (v >= 0 && !hasStraight(cards)) {
    for (const rank of [v === 0 ? 12 : v - 1, v + 4]) {
      for (let suit = 0; suit < 4; suit++) outs.add(rank * 4 + suit);
    }
  }
  return [...outs].filter((card) => !seen.has(card)).sort((a, b) => a - b);
}

/** Strong / Pair / Draw / Air on a board of 3, 4 or 5 cards (spec §5). */
export function classifyCombo(hole: HoleCards, board: readonly Card[]): StrengthClass {
  const handCat = categoryIndex(handCategory(evaluate([...hole, ...board])));
  if (handCat >= TWO_PAIR && handCat > boardCategory(board)) return 'strong';
  const boardRanks = board.map(cardRank);
  const [a, b] = hole;
  if (
    cardRank(a) === cardRank(b) ||
    boardRanks.includes(cardRank(a)) ||
    boardRanks.includes(cardRank(b))
  ) {
    return 'pair';
  }
  if (hasFlushDraw(hole, board) || hasOpenEnder(hole, board)) return 'draw';
  return 'air';
}

/** The combos whose class on `board` is kept by `action`, in input order. */
export function narrowRange(
  range: readonly HoleCards[],
  board: readonly Card[],
  action: NarrowingAction,
): HoleCards[] {
  const keep = KEEP[action];
  return range.filter((combo) => keep.includes(classifyCombo(combo, board)));
}

/** Classes an opponent continues with against a bet or raise: KEEP.call ∪ KEEP.raise (REQ-033.6). */
export const CONTINUE_CLASSES: readonly StrengthClass[] = ['strong', 'pair', 'draw'];

// Per-combo class for the last board seen (0 unknown, 1 continues, 2 air), keyed by low * 52 + high.
const continueMemo = new Int8Array(52 * 52);
let memoBoard = '';

/** Combos of `range` whose class on `board` is in CONTINUE_CLASSES, input order; `range` itself if none (A-2). */
export function callingRange(
  range: readonly HoleCards[],
  board: readonly Card[],
): readonly HoleCards[] {
  const boardKey = board.join(',');
  if (boardKey !== memoBoard) {
    continueMemo.fill(0);
    memoBoard = boardKey;
  }
  const calling = range.filter((combo) => {
    const [a, b] = combo;
    const key = a < b ? a * 52 + b : b * 52 + a;
    let mark = continueMemo[key] as number;
    if (mark === 0) {
      mark = CONTINUE_CLASSES.includes(classifyCombo(combo, board)) ? 1 : 2;
      continueMemo[key] = mark;
    }
    return mark === 1;
  });
  return calling.length > 0 ? calling : range;
}

export interface OpponentRange {
  readonly seat: SeatNumber;
  /** null when the table size has no default ranges (rangesFor). */
  readonly position: Position | null;
  /** null when the table size has no default ranges (rangesFor). */
  readonly line: PreflopLine | null;
  /** The expanded default range, or every unseen combo (A-3). */
  readonly start: readonly HoleCards[];
  /** After postflop narrowing. */
  readonly combos: readonly HoleCards[];
  /** Whether the start range rests on this opponent's observed stats. */
  readonly basis: OpponentBasis;
  /** Width % of the classes `start` was built from; null without a default range. */
  readonly widthPct: number | null;
}

const AGGRESSION: readonly NarrowingAction[] = ['raise', 'bet', 'call', 'check'];
const STREET_BOARDS = [
  ['flop', 3],
  ['turn', 4],
  ['river', 5],
] as const;

const OBSERVED_LINE_STAT: Readonly<Record<PreflopLine, 'vpip' | 'pfr' | null>> = {
  check: null,
  limp: 'vpip',
  'open-raise': 'pfr',
  'call-raise': 'vpip',
  'three-bet': 'pfr',
  'call-three-bet': 'vpip',
  'four-bet': 'pfr',
};

const inPercent = (value: number) => Number.isFinite(value) && value >= 0 && value <= 100;

/** Highest seat number at a table. */
const MAX_SEAT = 10;

/** The snapshot keyed by seat. Throws RangeError on a non-object entry, a seat that is not a whole number
 *  1..MAX_SEAT, invalid numbers or a repeated seat. */
function observedBySeat(observed: readonly ObservedOpponent[]): Map<SeatNumber, ObservedOpponent> {
  const bySeat = new Map<SeatNumber, ObservedOpponent>();
  for (let i = 0; i < observed.length; i++) {
    const entry: unknown = observed[i];
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      throw new RangeError(`Invalid observed stats entry ${i}`);
    }
    const { seat, hands, vpip, pfr } = entry as ObservedOpponent;
    if (!Number.isSafeInteger(seat) || seat < 1 || seat > MAX_SEAT) {
      throw new RangeError(`Invalid observed stats seat ${String(seat)}`);
    }
    if (!Number.isInteger(hands) || hands < 0 || !inPercent(vpip) || !inPercent(pfr)) {
      throw new RangeError(`Invalid observed stats for seat ${seat}`);
    }
    if (bySeat.has(seat)) throw new RangeError(`Observed stats list seat ${seat} twice`);
    bySeat.set(seat, entry as ObservedOpponent);
  }
  return bySeat;
}

/**
 * One entry per live opponent (not folded, not the viewer), ascending seat. Reads only `view` and `observed`.
 * From OBSERVED_MIN_HANDS observed hands, a default raising or calling range is rebuilt at the scaled width.
 * A non-array `observed` is ignored; array entries are validated (RangeError).
 */
export function estimateOpponentRanges(
  view: PlayerView,
  observed: readonly ObservedOpponent[] = [],
): readonly OpponentRange[] {
  if (view.board.length < 3 || view.board.length > 5) {
    throw new RangeError(`Range estimation needs a flop, turn or river view, got ${view.street}`);
  }
  // A non-array snapshot (an untyped caller) is ignored: every opponent gets the default range.
  const bySeat = observedBySeat(Array.isArray(observed) ? observed : []);
  const dead = [...view.holeCards, ...view.board];
  const ranges = rangesFor(view.players.length);
  return view.players
    .filter((p) => p.seat !== view.seat && !p.folded)
    .map(({ seat }) => {
      let position: Position | null = null;
      let line: PreflopLine | null = null;
      let start: HoleCards[] = [];
      let widthPct: number | null = null;
      let basis: OpponentBasis = { seat, observedHands: null, text: basisText(null) };
      if (ranges !== null) {
        position = positionOf({ ...view, seat }, ranges.referenceSize);
        line = preflopLineOf(view, seat);
        let classes = defaultRange(ranges, position, line).classes;
        widthPct = rangeWidthPct(classes);
        const obs = bySeat.get(seat);
        const stat = OBSERVED_LINE_STAT[line];
        if (obs !== undefined && stat !== null && obs.hands >= OBSERVED_MIN_HANDS) {
          widthPct = scaledWidthPct(widthPct, obs[stat], obs.hands);
          classes = strongestClasses(widthPct);
          basis = { seat, observedHands: obs.hands, text: basisText(obs.hands) };
        }
        start = expandRange(classes, dead);
      }
      if (start.length === 0) start = unseenCombos(dead);
      let combos = start;
      for (const [street, size] of STREET_BOARDS) {
        if (view.board.length < size) break;
        const types = new Set(
          view.actions.filter((a) => a.street === street && a.seat === seat).map((a) => a.type),
        );
        const action = AGGRESSION.find((t) => types.has(t));
        if (action === undefined) continue;
        const narrowed = narrowRange(combos, view.board.slice(0, size), action);
        if (narrowed.length > 0) combos = narrowed;
      }
      return { seat, position, line, start, combos, basis, widthPct };
    });
}
