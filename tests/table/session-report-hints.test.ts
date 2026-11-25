import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import type { ActionRecord, SeatNumber } from '../../src/engine/hand';
import { seatSession } from '../../src/table/session';
import { sessionRecord, type SessionRecord } from '../../src/table/session-record';
import {
  hintTile,
  parseSessionReport,
  rateTiles,
  sessionReport,
  type ReportDecision,
  type ReportHand,
  type SessionReport,
} from '../../src/table/session-report';
import { ReportScreen } from '../../src/ui/report/ReportScreen';

const SESSION = '0123456789abcdef0123456789abcdef';
const STARTED = new Date('2026-11-24T10:00:00Z');
const ENDED = new Date('2026-11-24T14:30:00Z');
const ME: SeatNumber = 1;

function session(handsPlayed: number): SessionRecord {
  const record = sessionRecord(seatSession({ players: 6 }), {
    sessionId: SESSION,
    startedAt: STARTED,
    updatedAt: STARTED,
  });
  return { ...record, handsPlayed };
}

const act = (seat: SeatNumber, type: ActionRecord['type']): ActionRecord => ({
  street: 'preflop',
  seat,
  type,
  amount: 0,
  added: 0,
});

const decision = (hinted: boolean): ReportDecision => ({ grade: { grade: 'major' }, hinted });

/** A fold-out hand with the user on seat 1; `decisions` omitted when undefined. */
function hand(decisions?: readonly ReportDecision[]): ReportHand {
  return {
    userSeat: ME,
    seats: [1, 2, 3].map((seat) => ({ seat })),
    actions: [act(2, 'small-blind'), act(3, 'big-blind'), act(ME, 'fold')],
    board: [],
    result: {
      endedBy: 'fold',
      showdown: [],
      awards: [{ pot: 6, amount: 6, winners: [{ seat: 3, amount: 6 }] }],
    },
    ...(decisions === undefined ? {} : { decisions }),
  };
}

const BASE: SessionReport = {
  sessionId: SESSION,
  startedAt: '2026-11-24T10:00:00.000Z',
  endedAt: '2026-11-24T14:30:00.000Z',
  gameType: 'cash',
  players: 6,
  stake: { smallBet: 4, bigBet: 8 },
  handsPlayed: 100,
  cash: { buyIn: 160, rebuys: 0, finalStack: 120, result: -40, bbPer100: -5 },
  errors: { major: 3, minor: 7 },
};

const value = (hinted: number, decisions: number): string | undefined =>
  hintTile({ ...BASE, hints: { hinted, decisions } })?.value;

const render = (report: SessionReport): string =>
  renderToString(createElement(ReportScreen, { report, onHome: () => undefined }));

describe('session report hints', () => {
  it('hints is present exactly when errors is and old reports show no tile', () => {
    const report = sessionReport(session(3), ENDED, [
      hand([decision(true), decision(false)]),
      hand([]),
      hand([decision(true)]),
    ]);
    expect(report.hints).toEqual({ hinted: 2, decisions: 3 });
    expect(Object.keys(report).at(-1)).toBe('hints');

    expect('hints' in sessionReport(session(2), ENDED)).toBe(false);
    expect('hints' in sessionReport(session(2), ENDED, [])).toBe(false);
    const mixed = sessionReport(session(2), ENDED, [hand([decision(true)]), hand()]);
    expect('errors' in mixed).toBe(false);
    expect('hints' in mixed).toBe(false);

    expect(hintTile(BASE)).toBeNull();
    const old = render(BASE);
    expect(old).not.toContain('report-hints');
    expect(old).toBe(
      render({ ...BASE, hints: { hinted: 1, decisions: 2 } }).replace(
        /<div class="report-hints".*?<\/div>/,
        '',
      ),
    );
    expect(rateTiles({ ...BASE, hints: { hinted: 1, decisions: 2 } })).toEqual(rateTiles(BASE));
  });

  it('hintTile rounds half up to one decimal and handles one and zero decisions', () => {
    expect(value(1, 16)).toBe('1 of 16 decisions (6.3%)');
    expect(value(1, 3)).toBe('1 of 3 decisions (33.3%)');
    expect(value(2, 3)).toBe('2 of 3 decisions (66.7%)');
    expect(value(1, 1)).toBe('1 of 1 decision (100.0%)');
    expect(value(0, 1)).toBe('0 of 1 decision (0.0%)');
    expect(value(0, 0)).toBe('0 of 0 decisions (0.0%)');
    expect(hintTile({ ...BASE, hints: { hinted: 0, decisions: 0 } })?.label).toBe('Hints used');
  });

  it('parseSessionReport validates hints', () => {
    const valid = { ...BASE, hints: { hinted: 4, decisions: 4 } };
    expect(parseSessionReport(JSON.parse(JSON.stringify(valid)))).toEqual(valid);
    const zero = { ...BASE, hints: { hinted: 0, decisions: 0 } };
    expect(parseSessionReport(JSON.parse(JSON.stringify(zero)))).toEqual(zero);

    const cases: [unknown, string][] = [
      [null, 'hints'],
      [[], 'hints'],
      [{ hinted: 1 }, 'hints.decisions'],
      [{ hinted: 0, decisions: -1 }, 'hints.decisions'],
      [{ hinted: 0, decisions: 2.5 }, 'hints.decisions'],
      [{ hinted: 5, decisions: 4 }, 'hints.hinted'],
      [{ hinted: -1, decisions: 4 }, 'hints.hinted'],
      [{ hinted: '3', decisions: 4 }, 'hints.hinted'],
    ];
    for (const [hints, field] of cases) {
      const stored = JSON.parse(JSON.stringify({ ...BASE, hints })) as unknown;
      expect(() => parseSessionReport(stored)).toThrow(
        new RangeError(`Invalid session report: ${field}`),
      );
    }
  });
});
