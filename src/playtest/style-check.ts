import { recommend } from '../advice/recommend';
import { CALLING_STATION_STYLE } from '../bots/calling-station';
import { MANIAC_STYLE } from '../bots/maniac';
import { ROCK_STYLE } from '../bots/rock';
import { SPOT_TYPES, type BotStyleData, type SpotType, type StyleName } from '../bots/style';
import { BOT_EQUITY, TAG_STYLE, tagChartFor } from '../bots/tag';
import type { Action, HandState } from '../engine/hand';
import { playerView } from '../engine/player-view';
import {
  addStyleCounts,
  EMPTY_STYLE_COUNTS,
  handStyleCounts,
  NO_STAT,
  styleStats,
  type StatHand,
  type StyleCounts,
} from '../stats/style-stats';
import type { ActionHook, PlayedHand } from './runner';

/** Percent, inclusive. */
export type Band = readonly [low: number, high: number];
export interface StyleBands {
  readonly vpip: Band;
  readonly pfr: Band;
  readonly aggression: Band;
}
export type StyleBandTable = Readonly<Record<StyleName, StyleBands>>;
/** REQ-027.1 (TAG), REQ-027.2 (Calling station), REQ-027.3 (Maniac) and REQ-027.4 (Rock). */
export const STYLE_BANDS: StyleBandTable = {
  TAG: { vpip: [18, 26], pfr: [14, 22], aggression: [45, 66] },
  'Calling station': { vpip: [45, 65], pfr: [3, 10], aggression: [10, 25] },
  Maniac: { vpip: [50, 75], pfr: [35, 60], aggression: [65, 85] },
  Rock: { vpip: [8, 15], pfr: [6, 12], aggression: [35, 55] },
};
export const STYLE_ORDER: readonly StyleName[] = ['TAG', 'Calling station', 'Maniac', 'Rock'];
export interface MixedCounts {
  readonly recommended: number;
  readonly alternative: number;
}

const STYLE_DATA: Readonly<Record<StyleName, BotStyleData>> = {
  TAG: TAG_STYLE,
  'Calling station': CALLING_STATION_STYLE,
  Maniac: MANIAC_STYLE,
  Rock: ROCK_STYLE,
};

interface PreflopStep {
  readonly before: HandState;
  readonly action: Action;
}

/** Per-style stat counts and mixed-spot action counts of a playtest run, fed one PlayedHand at a time. */
export class StyleCheck {
  private readonly styleCounts = new Map<StyleName, StyleCounts>();
  private readonly mixedCounts = new Map<StyleName, Map<SpotType, MixedCounts>>();
  private steps: PreflopStep[] = [];
  private readonly recordMixed: boolean;

  /** ActionHook: records (before, action) for preflop steps when recordMixed; always returns []. */
  readonly onAction: ActionHook;

  constructor(recordMixed: boolean) {
    this.recordMixed = recordMixed;
    this.onAction = (step) => {
      if (recordMixed && step.before.street === 'preflop') {
        this.steps.push({ before: step.before, action: step.action });
      }
      return [];
    };
  }

  /** Counts one played hand's bot seats under their style at that hand (A-1); a violating or abandoned hand
   *  counts for nothing (A-2). Clears the recorded steps either way. */
  add(hand: PlayedHand): void {
    const steps = this.steps;
    this.steps = [];
    const { result } = hand.final;
    if (hand.violations > 0 || result === null) return;
    const statHand: StatHand = {
      seats: hand.record.seats,
      actions: hand.final.actions,
      board: hand.final.board,
      result,
    };
    const styleOf = new Map<number, StyleName>();
    for (const { seat } of hand.record.seats) {
      const lineUpSeat = hand.lineUp?.[seat - 1];
      if (lineUpSeat === undefined) styleOf.set(seat, 'TAG');
      else if (lineUpSeat.kind === 'bot' && lineUpSeat.style !== null) {
        styleOf.set(seat, lineUpSeat.style);
      }
    }
    for (const [seat, style] of styleOf) {
      const total = this.styleCounts.get(style) ?? EMPTY_STYLE_COUNTS;
      this.styleCounts.set(style, addStyleCounts(total, handStyleCounts(statHand, seat)));
      if (this.recordMixed && !this.mixedCounts.has(style)) {
        const spots = SPOT_TYPES.filter((spot) => STYLE_DATA[style].mixedSpots.has(spot));
        if (spots.length > 0) {
          this.mixedCounts.set(
            style,
            new Map(spots.map((spot) => [spot, { recommended: 0, alternative: 0 }])),
          );
        }
      }
    }
    for (const { before, action } of steps) {
      const style = styleOf.get(action.seat);
      const spots = style === undefined ? undefined : this.mixedCounts.get(style);
      if (spots === undefined) continue;
      // The draw condition of decideTag (A-4); preflop advice reads no earlier showdowns (A-5).
      const view = playerView(before, action.seat, []);
      const chart = view.street === 'preflop' ? tagChartFor(view.players.length) : undefined;
      const advice = recommend(view, {
        equity: BOT_EQUITY,
        ...(chart === undefined ? {} : { chart }),
      });
      if (advice.basis !== 'chart' || advice.alternative === null) continue;
      const spot = `preflop-${advice.situation}` as SpotType;
      const counts = spots.get(spot);
      if (counts === undefined) continue;
      if (action.type === advice.move.type) {
        spots.set(spot, { ...counts, recommended: counts.recommended + 1 });
      } else if (action.type === advice.alternative) {
        spots.set(spot, { ...counts, alternative: counts.alternative + 1 });
      }
    }
  }

  /** Only styles with at least one counted hand. */
  counts(): ReadonlyMap<StyleName, StyleCounts> {
    return this.styleCounts;
  }

  /** Each counted style with at least one mixed spot: every spot it marks mixed, in SPOT_TYPES order. */
  mixed(): ReadonlyMap<StyleName, ReadonlyMap<SpotType, MixedCounts>> {
    return this.mixedCounts;
  }
}

/** One decimal (A-3); null stays null. */
export function roundStat(value: number | null): number | null {
  return value === null ? null : Math.round(value * 10) / 10;
}

const STATS = [
  ['vpip', 'VPIP'],
  ['pfr', 'PFR'],
  ['aggression', 'aggression'],
] as const;

/** A mixed spot is judged for one-action use only when it came up this often (REQ-028 fit criterion). */
export const MIN_JUDGED_DECISIONS = 10;

const percent = (value: number | null): string =>
  value === null ? NO_STAT : `${value.toFixed(1)}%`;
const bandText = ([low, high]: Band): string => `(band ${low.toFixed(1)}-${high.toFixed(1)}%)`;
const mixedText = (style: StyleName, spot: SpotType, c: MixedCounts): string =>
  `${style} ${spot}, recommended ${c.recommended}, alternative ${c.alternative}`;

/** The style block (whole lines): '' when no style was counted and !check. passed is true when !check. */
export function formatStyleReport(
  counts: ReadonlyMap<StyleName, StyleCounts>,
  mixed: ReadonlyMap<StyleName, ReadonlyMap<SpotType, MixedCounts>>,
  check: boolean,
  bands: StyleBandTable = STYLE_BANDS,
): { readonly text: string; readonly passed: boolean } {
  if (counts.size === 0) {
    return check
      ? { text: 'Style check: failed, no bot hands were counted\n', passed: false }
      : { text: '', passed: true };
  }
  const lines = [
    'Style stats: VPIP and PFR per hand dealt, aggression = flop, turn and river bets and raises as a share of bets, raises and calls',
  ];
  const outside: string[] = [];
  const oneAction: string[] = [];
  const notJudged: string[] = [];
  for (const style of STYLE_ORDER) {
    const c = counts.get(style);
    if (c === undefined) continue;
    const stats = styleStats(c);
    const parts = STATS.map(([key, label]) => {
      const value = roundStat(stats[key]);
      if (!check) return `${label} ${percent(value)}`;
      const band = bands[style][key];
      const text = `${label} ${percent(value)} ${bandText(band)}`;
      if (value === null || value < band[0] || value > band[1]) {
        outside.push(`Outside band: ${style} ${text}`);
      }
      return text;
    });
    lines.push(`Style: ${style}, ${c.handsDealt} hands, ${parts.join(', ')}`);
  }
  if (check) {
    for (const style of STYLE_ORDER) {
      for (const [spot, c] of mixed.get(style) ?? []) {
        lines.push(`Mixed spot: ${mixedText(style, spot, c)}`);
        const decisions = c.recommended + c.alternative;
        if (decisions >= MIN_JUDGED_DECISIONS) {
          if (c.recommended === 0 || c.alternative === 0) {
            oneAction.push(`One action only: ${mixedText(style, spot, c)}`);
          }
        } else if (decisions > 0) {
          notJudged.push(
            `Not judged (fewer than ${MIN_JUDGED_DECISIONS} decisions): ${style} ${spot}`,
          );
        }
      }
    }
    lines.push(...notJudged, ...outside, ...oneAction);
    lines.push(`Style check: ${outside.length + oneAction.length === 0 ? 'passed' : 'failed'}`);
  }
  return {
    text: lines.map((line) => `${line}\n`).join(''),
    passed: !check || outside.length + oneAction.length === 0,
  };
}
