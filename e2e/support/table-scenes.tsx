import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { decisionRecord } from '../../src/table/hand-record';
import type { HintCardView } from '../../src/table/hint';
import { storedReviewEntries } from '../../src/table/review';
import { completedHand, type CompletedHand, type TableState } from '../../src/table/session';
import css from '../../src/ui/styles.css?inline';
import { TableView, type ReviewState } from '../../src/ui/table/Table';
import {
  BET_ALL_IN,
  CALL_ALL_IN,
  CAPPED_FLOP,
  FLOP_BET,
  RAISE_ALL_IN,
  SEAT_1_DEALT,
  SHOWN_HANDS,
  SIDE_POT_RIVER,
  SIDE_POT_SHOWDOWN,
  TEN_SEAT_FLOP,
  TEN_SEAT_SHOWDOWN,
} from '../../tests/support/table-scenarios';

// Test-only page (D-8): never imported by the app, built and injected by table-harness-bundle.ts.
const SCENES: Partial<Record<string, TableState>> = {
  'flop-bet': FLOP_BET,
  'seat-1': SEAT_1_DEALT,
  'shown-hands': SHOWN_HANDS,
  'capped-flop': CAPPED_FLOP,
  'call-all-in': CALL_ALL_IN,
  'raise-all-in': RAISE_ALL_IN,
  'bet-all-in': BET_ALL_IN,
  'side-pot-river': SIDE_POT_RIVER,
  'side-pot-showdown': SIDE_POT_SHOWDOWN,
  'ten-seat-hint': TEN_SEAT_FLOP,
  'ten-seat-review': TEN_SEAT_SHOWDOWN,
};
/** A ready card as long as a real three-sentence one with nine opponent lines (layout only, SPEC-17). */
const TEN_SEAT_CARD: HintCardView = {
  action: 'Check',
  chartBasis: null,
  equity: '14.8%',
  requiredEquity: '0.0%',
  explanation:
    'Your equity, your share of the pot if the hand were played out to the end, is 14.8% against all their hands and 9.6% against the hands that would call a bet. Your equity against the hands that would call is not above 50.0%, so a bet would not be a value bet, a bet that worse hands will call. Checking is free, with 0.0% equity required, so check.',
  opponents: TEN_SEAT_FLOP.seats
    .filter((s) => s.kind === 'bot')
    .map((s) => ({ seat: s.seat, name: s.name, basis: 'typical player' })),
};
const HINTS: Partial<Record<string, { status: 'ready'; card: HintCardView }>> = {
  'ten-seat-hint': { status: 'ready', card: TEN_SEAT_CARD },
};
/** The open review of `table`'s finished hand, graded here in the page (about 1.2 s for ten seats). */
function openReview(table: TableState): ReviewState {
  const hand = completedHand(table) as CompletedHand;
  return { entries: storedReviewEntries(hand, hand.userDecisions.map(decisionRecord)), open: true };
}
const root = document.getElementById('root');
const table = SCENES[root?.dataset.scene ?? ''];
const hint = HINTS[root?.dataset.scene ?? ''] ?? null;
if (!root || table === undefined)
  throw new Error('Table scenes need #root with a known data-scene');
const review = root.dataset.scene === 'ten-seat-review' ? openReview(table) : null;

const style = document.createElement('style');
style.textContent = css;
document.head.append(style);

const noop = (): void => undefined;
createRoot(root).render(
  <StrictMode>
    <main className="table-screen">
      <h1>Table scene</h1>
      <TableView
        table={table}
        onAct={noop}
        onLeave={noop}
        hint={hint}
        onHint={noop}
        review={review}
        onDealNext={noop}
        onCloseReview={noop}
      />
    </main>
  </StrictMode>,
);
