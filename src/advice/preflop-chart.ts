import { handClassAt, type HandClass } from './hand-class';

export type ReferenceSize = 'heads-up' | '6-max' | 'full-ring';
export type Position = 'UTG' | 'UTG+1' | 'MP' | 'LJ' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';
export type Situation =
  | 'unopened'
  | 'limpers'
  | 'raise'
  | 'raise-and-calls'
  | 're-raise'
  | 're-raise-not-mine'
  | 'blind-defence';
export type ChartAction = 'fold' | 'call' | 'raise';

export interface ChartCell {
  readonly action: ChartAction;
  readonly borderline: boolean;
  readonly alternative: ChartAction | null;
}

export interface ChartSpot {
  readonly position: Position;
  readonly situation: Situation;
  readonly justification: string;
  /** Exactly the 169 HAND_CLASSES as keys. */
  readonly cells: Readonly<Record<HandClass, ChartCell>>;
}

export interface PreflopChart {
  readonly referenceSize: ReferenceSize;
  readonly justification: string;
  /** In APPLICABLE_SPOTS order. */
  readonly spots: readonly ChartSpot[];
}

interface SpotId {
  readonly position: Position;
  readonly situation: Situation;
}

function spotsOf(situation: Situation, positions: readonly Position[]): SpotId[] {
  return positions.map((position) => ({ position, situation }));
}

const REFERENCE_SIZES: readonly ReferenceSize[] = ['heads-up', '6-max', 'full-ring'];

/** Non-blind chart positions by seats before the button: index 0 = BTN. Last entry = earliest position. */
export const SEATS_BEFORE_BUTTON: Readonly<Record<ReferenceSize, readonly Position[]>> = {
  'heads-up': ['BTN'],
  '6-max': ['BTN', 'CO', 'HJ', 'UTG'],
  'full-ring': ['BTN', 'CO', 'HJ', 'LJ', 'MP', 'UTG+1', 'UTG'],
};

const FULL_RING_OPENERS: readonly Position[] = ['UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN'];

/** The (position, situation) spots each chart must hold, in chart order. */
export const APPLICABLE_SPOTS: Readonly<Record<ReferenceSize, readonly SpotId[]>> = {
  'heads-up': [
    ...spotsOf('unopened', ['BTN']),
    ...spotsOf('limpers', ['BB']),
    ...spotsOf('raise', ['BTN']),
    ...spotsOf('re-raise', ['BTN', 'BB']),
    ...spotsOf('blind-defence', ['BB']),
  ],
  '6-max': [
    ...spotsOf('unopened', ['UTG', 'HJ', 'CO', 'BTN', 'SB']),
    ...spotsOf('limpers', ['HJ', 'CO', 'BTN', 'SB', 'BB']),
    ...spotsOf('raise', ['UTG', 'HJ', 'CO', 'BTN']),
    ...spotsOf('raise-and-calls', ['UTG', 'HJ', 'CO', 'BTN']),
    ...spotsOf('re-raise', ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB']),
    ...spotsOf('re-raise-not-mine', ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB']),
    ...spotsOf('blind-defence', ['SB', 'BB']),
  ],
  'full-ring': [
    ...spotsOf('unopened', [...FULL_RING_OPENERS, 'SB']),
    ...spotsOf('limpers', ['UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB']),
    ...spotsOf('raise', FULL_RING_OPENERS),
    ...spotsOf('raise-and-calls', FULL_RING_OPENERS),
    ...spotsOf('re-raise', [...FULL_RING_OPENERS, 'SB', 'BB']),
    ...spotsOf('re-raise-not-mine', [...FULL_RING_OPENERS, 'SB', 'BB']),
    ...spotsOf('blind-defence', ['SB', 'BB']),
  ],
};

export class ChartValidationError extends Error {
  readonly problems: readonly string[];

  constructor(problems: readonly string[]) {
    super('Invalid preflop chart:\n- ' + problems.join('\n- '));
    this.name = 'ChartValidationError';
    this.problems = problems;
  }
}

const FORMAT = 'tlh-preflop-chart';
const CHART_WORDS = 50;
const SPOT_WORDS = 15;
const ECHO_CHARS = 20;
const ACTION_LETTERS = new Map<string, ChartAction>([
  ['F', 'fold'],
  ['C', 'call'],
  ['R', 'raise'],
]);

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

const spotKey = (position: unknown, situation: unknown) =>
  `${String(position)} ${String(situation)}`;

/** One grid token, or null after recording its problem. `where` = '<label>: <P> <S> <hc>'. */
function parseToken(
  token: string | undefined,
  where: string,
  problems: string[],
): ChartCell | null {
  if (token === undefined || token === '-') {
    problems.push(`${where} has no action`);
    return null;
  }
  const [head = '', ...alternatives] = token.split('/');
  const action = ACTION_LETTERS.get(head.charAt(0));
  const mark = head.slice(1);
  if (action === undefined || (mark !== '' && mark !== '*')) {
    problems.push(`${where} has invalid action "${echo(token)}" (use F, C or R)`);
    return null;
  }
  if (alternatives.length > 1) {
    problems.push(`${where} has more than one acceptable alternative`);
    return null;
  }
  let alternative: ChartAction | null = null;
  if (alternatives.length === 1) {
    alternative = ACTION_LETTERS.get(alternatives[0] as string) ?? null;
    if (alternative === null) {
      problems.push(`${where} has invalid alternative "${echo(token)}"`);
      return null;
    }
    if (alternative === action) {
      problems.push(`${where} repeats its action as the alternative`);
      return null;
    }
  }
  return { action, borderline: mark === '*', alternative };
}

function parseGrid(
  grid: unknown,
  label: string,
  spot: SpotId,
  problems: string[],
): Record<HandClass, ChartCell> {
  const cells: Record<HandClass, ChartCell> = {};
  const name = `${label}: spot ${spotKey(spot.position, spot.situation)}`;
  const rows = Array.isArray(grid) ? grid : [];
  if (rows.length !== 13) {
    problems.push(`${name} needs 13 grid rows, got ${rows.length}`);
    return cells;
  }
  rows.forEach((row: unknown, r) => {
    const tokens = typeof row === 'string' ? row.split(/\s+/).filter((t) => t !== '') : [];
    if (tokens.length > 13) {
      problems.push(
        `${name} row ${handClassAt(r, r).charAt(0)} has ${tokens.length} cells, expected 13`,
      );
    }
    for (let c = 0; c < 13; c++) {
      const hc = handClassAt(r, c);
      const where = `${label}: ${spotKey(spot.position, spot.situation)} ${hc}`;
      const cell = parseToken(tokens[c], where, problems);
      if (cell === null) continue;
      if (spot.position === 'BB' && spot.situation === 'limpers' && cell.action === 'fold') {
        problems.push(`${label}: BB limpers ${hc} folds where checking is free`);
        continue;
      }
      cells[hc] = cell;
    }
  });
  return cells;
}

/** Validates and compiles authored JSON. Throws ChartValidationError listing every problem. */
export function parseChart(raw: unknown): PreflopChart {
  if (!isRecord(raw) || raw.format !== FORMAT || raw.version !== 1) {
    throw new ChartValidationError([`Chart file: expected format "${FORMAT}" version 1`]);
  }
  if (!REFERENCE_SIZES.includes(raw.referenceSize as ReferenceSize)) {
    throw new ChartValidationError([
      `Chart file: unknown reference size "${String(raw.referenceSize)}"`,
    ]);
  }
  const referenceSize = raw.referenceSize as ReferenceSize;
  const label = `${referenceSize} chart`;
  const applicable = APPLICABLE_SPOTS[referenceSize];
  const problems: string[] = [];
  if (wordCount(raw.justification) < CHART_WORDS) {
    problems.push(`${label}: missing plain-English justification (at least ${CHART_WORDS} words)`);
  }
  const found = new Map<string, ChartSpot>();
  for (const entry of Array.isArray(raw.spots) ? (raw.spots as unknown[]) : []) {
    const data = isRecord(entry) ? entry : {};
    const key = spotKey(data.position, data.situation);
    const spot = applicable.find((s) => spotKey(s.position, s.situation) === key);
    if (spot === undefined) {
      problems.push(`${label}: spot ${echo(key)} does not apply at ${referenceSize}`);
      continue;
    }
    if (found.has(key)) {
      problems.push(`${label}: duplicate spot ${key}`);
      continue;
    }
    if (wordCount(data.justification) < SPOT_WORDS) {
      problems.push(
        `${label}: spot ${key} is missing its plain-English justification (at least ${SPOT_WORDS} words)`,
      );
    }
    const cells = parseGrid(data.grid, label, spot, problems);
    found.set(key, { ...spot, justification: String(data.justification), cells });
  }
  for (const spot of applicable) {
    const key = spotKey(spot.position, spot.situation);
    if (!found.has(key)) problems.push(`${label}: missing spot ${key}`);
  }
  if (problems.length > 0) throw new ChartValidationError(problems);
  return {
    referenceSize,
    justification: raw.justification as string,
    spots: applicable.map((s) => found.get(spotKey(s.position, s.situation)) as ChartSpot),
  };
}

/**
 * The authored cell for `hc` in the (position, situation) spot.
 * Throws RangeError('Chart <size> has no spot <position> <situation>') if the spot is absent.
 * Throws RangeError('Unknown hand class <hc>') if `hc` is not one of the 169 hand classes.
 */
export function chartCell(
  chart: PreflopChart,
  position: Position,
  situation: Situation,
  hc: HandClass,
): ChartCell {
  const spot = chart.spots.find((s) => s.position === position && s.situation === situation);
  if (spot === undefined) {
    throw new RangeError(`Chart ${chart.referenceSize} has no spot ${position} ${situation}`);
  }
  if (!Object.hasOwn(spot.cells, hc)) throw new RangeError(`Unknown hand class ${hc}`);
  return spot.cells[hc] as ChartCell;
}
