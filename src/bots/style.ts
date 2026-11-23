import { HAND_CLASSES, type HandClass } from '../advice/hand-class';
import { SIX_MAX_CHART } from '../advice/preflop';
import {
  APPLICABLE_SPOTS,
  chartCell,
  type Position,
  type PreflopChart,
  type Situation,
} from '../advice/preflop-chart';

export type StyleName = 'TAG' | 'Calling station' | 'Maniac' | 'Rock';
const STYLE_NAMES: readonly string[] = [
  'TAG',
  'Calling station',
  'Maniac',
  'Rock',
] satisfies readonly StyleName[];

export const SPOT_TYPES = [
  'preflop-unopened',
  'preflop-limpers',
  'preflop-raise',
  'preflop-raise-and-calls',
  'preflop-re-raise',
  'preflop-blind-defence',
] as const satisfies readonly `preflop-${Situation}`[];
export type SpotType = (typeof SPOT_TYPES)[number];

/** Probabilities over the advice's recommended action and the chart cell's acceptable alternative; sum 1. */
export interface MixedSpot {
  readonly recommended: number;
  readonly alternative: number;
  readonly justification: string;
}

export type DeviationStreet = 'preflop' | 'postflop';
export type DeviationAdvice = 'fold' | 'raise' | 'check' | 'call';
export type DeviationInstead = 'call' | 'bet' | 'raise';
const DEVIATION_PAIRS: readonly string[] = [
  'preflop/fold/call',
  'preflop/raise/call',
  'postflop/fold/call',
  'preflop/fold/raise',
  'preflop/check/raise',
  'preflop/call/raise',
  'postflop/check/bet',
  'postflop/call/raise',
];

/** Where the advice is `advice` on `street`, play `instead` with `probability` (one draw). */
export interface Deviation {
  readonly street: DeviationStreet;
  readonly advice: DeviationAdvice;
  readonly instead: DeviationInstead;
  readonly probability: number;
  readonly justification: string;
}

/** A style's own postflop value bar: keep the advice's bet/raise only above thresholdPct (percent, one decimal). */
export interface PostflopValue {
  readonly thresholdPct: number;
  readonly justification: string;
}

export interface BotStyleData {
  readonly style: StyleName;
  readonly description: string;
  readonly mixedSpots: ReadonlyMap<SpotType, MixedSpot>;
  /** In file order; [] when the file has no deviations. */
  readonly deviations: readonly Deviation[];
  /** In APPLICABLE_SPOTS['6-max'] order; null when the file has no starting range. */
  readonly startingRange: readonly RangeSpot[] | null;
  /** null when the file has no postflopValue block. */
  readonly postflopValue: PostflopValue | null;
}

/** The hand classes a style plays preflop in one chart spot; every other class folds (or checks when free). */
export interface RangeSpot {
  readonly position: Position;
  readonly situation: Situation;
  /** In file order. */
  readonly hands: ReadonlySet<HandClass>;
  readonly justification: string;
}

export class StyleValidationError extends Error {
  readonly problems: readonly string[];

  constructor(fileName: string, problems: readonly string[]) {
    super(`Invalid style file ${fileName}:\n- ` + problems.join('\n- '));
    this.name = 'StyleValidationError';
    this.problems = problems;
  }
}

const FORMAT = 'tlh-bot-style';
const DESCRIPTION_WORDS = 15;
const JUSTIFICATION_WORDS = 10;
const ECHO_CHARS = 20;
const ACTIONS = ['recommended', 'alternative'] as const;
const SUM_TOLERANCE = 1e-9;
const VALUE_MIN_PCT = 50;
const VALUE_MAX_PCT = 100;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function wordCount(text: unknown): number {
  return typeof text === 'string' ? (text.match(/\p{L}+/gu) ?? []).length : 0;
}

/** Untrusted value for an error message: its first ECHO_CHARS characters, then '...' if cut. */
function echo(value: unknown): string {
  const text = String(value);
  return text.length <= ECHO_CHARS ? text : `${text.slice(0, ECHO_CHARS)}...`;
}

const isProbability = (p: unknown): p is number =>
  typeof p === 'number' && Number.isFinite(p) && p >= 0 && p <= 1;

/** Validates authored JSON from `fileName`; a starting range is checked against the TAG `chart`.
 *  Throws StyleValidationError listing every problem. */
export function parseStyle(
  raw: unknown,
  fileName: string,
  chart: PreflopChart = SIX_MAX_CHART,
): BotStyleData {
  if (!isRecord(raw) || raw.format !== FORMAT || raw.version !== 1) {
    throw new StyleValidationError(fileName, [
      `${fileName}: expected format "${FORMAT}" version 1`,
    ]);
  }
  const problems: string[] = [];
  const style = STYLE_NAMES.includes(raw.style as string) ? (raw.style as StyleName) : null;
  if (style === null) problems.push(`${fileName}: unknown style "${echo(raw.style)}"`);
  const name = style ?? '?';
  if (wordCount(raw.description) < DESCRIPTION_WORDS) {
    problems.push(
      `${fileName}: style has no plain-English description (at least ${DESCRIPTION_WORDS} words)`,
    );
  }
  if (!Array.isArray(raw.mixedSpots)) problems.push(`${fileName}: mixedSpots must be a list`);

  const mixedSpots = new Map<SpotType, MixedSpot>();
  const seen = new Set<SpotType>();
  for (const entry of Array.isArray(raw.mixedSpots) ? (raw.mixedSpots as unknown[]) : []) {
    const data = isRecord(entry) ? entry : {};
    const spot = SPOT_TYPES.find((s) => s === data.spot);
    if (spot === undefined) {
      problems.push(`${fileName}: style ${name} has unknown spot type "${echo(data.spot)}"`);
      continue;
    }
    if (seen.has(spot)) {
      problems.push(`${fileName}: style ${name} lists spot type ${spot} twice`);
      continue;
    }
    seen.add(spot);
    const where = `${fileName}: style ${name} spot type ${spot}`;
    const actions = isRecord(data.actions) ? data.actions : {};
    let valid = true;
    for (const key of Object.keys(actions)) {
      if (!(ACTIONS as readonly string[]).includes(key)) {
        problems.push(`${where} has unknown action "${echo(key)}"`);
        valid = false;
      }
    }
    for (const action of ACTIONS) {
      if (!isProbability(actions[action])) {
        problems.push(`${where} has an invalid probability for ${action}`);
        valid = false;
      }
    }
    if (valid) {
      const recommended = actions.recommended as number;
      const alternative = actions.alternative as number;
      const sum = recommended + alternative;
      if (Math.abs(sum - 1) > SUM_TOLERANCE) {
        problems.push(`${where} probabilities sum to ${sum}, not 1`);
        valid = false;
      }
      if (recommended === 0 || alternative === 0) {
        problems.push(
          `${fileName}: style ${name} marks spot type ${spot} as mixed with fewer than two actions of non-zero probability`,
        );
        valid = false;
      }
    }
    if (wordCount(data.justification) < JUSTIFICATION_WORDS) {
      problems.push(`${where} has no justification (at least ${JUSTIFICATION_WORDS} words)`);
      valid = false;
    }
    if (valid) {
      mixedSpots.set(spot, {
        recommended: actions.recommended as number,
        alternative: actions.alternative as number,
        justification: data.justification as string,
      });
    }
  }

  const deviations: Deviation[] = [];
  if (raw.deviations !== undefined && !Array.isArray(raw.deviations)) {
    problems.push(`${fileName}: deviations must be a list`);
  }
  const seenPairs = new Set<string>();
  for (const entry of Array.isArray(raw.deviations) ? (raw.deviations as unknown[]) : []) {
    const data = isRecord(entry) ? entry : {};
    if (
      !DEVIATION_PAIRS.includes(
        `${String(data.street)}/${String(data.advice)}/${String(data.instead)}`,
      )
    ) {
      problems.push(
        `${fileName}: style ${name} has unsupported deviation "${echo(data.street)}" "${echo(data.advice)}" to "${echo(data.instead)}"`,
      );
      continue;
    }
    const street = data.street as DeviationStreet;
    const advice = data.advice as DeviationAdvice;
    if (seenPairs.has(`${street} ${advice}`)) {
      problems.push(`${fileName}: style ${name} lists deviation ${street} ${advice} twice`);
      continue;
    }
    seenPairs.add(`${street} ${advice}`);
    const where = `${fileName}: style ${name} deviation ${street} ${advice}`;
    let valid = true;
    if (!isProbability(data.probability)) {
      problems.push(`${where} has an invalid probability`);
      valid = false;
    }
    if (wordCount(data.justification) < JUSTIFICATION_WORDS) {
      problems.push(`${where} has no justification (at least ${JUSTIFICATION_WORDS} words)`);
      valid = false;
    }
    if (valid) {
      deviations.push({
        street,
        advice,
        instead: data.instead as DeviationInstead,
        probability: data.probability as number,
        justification: data.justification as string,
      });
    }
  }

  const startingRange = parseStartingRange(raw.startingRange, fileName, name, chart, problems);

  let postflopValue: PostflopValue | null = null;
  if (raw.postflopValue !== undefined) {
    const where = `${fileName}: style ${name} postflopValue`;
    const data = raw.postflopValue;
    if (!isRecord(data)) {
      problems.push(`${where} must be an object`);
    } else {
      const pct = data.thresholdPct;
      const validPct =
        typeof pct === 'number' &&
        Number.isFinite(pct) &&
        pct >= VALUE_MIN_PCT &&
        pct <= VALUE_MAX_PCT;
      if (!validPct) {
        problems.push(
          `${where} must have a thresholdPct from ${VALUE_MIN_PCT} to ${VALUE_MAX_PCT}`,
        );
      }
      const justified = wordCount(data.justification) >= JUSTIFICATION_WORDS;
      if (!justified) {
        problems.push(`${where} has no justification (at least ${JUSTIFICATION_WORDS} words)`);
      }
      if (validPct && justified) {
        postflopValue = { thresholdPct: pct, justification: data.justification as string };
      }
    }
  }

  if (problems.length > 0) throw new StyleValidationError(fileName, problems);
  return {
    style: style as StyleName,
    description: raw.description as string,
    mixedSpots,
    deviations,
    startingRange,
    postflopValue,
  };
}

const RANGE_POSITIONS: readonly Position[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
const SIX_MAX_SPOTS = APPLICABLE_SPOTS['6-max'];
const spotKey = (position: Position, situation: Situation): string => `${position} ${situation}`;

/** The TAG chart's non-fold classes in the spot. */
function chartPlays(chart: PreflopChart, position: Position, situation: Situation): HandClass[] {
  return HAND_CLASSES.filter((hc) => chartCell(chart, position, situation, hc).action !== 'fold');
}

/** Validates `startingRange` into `problems`; null when absent. Each spot's hands must be a narrower subset of the
 *  chart's non-fold cells, and so must each position's union over its spots. */
function parseStartingRange(
  value: unknown,
  fileName: string,
  name: string,
  chart: PreflopChart,
  problems: string[],
): RangeSpot[] | null {
  if (value === undefined) {
    if (name === 'Rock') problems.push(`${fileName}: style Rock has no starting range`);
    return null;
  }
  if (!Array.isArray(value)) {
    problems.push(`${fileName}: startingRange must be a list`);
    return null;
  }
  /** Spot key → the parsed spot; `clean` when its hands are a string of known, unrepeated classes. */
  const found = new Map<string, { spot: RangeSpot; clean: boolean }>();
  for (const entry of value as unknown[]) {
    const data = isRecord(entry) ? entry : {};
    const id = SIX_MAX_SPOTS.find(
      (s) => s.position === data.position && s.situation === data.situation,
    );
    if (id === undefined) {
      problems.push(
        `${fileName}: style ${name} starting range has unknown spot "${echo(data.position)}" "${echo(data.situation)}"`,
      );
      continue;
    }
    const key = spotKey(id.position, id.situation);
    if (found.has(key)) {
      problems.push(`${fileName}: style ${name} lists starting range spot ${key} twice`);
      continue;
    }
    const where = `${fileName}: style ${name} starting range ${key}`;
    const hands = new Set<HandClass>();
    let clean = typeof data.hands === 'string';
    if (typeof data.hands === 'string') {
      for (const token of data.hands.split(/\s+/).filter((t) => t !== '')) {
        if (!HAND_CLASSES.includes(token)) {
          problems.push(`${where} has unknown hand class "${echo(token)}"`);
          clean = false;
        } else if (hands.has(token)) {
          problems.push(`${where} lists ${token} twice`);
          clean = false;
        } else {
          hands.add(token);
        }
      }
    } else {
      problems.push(`${where} hands must be a string of hand classes`);
    }
    if (wordCount(data.justification) < JUSTIFICATION_WORDS) {
      problems.push(`${where} has no justification (at least ${JUSTIFICATION_WORDS} words)`);
    }
    if (clean) {
      for (const hc of hands) {
        if (chartCell(chart, id.position, id.situation, hc).action === 'fold') {
          problems.push(`${where} has ${hc}, which the TAG chart folds`);
        }
      }
      const plays = chartPlays(chart, id.position, id.situation).length;
      if (hands.size >= plays) {
        problems.push(
          `${where} has ${hands.size} hand classes, not fewer than the TAG chart's ${plays}`,
        );
      }
    }
    found.set(key, {
      spot: { ...id, hands, justification: String(data.justification) },
      clean,
    });
  }
  for (const id of SIX_MAX_SPOTS) {
    const key = spotKey(id.position, id.situation);
    if (!found.has(key)) {
      problems.push(`${fileName}: style ${name} starting range is missing spot ${key}`);
    }
  }
  for (const position of RANGE_POSITIONS) {
    const ids = SIX_MAX_SPOTS.filter((s) => s.position === position);
    const spots = ids.map((s) => found.get(spotKey(s.position, s.situation)));
    if (spots.some((s) => s === undefined || !s.clean)) continue;
    const range = new Set(spots.flatMap((s) => [...(s?.spot.hands ?? [])]));
    const plays = new Set(ids.flatMap((s) => chartPlays(chart, s.position, s.situation)));
    if (range.size >= plays.size) {
      problems.push(
        `${fileName}: style ${name} starting range for ${position} has ${range.size} hand classes, not fewer than the TAG chart's ${plays.size}`,
      );
    }
  }
  return SIX_MAX_SPOTS.flatMap((s) => {
    const spot = found.get(spotKey(s.position, s.situation))?.spot;
    return spot === undefined ? [] : [spot];
  });
}

/** The style's range for the spot; undefined when the style has no range or no such spot. */
export function startingRangeFor(
  style: BotStyleData,
  position: Position,
  situation: Situation,
): RangeSpot | undefined {
  return style.startingRange?.find((s) => s.position === position && s.situation === situation);
}

/** One nextUint32 draw u: 'alternative' iff u < spot.alternative * 2**32, else 'recommended'. */
export function drawMixed(
  spot: MixedSpot,
  random: { nextUint32(): number },
): 'recommended' | 'alternative' {
  return random.nextUint32() < spot.alternative * 2 ** 32 ? 'alternative' : 'recommended';
}

/** The style's deviation for advice `advice` on `street`, if any. */
export function findDeviation(
  style: BotStyleData,
  street: DeviationStreet,
  advice: string,
): Deviation | undefined {
  return style.deviations.find((d) => d.street === street && d.advice === advice);
}

/** One nextUint32 draw u: true iff u < probability * 2**32. */
export function drawDeviation(probability: number, random: { nextUint32(): number }): boolean {
  return random.nextUint32() < probability * 2 ** 32;
}
