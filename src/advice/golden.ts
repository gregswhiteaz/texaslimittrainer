import { parseCards, type Card } from '../engine/cards';
import { applyAction, createHand, type HandState, type SeatNumber } from '../engine/hand';
import { playerView, type PlayerView } from '../engine/player-view';
import { CONCEPTS, type ConceptId } from './explanations';
import {
  gradeDecision,
  GRADE_LABELS,
  GRADE_RULE_IDS,
  type ActionType,
  type EquityGradeInput,
  type Grade,
  type GradeInput,
  type GradeRuleId,
} from './grade';
import { handClassOf, type HandClass } from './hand-class';
import {
  chartSpotOf,
  positionOf,
  PREFLOP_CHARTS,
  referenceSizeOf,
  situationOf,
  type PreflopAdvice,
} from './preflop';
import {
  chartCell,
  type Position,
  type PreflopChart,
  type ReferenceSize,
  type Situation,
} from './preflop-chart';
import { recommendPostflop, type PostflopAdvice, type PostflopRecommendation } from './postflop';
import type { ObservedOpponent } from './ranges';
import { recommend } from './recommend';

// Golden-spot suite: preflop (TASK-7.11), postflop and graded examples (TASK-7.14). See docs/advice/golden-spots.md.

export const GOLDEN_FORMAT = 'tlh-golden-spots';
export const GOLDEN_STAKES = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 } as const;
export const GOLDEN_STACK = 160;

export type GoldenAction = PreflopAdvice;

export interface GoldenSpot {
  readonly id: string;
  /** Built by the engine: hero = view.seat = view.toAct, street 'preflop'. */
  readonly view: PlayerView;
  readonly referenceSize: ReferenceSize;
  readonly position: Position;
  readonly situation: Situation;
  readonly handClass: HandClass;
  /** {} when absent. */
  readonly opponentStats: Readonly<Record<string, Readonly<Record<string, number>>>>;
  readonly action: GoldenAction;
  readonly alternative: GoldenAction | null;
  readonly justification: string;
}

export type GoldenStreet = 'flop' | 'turn' | 'river';

export interface PostflopGoldenSpot {
  readonly id: string;
  /** Built by the engine: hero = view.seat = view.toAct, view.street = street. */
  readonly view: PlayerView;
  readonly street: GoldenStreet;
  readonly position: Position;
  /** From opponentStats; [] when absent. */
  readonly observed: readonly ObservedOpponent[];
  readonly action: PostflopAdvice;
  readonly alternative: PostflopAdvice | null;
  readonly justification: string;
}

/** The numbers the clear-cut rule reads; PostflopRecommendation is assignable. */
export type GoldenNumbers = Pick<
  PostflopRecommendation,
  'action' | 'equityPct' | 'requiredEquityPct' | 'equityVsCallingRangePct'
>;

export const GRADED_FORMAT = 'tlh-graded-examples';

export interface GradedExample {
  readonly id: string;
  /** Preflop when the example has no board. */
  readonly view: PlayerView;
  readonly observed: readonly ObservedOpponent[];
  readonly userAction: ActionType;
  readonly grade: Grade;
  readonly ruleId: GradeRuleId;
  readonly marginPts: number | null;
  readonly justification: string;
}

export class GoldenSpotValidationError extends Error {
  readonly problems: readonly string[];

  constructor(problems: readonly string[]) {
    super('Invalid golden spots:\n- ' + problems.join('\n- '));
    this.name = 'GoldenSpotValidationError';
    this.problems = problems;
  }
}

const VERSION = 1;
const ID_CHARS = 60;
const JUSTIFICATION_WORDS = 15;
const MAX_SENTENCES = 3;
const ECHO_CHARS = 20;
const ACTIONS: readonly GoldenAction[] = ['fold', 'check', 'call', 'raise'];
const POSTFLOP_ACTIONS: readonly PostflopAdvice[] = ['fold', 'check', 'call', 'bet', 'raise'];
const STREETS: readonly (GoldenStreet | 'preflop')[] = ['preflop', 'flop', 'turn', 'river'];
const GRADES: readonly Grade[] = ['correct', 'minor', 'major'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function wordCount(text: unknown): number {
  return typeof text === 'string' ? (text.match(/\p{L}+/gu) ?? []).length : 0;
}

/**
 * Untrusted value for an error message: strings and numbers as text, other values as <array>,
 * <null>, <object>, <boolean>; the first ECHO_CHARS characters, then '...' if cut.
 */
function echo(value: unknown): string {
  const text =
    typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : Array.isArray(value)
        ? '<array>'
        : value === null
          ? '<null>'
          : `<${typeof value}>`;
  return text.length <= ECHO_CHARS ? text : `${text.slice(0, ECHO_CHARS)}...`;
}

/** text.trim() split on /(?<=[.!?])\s+/; [] for empty text. */
export function sentencesOf(text: string): string[] {
  const trimmed = text.trim();
  return trimmed === '' ? [] : trimmed.split(/(?<=[.!?])\s+/);
}

/** Ids of CONCEPTS with any term matched whole-word, case-insensitive, in CONCEPTS order. */
export function namedConcepts(text: string): ConceptId[] {
  return CONCEPTS.filter((c) => new RegExp(`\\b(${c.terms.join('|')})\\b`, 'i').test(text)).map(
    (c) => c.id,
  );
}

/**
 * Seats 1..n, button 1, with `hero` dealt `cards` (seat 2 is dealt first, the button last) and `board` at the
 * flop, turn and river deck indexes (after the 2n hole cards: burn, flop, burn, turn, burn, river).
 */
function dealtHand(
  n: number,
  hero: SeatNumber,
  cards: readonly [Card, Card],
  board: readonly Card[],
): HandState {
  const fixed = new Map<number, Card>();
  const index = hero === 1 ? n - 1 : hero - 2;
  fixed.set(index, cards[0]);
  fixed.set(index + n, cards[1]);
  [2 * n + 1, 2 * n + 2, 2 * n + 3, 2 * n + 5, 2 * n + 7].forEach((slot, i) => {
    if (i < board.length) fixed.set(slot, board[i] as Card);
  });
  const rest = Array.from({ length: 52 }, (_, i) => i).filter(
    (card) => !cards.includes(card) && !board.includes(card),
  );
  const deck = Array.from({ length: 52 }, (_, slot) => fixed.get(slot) ?? (rest.shift() as Card));
  return createHand({
    stakes: GOLDEN_STAKES,
    seats: Array.from({ length: n }, (_, i) => ({ seat: i + 1, stack: GOLDEN_STACK })),
    button: 1,
    deck,
  });
}

/** Applies each step as the to-act seat's legal action of that type; the problem text on failure. */
function replay(
  state: HandState,
  steps: readonly unknown[],
  street: GoldenStreet | 'preflop',
): HandState | string {
  for (const [k, step] of steps.entries()) {
    const action = state.toAct === null ? undefined : legalOf(state, step);
    const result = action === undefined ? undefined : applyAction(state, action);
    if (result === undefined || !result.ok) return `step ${k + 1} "${echo(step)}" is not legal`;
    state = result.state;
  }
  if (state.street !== street || state.toAct === null) {
    return `the steps do not reach a ${street} decision`;
  }
  return state;
}

function legalOf(state: HandState, type: unknown) {
  return playerView(state, state.toAct as SeatNumber).legalActions.find((a) => a.type === type);
}

function parseHoleCards(raw: unknown): [Card, Card] | null {
  if (typeof raw !== 'string') return null;
  try {
    const cards = parseCards(raw);
    return cards.length === 2 && cards[0] !== cards[1] ? (cards as [Card, Card]) : null;
  } catch {
    return null;
  }
}

/** 3 to 5 different cards, none in `hole`; null otherwise. */
function parseBoard(raw: unknown, hole: readonly Card[]): Card[] | null {
  if (typeof raw !== 'string') return null;
  try {
    const cards = parseCards(raw);
    const distinct = new Set([...cards, ...hole]).size === cards.length + hole.length;
    return cards.length >= 3 && cards.length <= 5 && distinct ? cards : null;
  } catch {
    return null;
  }
}

/**
 * The hero's view after the steps, or the reason it can't be built. With `postflop`, `data.board` is dealt and
 * the steps must reach a decision on the board's street.
 */
function buildView(data: Record<string, unknown>, postflop = false): PlayerView | string {
  const n = data.seats;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 2 || n > 10) {
    return 'seats must be 2 to 10';
  }
  const cards = parseHoleCards(data.holeCards);
  if (cards === null) return 'holeCards must be two different cards';
  const board = postflop ? parseBoard(data.board, cards) : [];
  if (board === null) return 'board must be 3 to 5 different cards not in holeCards';
  const street = streetOfBoard(board.length);
  if (!Array.isArray(data.before)) return `the steps do not reach a ${street} decision`;
  const steps: readonly unknown[] = data.before;
  // The steps don't depend on cards: find the hero first, then deal it the hole cards and replay.
  const probe = replay(dealtHand(n, 1, cards, board), steps, street);
  if (typeof probe === 'string') return probe;
  const hero = probe.toAct as SeatNumber;
  return playerView(replay(dealtHand(n, hero, cards, board), steps, street) as HandState, hero);
}

/** 0 → preflop, 3 → flop, 4 → turn, 5 → river. */
function streetOfBoard(length: number): GoldenStreet | 'preflop' {
  return STREETS[Math.max(0, length - 2)] as GoldenStreet | 'preflop';
}

function isStats(raw: unknown): boolean {
  return (
    isRecord(raw) &&
    Object.entries(raw).every(
      ([seat, stats]) =>
        /^([1-9]|10)$/.test(seat) &&
        isRecord(stats) &&
        Object.values(stats).every((v) => typeof v === 'number' && Number.isFinite(v)),
    )
  );
}

function checkJustification(justification: unknown, where: string, problems: string[]): void {
  if (typeof justification !== 'string' || wordCount(justification) < JUSTIFICATION_WORDS) {
    problems.push(
      `${where}: missing written justification (at least ${JUSTIFICATION_WORDS} words)`,
    );
    return;
  }
  if (sentencesOf(justification).length > MAX_SENTENCES) {
    problems.push(`${where}: justification has more than three sentences`);
  }
  if (namedConcepts(justification).length === 0) {
    problems.push(`${where}: justification names no listed concept`);
  }
}

const inPercent = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100;

/** A-2 opponentStats (seat → { hands, vpip, pfr }, nothing else) as ObservedOpponent[]; null when invalid. */
function parseObserved(raw: unknown): ObservedOpponent[] | null {
  if (raw === undefined || raw === null) return [];
  if (!isRecord(raw)) return null;
  const observed: ObservedOpponent[] = [];
  for (const [seat, stats] of Object.entries(raw)) {
    if (!/^([1-9]|10)$/.test(seat) || !isRecord(stats)) return null;
    const { hands, vpip, pfr, ...other } = stats;
    if (
      Object.keys(other).length > 0 ||
      typeof hands !== 'number' ||
      !Number.isInteger(hands) ||
      hands < 0 ||
      !inPercent(vpip) ||
      !inPercent(pfr)
    ) {
      return null;
    }
    observed.push({
      seat: Number(seat) as SeatNumber,
      hands,
      vpip: vpip as number,
      pfr: pfr as number,
    });
  }
  return observed;
}

/**
 * Shared header, id and duplicate handling for a spot or example file: `parse` runs once per entry with its
 * name (id, or #n when the id is missing) and pushes its own problems. Throws when there is any problem.
 */
function parseEntries<T>(
  raw: unknown,
  file: { label: string; format: string; key: string },
  parse: (data: Record<string, unknown>, name: string, problems: string[]) => T | null,
): T[] {
  if (!isRecord(raw) || raw.format !== file.format || raw.version !== VERSION) {
    throw new GoldenSpotValidationError([
      `${file.label} file: expected format "${file.format}" version ${VERSION}`,
    ]);
  }
  const problems: string[] = [];
  const seen = new Set<string>();
  const parsed: T[] = [];
  const list = raw[file.key];
  const entries: readonly unknown[] = Array.isArray(list) ? list : [];
  entries.forEach((entry, i) => {
    const data = isRecord(entry) ? entry : {};
    const { id } = data;
    let name: string;
    if (typeof id !== 'string' || id === '' || id.length > ID_CHARS) {
      name = `#${i + 1}`;
      problems.push(`${file.label} ${name}: missing id`);
    } else {
      name = id;
      if (seen.has(id)) problems.push(`${file.label} ${id}: duplicate id`);
      seen.add(id);
    }
    const item = parse(data, name, problems);
    if (item !== null) parsed.push(item);
  });
  if (problems.length > 0) throw new GoldenSpotValidationError(problems);
  return parsed;
}

/**
 * The entry's view (postflop: on the board's street), or null after pushing the problem. Also checks that the
 * `street` field matches the built view (absent for a preflop entry).
 */
function viewOf(
  data: Record<string, unknown>,
  postflop: boolean,
  where: string,
  problems: string[],
): PlayerView | null {
  const built = buildView(data, postflop);
  if (typeof built === 'string') {
    problems.push(`${where}: missing player view (${built})`);
    return null;
  }
  const street = postflop ? data.street : (data.street ?? 'preflop');
  if (street !== built.street) {
    problems.push(
      `${where}: street ${echo(data.street)} does not match the board (${built.street})`,
    );
  }
  return built;
}

/** The recommended action and alternative checks shared by both spot kinds. */
function checkActions(
  data: Record<string, unknown>,
  view: PlayerView | null,
  allowed: readonly string[],
  where: string,
  problems: string[],
): { action: unknown; alternative: unknown } {
  const valid = (a: unknown) =>
    allowed.includes(a as string) && (view === null || view.legalActions.some((l) => l.type === a));
  const { action } = data;
  if (action === undefined || action === null) {
    problems.push(`${where}: missing recommended action`);
  } else if (!valid(action)) {
    problems.push(`${where}: recommended action "${echo(action)}" is not legal in the view`);
  }

  const alternative = data.alternative ?? null;
  if (Array.isArray(alternative)) {
    problems.push(`${where}: more than one acceptable alternative`);
  } else if (alternative !== null && !valid(alternative)) {
    problems.push(`${where}: invalid alternative "${echo(alternative)}"`);
  } else if (alternative !== null && alternative === action) {
    problems.push(`${where}: alternative repeats the recommended action`);
  }
  return { action, alternative };
}

function parseSpot(
  data: Record<string, unknown>,
  name: string,
  charts: Readonly<Record<ReferenceSize, PreflopChart>>,
  problems: string[],
): GoldenSpot | null {
  const before = problems.length;
  const where = `Golden spot ${name}`;
  const built = buildView(data);
  const view = typeof built === 'string' ? null : built;
  if (typeof built === 'string') problems.push(`${where}: missing player view (${built})`);

  const size = view === null ? null : referenceSizeOf(view.players.length);
  const position = view === null ? null : positionOf(view);
  const situation = view === null ? null : situationOf(view);
  if (view !== null && data.position !== position) {
    problems.push(
      `${where}: position ${echo(data.position)} does not match the view (${position})`,
    );
  }
  if (view !== null && data.situation !== situation) {
    problems.push(
      `${where}: situation ${echo(data.situation)} does not match the view (${situation})`,
    );
  }

  const { action, alternative } = checkActions(data, view, ACTIONS, where, problems);

  const { justification } = data;
  checkJustification(justification, where, problems);

  const opponentStats = data.opponentStats ?? {};
  if (!isStats(opponentStats)) problems.push(`${where}: invalid opponent stats`);

  if (view !== null && size !== null) {
    const spot = chartSpotOf(view, size);
    const hc = handClassOf(view.holeCards);
    if (chartCell(charts[size], spot.position, spot.situation, hc).borderline) {
      problems.push(
        `${where}: not clear-cut, chart cell ${size} ${spot.position} ${spot.situation} ${hc} is borderline`,
      );
    }
  }

  if (problems.length > before || view === null) return null;
  return {
    id: name,
    view,
    referenceSize: size as ReferenceSize,
    position: position as Position,
    situation: situation as Situation,
    handClass: handClassOf(view.holeCards),
    opponentStats: opponentStats as GoldenSpot['opponentStats'],
    action: action as GoldenAction,
    alternative: alternative as GoldenAction | null,
    justification: justification as string,
  };
}

const SPOT_FILE = { label: 'Golden spot', format: GOLDEN_FORMAT, key: 'spots' };

/** Validates every spot; throws GoldenSpotValidationError listing every problem. Returns spots in file order. */
export function parseGoldenSpots(
  raw: unknown,
  charts: Readonly<Record<ReferenceSize, PreflopChart>> = PREFLOP_CHARTS,
): GoldenSpot[] {
  return parseEntries(raw, SPOT_FILE, (data, name, problems) =>
    parseSpot(data, name, charts, problems),
  );
}

const adviceMemo = new WeakMap<
  PlayerView,
  { readonly observed: readonly ObservedOpponent[]; readonly rec: PostflopRecommendation }
>();

/**
 * The advice the learner sees (A-1): recommendPostflop(view, { opponentRanges: 'actions', observedOpponents }).
 * Memoised per view object and `observed` reference, so validation and the runner share one computation (D-3).
 */
export function goldenPostflopAdvice(
  view: PlayerView,
  observed: readonly ObservedOpponent[],
): PostflopRecommendation {
  const hit = adviceMemo.get(view);
  if (hit !== undefined && hit.observed === observed) return hit.rec;
  const rec = recommendPostflop(view, { opponentRanges: 'actions', observedOpponents: observed });
  adviceMemo.set(view, { observed, rec });
  return rec;
}

/**
 * The clear-cut rule (D-2): every legal action other than the recorded action and alternative must grade as a
 * Major error against the recorded action with the engine's numbers. Returns one problem per action that doesn't.
 */
function clearCutProblems(
  view: PlayerView,
  action: PostflopAdvice,
  alternative: PostflopAdvice | null,
  numbers: GoldenNumbers,
): string[] {
  const input: EquityGradeInput = {
    basis: 'equity',
    action,
    alternative,
    equityPct: numbers.equityPct,
    requiredEquityPct: numbers.requiredEquityPct,
    equityVsCallingRangePct: numbers.equityVsCallingRangePct,
  };
  const problems: string[] = [];
  for (const { type } of view.legalActions) {
    if (type === action || type === alternative) continue;
    const g = gradeDecision(input, type);
    if (g.grade === 'major') continue;
    const needs = g.ruleId === 'call-fold-margin' ? 10 : 15;
    problems.push(
      `not clear-cut, ${type} would be a ${GRADE_LABELS[g.grade]} (${g.ruleId} ${g.marginPts} points; clear-cut needs ${needs})`,
    );
  }
  return problems;
}

function parsePostflopSpot(
  data: Record<string, unknown>,
  name: string,
  advise: (view: PlayerView, observed: readonly ObservedOpponent[]) => GoldenNumbers,
  problems: string[],
): PostflopGoldenSpot | null {
  const before = problems.length;
  const where = `Golden spot ${name}`;
  const view = viewOf(data, true, where, problems);
  const position = view === null ? null : positionOf(view);
  if (view !== null && data.position !== position) {
    problems.push(
      `${where}: position ${echo(data.position)} does not match the view (${position})`,
    );
  }
  if ('situation' in data) problems.push(`${where}: situation is a preflop field`);
  const { action, alternative } = checkActions(data, view, POSTFLOP_ACTIONS, where, problems);
  checkJustification(data.justification, where, problems);
  const observed = parseObserved(data.opponentStats);
  if (observed === null) problems.push(`${where}: invalid opponent stats`);
  if (problems.length > before || view === null) return null;

  const spot: PostflopGoldenSpot = {
    id: name,
    view,
    street: view.street as GoldenStreet,
    position: position as Position,
    observed: observed as ObservedOpponent[],
    action: action as PostflopAdvice,
    alternative: alternative as PostflopAdvice | null,
    justification: data.justification as string,
  };
  let numbers: GoldenNumbers;
  try {
    numbers = advise(view, spot.observed);
  } catch (error) {
    problems.push(`${where}: advice failed (${(error as Error).message})`);
    return null;
  }
  const unclear = clearCutProblems(view, spot.action, spot.alternative, numbers);
  for (const problem of unclear) problems.push(`${where}: ${problem}`);
  return unclear.length > 0 ? null : spot;
}

/**
 * Validates every postflop spot, including the clear-cut rule measured with `advise`; throws
 * GoldenSpotValidationError listing every problem. Returns spots in file order.
 */
export function parsePostflopGoldenSpots(
  raw: unknown,
  advise: (
    view: PlayerView,
    observed: readonly ObservedOpponent[],
  ) => GoldenNumbers = goldenPostflopAdvice,
): PostflopGoldenSpot[] {
  return parseEntries(raw, SPOT_FILE, (data, name, problems) =>
    parsePostflopSpot(data, name, advise, problems),
  );
}

/**
 * null when the advice agrees; otherwise the failure message. Default advice: recommend(view) preflop,
 * goldenPostflopAdvice(view, spot.observed) postflop.
 */
export function checkGoldenSpot(
  spot: GoldenSpot | PostflopGoldenSpot,
  advise?: (view: PlayerView) => { readonly action: string },
): string | null {
  let actual: string;
  if (advise !== undefined) actual = advise(spot.view).action;
  else if ('observed' in spot) actual = goldenPostflopAdvice(spot.view, spot.observed).action;
  else actual = recommend(spot.view).action;
  if (actual === spot.action || actual === spot.alternative) return null;
  const expected =
    spot.alternative === null ? spot.action : `${spot.action} or ${spot.alternative}`;
  return `Golden spot ${spot.id}: expected ${expected}, got ${actual}`;
}

function parseExample(
  data: Record<string, unknown>,
  name: string,
  problems: string[],
): GradedExample | null {
  const before = problems.length;
  const where = `Graded example ${name}`;
  const view = viewOf(data, data.board !== undefined, where, problems);
  const { userAction, grade, ruleId, marginPts } = data;
  if (
    !POSTFLOP_ACTIONS.includes(userAction as ActionType) ||
    (view !== null && !view.legalActions.some((l) => l.type === userAction))
  ) {
    problems.push(`${where}: invalid user action "${echo(userAction)}"`);
  }
  if (!GRADES.includes(grade as Grade)) problems.push(`${where}: invalid grade "${echo(grade)}"`);
  if (!GRADE_RULE_IDS.includes(ruleId as GradeRuleId)) {
    problems.push(`${where}: invalid rule id "${echo(ruleId)}"`);
  }
  const oneDecimal =
    typeof marginPts === 'number' &&
    Number.isFinite(marginPts) &&
    Math.round(marginPts * 10) / 10 === marginPts;
  if (marginPts !== null && !oneDecimal) {
    problems.push(`${where}: invalid margin "${echo(marginPts)}"`);
  }
  checkJustification(data.justification, where, problems);
  const observed = parseObserved(data.opponentStats);
  if (observed === null) problems.push(`${where}: invalid opponent stats`);
  if (problems.length > before || view === null) return null;
  return {
    id: name,
    view,
    observed: observed as ObservedOpponent[],
    userAction: userAction as ActionType,
    grade: grade as Grade,
    ruleId: ruleId as GradeRuleId,
    marginPts: marginPts as number | null,
    justification: data.justification as string,
  };
}

/** Validates every graded example; throws GoldenSpotValidationError listing every problem. */
export function parseGradedExamples(raw: unknown): GradedExample[] {
  return parseEntries(
    raw,
    { label: 'Graded example', format: GRADED_FORMAT, key: 'examples' },
    parseExample,
  );
}

/**
 * null when gradeDecision(advice, userAction) matches the recorded grade, rule id and margin exactly; otherwise
 * the failure message. Default advice: recommend(view) preflop, goldenPostflopAdvice(view, observed) postflop.
 */
export function checkGradedExample(
  example: GradedExample,
  advise: (view: PlayerView) => GradeInput = (view) =>
    view.street === 'preflop' ? recommend(view) : goldenPostflopAdvice(view, example.observed),
): string | null {
  const got = gradeDecision(advise(example.view), example.userAction);
  if (
    got.grade === example.grade &&
    got.ruleId === example.ruleId &&
    got.marginPts === example.marginPts
  ) {
    return null;
  }
  const at = (margin: number | null) => (margin === null ? 'no margin' : String(margin));
  return (
    `Graded example ${example.id}: expected ${example.grade} by ${example.ruleId} at ` +
    `${at(example.marginPts)}, got ${got.grade} by ${got.ruleId} at ${at(got.marginPts)}`
  );
}
