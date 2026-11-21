import type { Situation } from '../advice/preflop-chart';

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

export interface BotStyleData {
  readonly style: StyleName;
  readonly description: string;
  readonly mixedSpots: ReadonlyMap<SpotType, MixedSpot>;
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

/** Validates authored JSON from `fileName`. Throws StyleValidationError listing every problem. */
export function parseStyle(raw: unknown, fileName: string): BotStyleData {
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
      } else if (recommended === 0 || alternative === 0) {
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

  if (problems.length > 0) throw new StyleValidationError(fileName, problems);
  return {
    style: style as StyleName,
    description: raw.description as string,
    mixedSpots,
  };
}

/** One nextUint32 draw u: 'alternative' iff u < spot.alternative * 2**32, else 'recommended'. */
export function drawMixed(
  spot: MixedSpot,
  random: { nextUint32(): number },
): 'recommended' | 'alternative' {
  return random.nextUint32() < spot.alternative * 2 ** 32 ? 'alternative' : 'recommended';
}
