import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  SIT_AND_GO_LEVEL_1,
  nextHand,
  resolveSessionConfig,
  seatSession,
  stakesFor,
  type TableState,
} from '../../src/table/session';
import { TableView, type ReviewState } from '../../src/ui/table/Table';
import {
  FLOP_BET,
  KINGS_SHOWDOWN,
  REVIEW_FOUR,
  STORYBOARD_HISTORY,
  withFinalStacks,
} from '../support/table-scenarios';

const noop = (): void => undefined;
const BUST = [160, 222, 160, 160, 0, 165];
const HELD: ReviewState = { entries: [], open: true };

const render = (table: TableState, review: ReviewState | null = null): string =>
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

const dialogOf = (html: string): string => /<dialog[^>]*>.*?<\/dialog>/s.exec(html)?.[0] ?? '';

function expectBustDialog(html: string, amount: string): void {
  expect(html.match(/<dialog[\s>]/g)).toHaveLength(1);
  expect(html).toContain('<dialog class="bust-dialog" aria-labelledby="bust-heading">');
  const dialog = dialogOf(html);
  expect(dialog).toContain('<h2 id="bust-heading">Out of chips</h2>');
  expect(dialog).toContain(
    `<p>Your stack is $0. Rebuy for ${amount} to keep playing, or leave the table.</p>`,
  );
  expect([...dialog.matchAll(/<button([^>]*)>([^<]*)<\/button>/g)].map((m) => m[2])).toEqual([
    'Rebuy',
    'Leave table',
  ]);
  expect(dialog).toContain('<button type="button" class="bust-rebuy">Rebuy</button>');
  expect(dialog).toContain('<button type="button" class="bust-leave">Leave table</button>');
}

describe('bust dialog acceptance', () => {
  it('a bust shows the Rebuy and Leave table dialog over the result', () => {
    const done = withFinalStacks(BUST);
    const html = render(done);
    expectBustDialog(html, '$160');
    expect(html).toMatch(/<div role="status" class="hand-result">/);
    expect(html).not.toContain('Deal next hand');

    // A held review: no dialog until Deal next hand clears it (A-3).
    const held = render(done, HELD);
    expect(held).not.toMatch(/<dialog/);
    expect(held).toContain('Deal next hand');

    // The restored bust (no hand dealt).
    expectBustDialog(render(nextHand(done)), '$160');

    const highSeated = seatSession({ stake: { smallBet: 10, bigBet: 20 } });
    const high: TableState = {
      ...highSeated,
      stacks: highSeated.stacks.map((s) => (s.seat === 5 ? { seat: 5, stack: 0 } : s)),
    };
    expectBustDialog(render(high), '$400');
  });

  it('no rebuy or add-chips control while the user has chips', () => {
    const sitAndGo: TableState = {
      ...KINGS_SHOWDOWN,
      config: resolveSessionConfig({ gameType: 'sit-and-go' }),
      stakes: stakesFor(SIT_AND_GO_LEVEL_1),
    };
    const tables: [TableState, ReviewState | null][] = [
      [seatSession(), null],
      ...STORYBOARD_HISTORY.map((t): [TableState, null] => [t, null]),
      [FLOP_BET, null],
      [KINGS_SHOWDOWN, null],
      [withFinalStacks([160, 222, 160, 160, 1, 165]), null],
      [withFinalStacks([160, 222, 160, 160, 95, 165]), null],
      [nextHand(withFinalStacks([160, 222, 160, 160, 95, 165])), null],
      [REVIEW_FOUR, HELD],
      [withFinalStacks(BUST, sitAndGo), null],
      [nextHand(withFinalStacks(BUST, sitAndGo)), null],
    ];
    for (const [table, review] of tables) {
      const html = render(table, review);
      expect(html).not.toMatch(/<dialog/);
      expect(html).not.toMatch(/bust-/);
      expect(html).not.toMatch(/rebuy|add chips|top up|buy in/i);
    }
  });
});
