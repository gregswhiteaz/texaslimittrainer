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
import { handClassOf, type HandClass } from './hand-class';
import { positionOf } from './preflop';
import type { Position, ReferenceSize } from './preflop-chart';
// The JSON import stays last, like the chart's.
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

const ALL_POSITIONS: readonly Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
const LINE_POSITIONS: Readonly<Record<PreflopLine, readonly Position[]>> = {
  check: ['BB'],
  limp: ['UTG', 'HJ', 'CO', 'BTN', 'SB'],
  'open-raise': ALL_POSITIONS,
  'call-raise': ALL_POSITIONS,
  'three-bet': ALL_POSITIONS,
  'call-three-bet': ALL_POSITIONS,
  'four-bet': ALL_POSITIONS,
};

/** Lines each 6-max position can take (36 pairs). */
export const APPLICABLE_LINES: Readonly<Record<'6-max', readonly RangeId[]>> = {
  '6-max': PREFLOP_LINES.flatMap((line) =>
    LINE_POSITIONS[line].map((position) => ({ position, line })),
  ),
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
  if (raw.referenceSize !== '6-max') {
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

/** The shipped 6-max default ranges, validated at import. */
export const SIX_MAX_RANGES: DefaultRanges = parseDefaultRanges(sixMax);

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
  /** null when not exactly 6 seats are dealt in (A-3). */
  readonly position: Position | null;
  /** null when not exactly 6 seats are dealt in. */
  readonly line: PreflopLine | null;
  /** The expanded default range, or every unseen combo (A-3). */
  readonly start: readonly HoleCards[];
  /** After postflop narrowing. */
  readonly combos: readonly HoleCards[];
}

const AGGRESSION: readonly NarrowingAction[] = ['raise', 'bet', 'call', 'check'];
const STREET_BOARDS = [
  ['flop', 3],
  ['turn', 4],
  ['river', 5],
] as const;

/** One entry per live opponent (not folded, not the viewer), ascending seat. Reads only `view`. */
export function estimateOpponentRanges(view: PlayerView): readonly OpponentRange[] {
  if (view.board.length < 3 || view.board.length > 5) {
    throw new RangeError(`Range estimation needs a flop, turn or river view, got ${view.street}`);
  }
  const dead = [...view.holeCards, ...view.board];
  const sixMax = view.players.length === 6;
  return view.players
    .filter((p) => p.seat !== view.seat && !p.folded)
    .map(({ seat }) => {
      let position: Position | null = null;
      let line: PreflopLine | null = null;
      let start: HoleCards[] = [];
      if (sixMax) {
        position = positionOf({ ...view, seat });
        line = preflopLineOf(view, seat);
        start = expandRange(defaultRange(SIX_MAX_RANGES, position, line).classes, dead);
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
      return { seat, position, line, start, combos };
    });
}
