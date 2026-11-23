import { parseCards, type Card } from '../engine/cards';
import { applyAction, createHand, type HandState, type SeatNumber } from '../engine/hand';
import { playerView, type PlayerView } from '../engine/player-view';
import { CONCEPTS, type ConceptId } from './explanations';
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
import { recommend } from './recommend';

// Golden-spot suite, part 1 (TASK-7.11). See docs/advice/golden-spots.md.

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

const isAction = (value: unknown): value is GoldenAction => ACTIONS.includes(value as GoldenAction);

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

/** Seats 1..n, button 1, with `hero` dealt `cards` (seat 2 is dealt first, the button last). */
function dealtHand(n: number, hero: SeatNumber, cards: readonly [Card, Card]): HandState {
  const deck = Array.from({ length: 52 }, (_, i) => i).filter((card) => !cards.includes(card));
  const index = hero === 1 ? n - 1 : hero - 2;
  deck.splice(index, 0, cards[0]);
  deck.splice(index + n, 0, cards[1]);
  return createHand({
    stakes: GOLDEN_STAKES,
    seats: Array.from({ length: n }, (_, i) => ({ seat: i + 1, stack: GOLDEN_STACK })),
    button: 1,
    deck,
  });
}

/** Applies each step as the to-act seat's legal action of that type; the problem text on failure. */
function replay(state: HandState, steps: readonly unknown[]): HandState | string {
  for (const [k, step] of steps.entries()) {
    const action = state.toAct === null ? undefined : legalOf(state, step);
    const result = action === undefined ? undefined : applyAction(state, action);
    if (result === undefined || !result.ok) return `step ${k + 1} "${echo(step)}" is not legal`;
    state = result.state;
  }
  if (state.street !== 'preflop' || state.toAct === null) {
    return 'the steps do not reach a preflop decision';
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

/** The hero's view after the steps, or the reason it can't be built. */
function buildView(data: Record<string, unknown>): PlayerView | string {
  const n = data.seats;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 2 || n > 10) {
    return 'seats must be 2 to 10';
  }
  const cards = parseHoleCards(data.holeCards);
  if (cards === null) return 'holeCards must be two different cards';
  if (!Array.isArray(data.before)) return 'the steps do not reach a preflop decision';
  const steps: readonly unknown[] = data.before;
  // The steps don't depend on cards: find the hero first, then deal it the hole cards and replay.
  const probe = replay(dealtHand(n, 1, cards), steps);
  if (typeof probe === 'string') return probe;
  const hero = probe.toAct as SeatNumber;
  return playerView(replay(dealtHand(n, hero, cards), steps) as HandState, hero);
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

  const legal = (a: GoldenAction) => view === null || view.legalActions.some((l) => l.type === a);
  const { action } = data;
  if (action === undefined || action === null) {
    problems.push(`${where}: missing recommended action`);
  } else if (!isAction(action) || !legal(action)) {
    problems.push(`${where}: recommended action "${echo(action)}" is not legal in the view`);
  }

  const alternative = data.alternative ?? null;
  if (Array.isArray(alternative)) {
    problems.push(`${where}: more than one acceptable alternative`);
  } else if (alternative !== null && (!isAction(alternative) || !legal(alternative))) {
    problems.push(`${where}: invalid alternative "${echo(alternative)}"`);
  } else if (alternative !== null && alternative === action) {
    problems.push(`${where}: alternative repeats the recommended action`);
  }

  const { justification } = data;
  if (typeof justification !== 'string' || wordCount(justification) < JUSTIFICATION_WORDS) {
    problems.push(
      `${where}: missing written justification (at least ${JUSTIFICATION_WORDS} words)`,
    );
  } else {
    if (sentencesOf(justification).length > MAX_SENTENCES) {
      problems.push(`${where}: justification has more than three sentences`);
    }
    if (namedConcepts(justification).length === 0) {
      problems.push(`${where}: justification names no listed concept`);
    }
  }

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

/** Validates every spot; throws GoldenSpotValidationError listing every problem. Returns spots in file order. */
export function parseGoldenSpots(
  raw: unknown,
  charts: Readonly<Record<ReferenceSize, PreflopChart>> = PREFLOP_CHARTS,
): GoldenSpot[] {
  if (!isRecord(raw) || raw.format !== GOLDEN_FORMAT || raw.version !== VERSION) {
    throw new GoldenSpotValidationError([
      `Golden spot file: expected format "${GOLDEN_FORMAT}" version ${VERSION}`,
    ]);
  }
  const problems: string[] = [];
  const seen = new Set<string>();
  const spots: GoldenSpot[] = [];
  const entries: readonly unknown[] = Array.isArray(raw.spots) ? raw.spots : [];
  entries.forEach((entry, i) => {
    const data = isRecord(entry) ? entry : {};
    const { id } = data;
    let name: string;
    if (typeof id !== 'string' || id === '' || id.length > ID_CHARS) {
      name = `#${i + 1}`;
      problems.push(`Golden spot ${name}: missing id`);
    } else {
      name = id;
      if (seen.has(id)) problems.push(`Golden spot ${id}: duplicate id`);
      seen.add(id);
    }
    const spot = parseSpot(data, name, charts, problems);
    if (spot !== null) spots.push(spot);
  });
  if (problems.length > 0) throw new GoldenSpotValidationError(problems);
  return spots;
}

/** null when the advice agrees; otherwise the failure message. */
export function checkGoldenSpot(
  spot: GoldenSpot,
  advise: (view: PlayerView) => { readonly action: string } = (view) => recommend(view),
): string | null {
  const actual = advise(spot.view).action;
  if (actual === spot.action || actual === spot.alternative) return null;
  const expected =
    spot.alternative === null ? spot.action : `${spot.action} or ${spot.alternative}`;
  return `Golden spot ${spot.id}: expected ${expected}, got ${actual}`;
}
