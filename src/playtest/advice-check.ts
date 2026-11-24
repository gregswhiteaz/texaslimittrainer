import { gradeDecision } from '../advice/grade';
import type { ObservedOpponent } from '../advice/ranges';
import { recommend, type Recommendation } from '../advice/recommend';
import type { ReplayCode } from '../engine/deck';
import type { Action, SeatNumber } from '../engine/hand';
import type { PlayerView } from '../engine/player-view';
import {
  addStyleCounts,
  EMPTY_STYLE_COUNTS,
  handStyleCounts,
  styleStats,
  type StatHand,
  type StyleCounts,
} from '../stats/style-stats';
import type { ActionHook, PlayedHand } from './runner';

export type AdviseFn = (view: PlayerView, observed: readonly ObservedOpponent[]) => Recommendation;

/** The user-facing advice: recommend(view, { opponentRanges: 'actions', observedOpponents: observed }). */
export const userAdvice: AdviseFn = (view, observed) =>
  recommend(view, { opponentRanges: 'actions', observedOpponents: observed });

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function differenceAt(a: unknown, b: unknown, path: string): string | null {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return path;
    for (let i = 0; i < a.length; i++) {
      const found = differenceAt(a[i], b[i], `${path}[${i}]`);
      if (found !== null) return found;
    }
    return null;
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    const join = (key: string) => (path === '' ? key : `${path}.${key}`);
    const onlyOne =
      keysA.find((key) => !Object.hasOwn(b, key)) ?? keysB.find((key) => !Object.hasOwn(a, key));
    if (onlyOne !== undefined) return join(onlyOne);
    const reordered = keysA.find((key, i) => key !== keysB[i]);
    if (reordered !== undefined) return join(reordered);
    for (const key of keysA) {
      const found = differenceAt(a[key], b[key], join(key));
      if (found !== null) return found;
    }
    return null;
  }
  return Object.is(a, b) ? null : path;
}

/** '' when deep-equal; else the first differing path, e.g. 'recommendation.explanation', 'grade',
 *  'recommendation.outs[2]', '(root)'. Primitives compare with Object.is; arrays by length then elements;
 *  plain objects by own enumerable key list (same keys, same order) then values in a's key order. */
export function firstDifference(a: unknown, b: unknown): string {
  const path = differenceAt(a, b, '');
  return path === null ? '' : path === '' ? '(root)' : path;
}

/** One ObservedOpponent per seat other than `seat` with at least one counted hand, ascending seat (A-1). */
export function observedSnapshot(
  counts: ReadonlyMap<SeatNumber, StyleCounts>,
  seat: SeatNumber,
): ObservedOpponent[] {
  return [...counts]
    .filter(([s, c]) => s !== seat && c.handsDealt >= 1)
    .sort(([x], [y]) => x - y)
    .map(([s, c]) => {
      const stats = styleStats(c);
      return { seat: s, hands: c.handsDealt, vpip: stats.vpip as number, pfr: stats.pfr as number };
    });
}

export interface AdviceMismatch {
  readonly handNumber: number;
  readonly replayCode: ReplayCode;
  /** 1-based among player actions in the hand, as in HandViolation. */
  readonly actionNumber: number;
  readonly action: Action;
  readonly path: string;
}

/** Computes the user advice and grade twice at every decision point and counts the differences (REQ-036). */
export class AdviceCheck {
  private readonly counts = new Map<SeatNumber, StyleCounts>();
  private handNumber = 1;
  private replayCode = '' as ReplayCode;
  private actionNumber = 0;
  private decisionCount = 0;
  private mismatchCount = 0;
  private first: AdviceMismatch | null = null;

  /** ActionHook: [] when equal, else [{ invariant: 'advice-determinism', message: `${path} differs` }]. */
  readonly onAction: ActionHook;

  constructor(advise: AdviseFn = userAdvice) {
    this.onAction = (step, view) => {
      this.actionNumber++;
      // playHand always passes the view the policy decided on.
      const decision = view as PlayerView;
      const snapshot = observedSnapshot(this.counts, decision.seat);
      const compute = () =>
        gradeDecision(
          advise(
            structuredClone(decision),
            snapshot.map((o) => ({ ...o })),
          ),
          step.action.type,
        );
      const path = firstDifference(compute(), compute());
      this.decisionCount++;
      if (path === '') return [];
      this.mismatchCount++;
      this.first ??= {
        handNumber: this.handNumber,
        replayCode: this.replayCode,
        actionNumber: this.actionNumber,
        action: step.action,
        path,
      };
      return [{ invariant: 'advice-determinism', message: `${path} differs` }];
    };
  }

  /** Call before each hand is played: sets the hand number and code used in reports. */
  startHand(handNumber: number, code: ReplayCode): void {
    this.handNumber = handNumber;
    this.replayCode = code;
    this.actionNumber = 0;
  }

  /** After each hand: resets replaced seats, then adds the hand's per-seat counts unless it had violations or
   *  no result (A-1). */
  add(hand: PlayedHand): void {
    for (const seat of hand.replaced ?? []) this.counts.delete(seat);
    const { result } = hand.final;
    if (hand.violations > 0 || result === null) return;
    const statHand: StatHand = {
      seats: hand.record.seats,
      actions: hand.final.actions,
      board: hand.final.board,
      result,
    };
    for (const { seat } of hand.record.seats) {
      const total = this.counts.get(seat) ?? EMPTY_STYLE_COUNTS;
      this.counts.set(seat, addStyleCounts(total, handStyleCounts(statHand, seat)));
    }
  }

  get decisions(): number {
    return this.decisionCount;
  }

  get mismatches(): number {
    return this.mismatchCount;
  }

  get firstMismatch(): AdviceMismatch | null {
    return this.first;
  }
}
