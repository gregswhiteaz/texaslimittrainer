import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { replayCodeFromWords } from '../../src/engine/deck';
import { opensReview } from '../../src/table/review';
import {
  DEFAULT_SESSION_CONFIG,
  SIT_AND_GO_LEVEL_1,
  completedHand,
  nextHand,
  rebuy,
  resolveSessionConfig,
  seatSession,
  stakesFor,
  userBusted,
  type CompletedHand,
  type TableState,
} from '../../src/table/session';
import { parseSessionRecord, sessionRecord } from '../../src/table/session-record';
import { TableView, type ReviewState } from '../../src/ui/table/Table';
import { playHand } from '../support/session-play';
import { KINGS_SHOWDOWN, REVIEW_FOUR, withFinalStacks } from '../support/table-scenarios';

// TASK-9.2: on a cash bust with the review held, the next-hand control reads Continue (REQ-007.6).

const noop = (): void => undefined;
const BUST = [160, 222, 160, 160, 0, 165];
const HELD: ReviewState = { entries: [], open: true };
const CLOSED: ReviewState = { entries: [], open: false };
const CONTINUE = '<button type="button" class="deal-next">Continue</button>';
const DEAL_NEXT = '<button type="button" class="deal-next">Deal next hand</button>';
/** The e2e spec's pinned replay words (A-5). */
const E2E_WORDS = [1, 1, 2, 3];

const render = (table: TableState, review: ReviewState | null): string =>
  renderToString(
    <TableView
      table={table}
      onAct={noop}
      onLeave={noop}
      onHome={noop}
      review={review}
      onDealNext={noop}
      onRebuy={noop}
    />,
  );

const countOf = (html: string, part: string): number => html.split(part).length - 1;

/** The A-5 seed: default 6-max, all TAG, 12 hands played, the user on $12, button on seat 3, hand 13. */
function seededSession(): TableState {
  const seated = seatSession(DEFAULT_SESSION_CONFIG);
  return {
    ...seated,
    stacks: seated.stacks.map((s) => (s.seat === 5 ? { seat: 5, stack: 12 } : s)),
    button: 3,
    handNumber: 13,
  };
}

describe('bust continue acceptance', () => {
  it('a held bust review shows Continue and no Deal next hand', () => {
    const done = withFinalStacks(BUST);
    const held = render(done, HELD);
    expect(countOf(held, CONTINUE)).toBe(1);
    expect(held).not.toContain('Deal next hand');
    expect(held).not.toContain('<dialog');

    const closed = render(done, CLOSED);
    expect(countOf(closed, CONTINUE)).toBe(1);
    expect(closed).not.toContain('Deal next hand');
    expect(closed).not.toContain('<dialog');
    expect(closed).not.toContain('<aside');

    // With the review cleared the dialog shows and there is no next-hand control (unchanged).
    const cleared = render(done, null);
    expect(cleared).toContain('<dialog');
    expect(cleared).not.toContain('deal-next');
  });

  it('a held review with chips left or in a sit-and-go shows Deal next hand', () => {
    const sitAndGo: TableState = {
      ...KINGS_SHOWDOWN,
      config: resolveSessionConfig({ gameType: 'sit-and-go' }),
      stakes: stakesFor(SIT_AND_GO_LEVEL_1),
    };
    for (const table of [
      withFinalStacks([160, 222, 160, 160, 1, 165]),
      REVIEW_FOUR,
      withFinalStacks(BUST, sitAndGo),
    ]) {
      const html = render(table, HELD);
      expect(countOf(html, DEAL_NEXT)).toBe(1);
      expect(html).not.toContain('>Continue<');
    }
  });

  it('the e2e seed busts the user after three reviewed decisions', () => {
    const seed = seededSession();
    const meta = {
      sessionId: 'f'.repeat(32),
      startedAt: new Date('2026-11-24T10:00:00Z'),
      updatedAt: new Date('2026-11-24T10:00:00Z'),
    };
    expect(parseSessionRecord(sessionRecord(seed, meta))).toEqual(sessionRecord(seed, meta));

    const done = playHand(seed, replayCodeFromWords(E2E_WORDS));
    expect(userBusted(done)).toBe(true);
    const hand = completedHand(done) as CompletedHand;
    expect(opensReview(hand)).toBe(true);
    expect(hand.userDecisions.map((d) => `${d.view.street}:${d.action.type}`)).toEqual([
      'preflop:call',
      'flop:check',
      'flop:call',
    ]);
    expect(done.hand?.players.map((p) => p.stack)).toEqual([174, 160, 160, 158, 0, 160]);

    const rebought = rebuy(nextHand(done));
    expect(rebought.stacks.find((s) => s.seat === 5)?.stack).toBe(160);
    expect(rebought.rebuys).toBe(1);
  });
});
