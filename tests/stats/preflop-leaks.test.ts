import { describe, expect, it } from 'vitest';
import type { ActionType, Grade } from '../../src/advice/grade';
import type { ActionRecord, SeatNumber } from '../../src/engine/hand';
import {
  categoryCounts,
  handCategoryDecisions,
  parseLeakCategories,
  positionGroup,
  preflopAction,
  type CategoryDecision,
  type CategoryHand,
} from '../../src/stats/leaks';
import data from '../../src/stats/leak-categories.json' with { type: 'json' };
import { seatSession } from '../../src/table/session';
import { sessionRecord } from '../../src/table/session-record';
import { parseSessionReport, sessionReport, type ReportHand } from '../../src/table/session-report';

type Json = Record<string, unknown>;

/** A deep copy of the shipped file with `edit` applied. */
function altered(edit: (file: Json) => void): Json {
  const file = structuredClone(data) as unknown as Json;
  edit(file);
  return file;
}
const entry = (file: Json, i: number): Json => (file.categories as Json[])[i] as Json;
/** Index of `early-fold`, the first preflop entry. */
const FIRST = 15;

const act = (
  seat: SeatNumber,
  type: ActionRecord['type'],
  street: ActionRecord['street'] = 'preflop',
): ActionRecord => ({ street, seat, type, amount: 0, added: 0 });

const decision = (
  street: CategoryDecision['street'],
  type: ActionType,
  grade: Grade = 'correct',
  hinted = false,
): CategoryDecision => ({ street, action: { type }, grade: { grade }, hinted });

/** A 6-max hand (button 6; null → no button) with the user on `userSeat`. */
const hand = (
  userSeat: SeatNumber,
  actions: readonly ActionRecord[],
  decisions: CategoryHand['decisions'],
  button: SeatNumber | null = 6,
): CategoryHand => ({
  seats: [1, 2, 3, 4, 5, 6].map((seat) => ({ seat })),
  ...(button !== null && { button }),
  userSeat,
  actions: [act(1, 'small-blind'), act(2, 'big-blind'), ...actions],
  decisions,
});

const spots = (h: CategoryHand) => handCategoryDecisions(h).map((d) => d.preflop);

describe('preflop leak categories', () => {
  it('parseLeakCategories rejects malformed preflop entries', () => {
    const at = (field: string, i = FIRST) => `categories[${i}].${field}`;
    const cases: [string, (file: Json) => void][] = [
      [at('group'), (f) => (entry(f, FIRST).group = 'front')],
      [at('action'), (f) => (entry(f, FIRST).action = 'limp')],
      [at('action'), (f) => (entry(f, FIRST).action = 'check')],
      [at('id'), (f) => (entry(f, FIRST).id = 'early-open')],
      [at('id', FIRST + 1), (f) => ((f.categories as Json[])[FIRST + 1] = entry(f, FIRST))],
      [at('facingBet'), (f) => (entry(f, FIRST).facingBet = false)],
      [at('group'), (f) => delete entry(f, FIRST).group],
      [at('fix'), (f) => (entry(f, FIRST).fix = 'Open more. Fold less.')],
      [at('evidenceName'), (f) => (entry(f, FIRST).evidenceName = 'Early-position folds')],
      [at('street'), (f) => (entry(f, FIRST).street = 'showdown')],
      [at('street'), (f) => delete entry(f, FIRST).street],
      [at('justification'), (f) => (entry(f, FIRST).justification = 'no capital.')],
      [at('title'), (f) => (entry(f, FIRST).title = 'Folding.')],
    ];
    for (const [path, edit] of cases) {
      expect(() => parseLeakCategories(altered(edit)), path).toThrow(
        new RangeError(`Invalid leak categories: ${path}`),
      );
    }
  });

  it('handCategoryDecisions pairs preflop decisions with their action records', () => {
    const flopBet = decision('flop', 'bet');
    // No button: preflop decisions get no spot; postflop ones pass through.
    const noButton = hand(
      5,
      [act(3, 'fold'), act(4, 'fold'), act(5, 'raise'), act(5, 'bet', 'flop')],
      [decision('preflop', 'raise'), flopBet],
      null,
    );
    expect(handCategoryDecisions(noButton)).toEqual([decision('preflop', 'raise'), flopBet]);
    expect(categoryCounts(handCategoryDecisions(noButton))).toEqual([
      { category: 'flop-not-facing-a-bet-bet', decisions: 1, errors: 0, major: 0 },
    ]);

    // Decisions without street/action are dropped.
    const bare = hand(
      5,
      [act(3, 'fold'), act(4, 'fold'), act(5, 'call')],
      [{ grade: { grade: 'major' }, hinted: false }],
    );
    expect(handCategoryDecisions(bare)).toEqual([]);

    // Limp, then re-raise after a raise.
    const limpReraise = hand(
      3,
      [
        act(3, 'call'),
        act(4, 'raise'),
        act(5, 'fold'),
        act(6, 'fold'),
        act(1, 'fold'),
        act(2, 'fold'),
        act(3, 'raise'),
      ],
      [decision('preflop', 'call'), decision('preflop', 'raise')],
    );
    expect(spots(limpReraise)).toEqual([
      { group: 'middle', raisedBefore: false },
      { group: 'middle', raisedBefore: true },
    ]);
    expect(categoryCounts(handCategoryDecisions(limpReraise)).map((c) => c.category)).toEqual([
      'middle-call',
      'middle-raise',
    ]);

    // Open, then cap after a re-raise: the user's own open counts as a raise before.
    const openCap = hand(
      6,
      [
        act(3, 'fold'),
        act(4, 'fold'),
        act(5, 'fold'),
        act(6, 'raise'),
        act(1, 'raise'),
        act(2, 'fold'),
        act(6, 'raise'),
      ],
      [decision('preflop', 'raise'), decision('preflop', 'raise')],
    );
    expect(
      categoryCounts(handCategoryDecisions(openCap)).map((c) => [c.category, c.decisions]),
    ).toEqual([
      ['late-open', 1],
      ['late-raise', 1],
    ]);
    const ownRaise = hand(
      6,
      [
        act(3, 'fold'),
        act(4, 'fold'),
        act(5, 'fold'),
        act(6, 'raise'),
        act(1, 'call'),
        act(2, 'call'),
        act(6, 'raise'),
      ],
      [decision('preflop', 'raise'), decision('preflop', 'raise')],
    );
    expect(spots(ownRaise)).toEqual([
      { group: 'late', raisedBefore: false },
      { group: 'late', raisedBefore: true },
    ]);

    // A trailing forced fold with no decision is ignored.
    const forced = hand(
      1,
      [
        act(3, 'fold'),
        act(4, 'fold'),
        act(5, 'fold'),
        act(6, 'raise'),
        act(1, 'call'),
        act(2, 'fold'),
        act(1, 'fold', 'flop'),
      ],
      [decision('preflop', 'call')],
    );
    expect(spots(forced)).toEqual([{ group: 'blinds', raisedBefore: true }]);

    // A decision whose paired record has another type gets no spot.
    const mismatch = hand(4, [act(3, 'fold'), act(4, 'fold')], [decision('preflop', 'raise')]);
    expect(spots(mismatch)).toEqual([undefined]);
    // A preflop decision paired with a postflop record gets no spot.
    const lateStreet = hand(
      4,
      [act(4, 'call'), act(4, 'call', 'flop')],
      [decision('flop', 'call'), decision('preflop', 'call')],
    );
    expect(spots(lateStreet)).toEqual([undefined, undefined]);

    // Hinted preflop decisions are not counted.
    const hinted = hand(
      5,
      [act(3, 'fold'), act(4, 'fold'), act(5, 'raise')],
      [decision('preflop', 'raise', 'major', true)],
    );
    expect(spots(hinted)).toEqual([{ group: 'late', raisedBefore: false }]);
    expect(categoryCounts(handCategoryDecisions(hinted))).toEqual([]);

    // Preflop and postflop counts together in LEAK_CATEGORIES order.
    const mixed = hand(
      5,
      [
        act(3, 'fold'),
        act(4, 'fold'),
        act(5, 'raise'),
        act(6, 'fold'),
        act(1, 'fold'),
        act(2, 'call'),
        act(2, 'check', 'flop'),
        act(5, 'bet', 'flop'),
      ],
      [decision('preflop', 'raise', 'minor'), decision('flop', 'bet')],
    );
    expect(categoryCounts(handCategoryDecisions(mixed))).toEqual([
      { category: 'flop-not-facing-a-bet-bet', decisions: 1, errors: 0, major: 0 },
      { category: 'late-open', decisions: 1, errors: 1, major: 0 },
    ]);
  });

  it('positionGroup and preflopAction cover every table size and action', () => {
    const groups = (seats: readonly number[], button: number) =>
      seats.map((seat) => positionGroup(seats, button, seat));
    expect(groups([2, 5, 7, 9], 7)).toEqual(['blinds', 'late', 'late', 'blinds']);
    expect(groups([9, 2, 7, 5], 7)).toEqual(['blinds', 'blinds', 'late', 'late']);
    expect(groups([1, 2, 3, 4, 5], 5)).toEqual(['blinds', 'blinds', 'middle', 'late', 'late']);
    expect(groups([1, 2, 3, 4, 5, 6, 7], 7)).toEqual([
      'blinds',
      'blinds',
      'early',
      'middle',
      'middle',
      'late',
      'late',
    ]);
    expect(groups([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 10)).toEqual([
      'blinds',
      'blinds',
      'early',
      'early',
      'early',
      'early',
      'middle',
      'middle',
      'late',
      'late',
    ]);
    expect(groups([3, 8], 8)).toEqual(['blinds', 'late']);
    expect(() => positionGroup([1, 2, 3], 3, 4)).toThrow(new RangeError('Seat 4 is not dealt in'));
    expect(() => positionGroup([1, 2, 3], 5, 1)).toThrow(
      new RangeError('Button 5 is not dealt in'),
    );

    expect(preflopAction('fold', false)).toBe('fold');
    expect(preflopAction('fold', true)).toBe('fold');
    expect(preflopAction('call', false)).toBe('call');
    expect(preflopAction('call', true)).toBe('call');
    expect(preflopAction('raise', false)).toBe('open');
    expect(preflopAction('raise', true)).toBe('raise');
    expect(preflopAction('check', false)).toBeNull();
    expect(preflopAction('bet', false)).toBeNull();
  });

  it('stored leakCounts with preflop categories round-trip and are order-checked', () => {
    const record = sessionRecord(seatSession({ players: 6 }), {
      sessionId: '0123456789abcdef0123456789abcdef',
      startedAt: new Date('2026-11-24T10:00:00Z'),
      updatedAt: new Date('2026-11-24T10:00:00Z'),
    });
    const stored: ReportHand = {
      ...hand(
        5,
        [
          act(3, 'fold'),
          act(4, 'fold'),
          act(5, 'raise'),
          act(6, 'fold'),
          act(1, 'fold'),
          act(2, 'fold'),
        ],
        [decision('preflop', 'raise', 'major')],
      ),
      board: [],
      result: {
        endedBy: 'fold',
        showdown: [],
        awards: [{ pot: 12, amount: 12, winners: [{ seat: 5, amount: 12 }] }],
      },
    };
    const facing: ReportHand = {
      ...stored,
      actions: [
        ...stored.actions.slice(0, 4),
        act(5, 'call'),
        act(2, 'bet', 'flop'),
        act(5, 'fold', 'flop'),
      ],
      decisions: [decision('preflop', 'call'), decision('flop', 'fold', 'minor')],
    };
    const report = sessionReport({ ...record, handsPlayed: 2 }, new Date('2026-11-24T14:30:00Z'), [
      stored,
      facing,
    ]);
    expect(report.leakCounts).toEqual([
      { category: 'flop-facing-a-bet-fold', decisions: 1, errors: 1, major: 0 },
      { category: 'late-open', decisions: 1, errors: 1, major: 1 },
      { category: 'late-call', decisions: 1, errors: 0, major: 0 },
    ]);
    expect(parseSessionReport(JSON.parse(JSON.stringify(report)))).toEqual(report);

    const swapped = {
      ...report,
      leakCounts: [
        { category: 'early-fold', decisions: 1, errors: 0, major: 0 },
        { category: 'flop-facing-a-bet-fold', decisions: 1, errors: 0, major: 0 },
      ],
    };
    expect(() => parseSessionReport(swapped)).toThrow(
      new RangeError('Invalid session report: leakCounts[1].category'),
    );
    expect(() =>
      parseSessionReport({
        ...report,
        leakCounts: [{ category: 'preflop-early-fold', decisions: 1, errors: 0, major: 0 }],
      }),
    ).toThrow(new RangeError('Invalid session report: leakCounts[0].category'));
  });
});
