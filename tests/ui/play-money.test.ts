import { describe, expect, it } from 'vitest';
import {
  appScreens,
  paymentFindings,
  realMoneyOffers,
  unlistedScreens,
} from '../../e2e/support/play-money';
import { SCREEN_LIST, type ScreenEntry } from '../../e2e/support/screen-list';

// TASK-2.15: the play-money matchers and the screen-list comparison, on fixtures.

const APP_SOURCE = `
type Screen =
  | { readonly name: 'home'; readonly returned: boolean }
  | { readonly name: 'config' }
  | { readonly name: 'table'; readonly config: SessionConfig }
  | { readonly name: 'table'; readonly resume: ResumedSession }
  | { readonly name: 'ending'; readonly sessionId: string }
  | { readonly name: 'report'; readonly report: SessionReport }
  | { readonly name: 'stats'; readonly view: StatisticsView | undefined | null };

type Other = { readonly name: 'not-a-screen' };
`;

const UI_FILES = [
  { path: 'src/ui/config/EndSessionDialog.tsx', source: '<dialog ref={ref}>…</dialog>' },
  { path: 'src/ui/table/BustDialog.tsx', source: '<dialog\n  className="bust">…</dialog>' },
  { path: 'src/ui/table/HintCard.tsx', source: '<section aria-label="Hint">…</section>' },
  { path: 'src/ui/table/LeaveDialog.tsx', source: '<dialog ref={dialog}>…</dialog>' },
];

describe('realMoneyOffers', () => {
  it('realMoneyOffers flags real-money offers and not play-money vocabulary', () => {
    const rows: [string, string[]][] = [
      ['Deposit', ['Deposit']],
      ['Cash out', ['Cash out']],
      ['Cashout now', ['Cashout']],
      ['Buy chips', ['Buy chips']],
      ['Pay now', ['Pay now']],
      ['Play for real money', ['real money']],
      ['Withdraw winnings', ['Withdraw']],
      ['Redeem chips', ['Redeem']],
      ['Convert chips to cash', ['Convert chips']],
      ['Top up', ['Top up']],
      ['Apple Pay', ['Apple Pay']],
      ['Rebuy for $160 to keep playing, or leave the table.', []],
      ['Buy-in $160 (20 big bets)', []],
      ['Cash · 6 players · $4/$8 · 12 hands · paused', []],
      ['Set up a cash game or sit-and-go', []],
      ['Your cash result: won $56', []],
      ['Result -$160 BB/100 -153.8 Rebuys 0', []],
      ['it pays off value bets with weak pairs', []],
      ['raise more often to buy position', []],
      ['Bet $8', []],
      ['Rebuy', []],
      ['Leave table', []],
    ];
    for (const [input, result] of rows) expect(realMoneyOffers(input), input).toEqual(result);
  });

  it('matches mixed case and hyphenation, and every match in order', () => {
    expect(realMoneyOffers('Cash-Out or CASHOUT, then Top-up')).toEqual([
      'Cash-Out',
      'CASHOUT',
      'Top-up',
    ]);
    expect(realMoneyOffers('Deposits and payments by credit card')).toEqual([
      'Deposits',
      'payments',
      'credit card',
    ]);
  });

  it('does not match an offer word inside a longer word', () => {
    expect(realMoneyOffers('stripes and Klarnas and prepayment')).toEqual([]);
  });
});

describe('appScreens', () => {
  it('finds the Screen union routes and the dialog components, sorted', () => {
    expect(appScreens(APP_SOURCE, UI_FILES)).toEqual({
      routes: ['config', 'ending', 'home', 'report', 'stats', 'table'],
      dialogs: ['BustDialog', 'EndSessionDialog', 'LeaveDialog'],
    });
    expect(unlistedScreens(appScreens(APP_SOURCE, UI_FILES), SCREEN_LIST)).toEqual([]);
  });

  it('unlistedScreens names an unlisted screen, an unlisted dialog and a stale entry', () => {
    const app = APP_SOURCE.replace(
      "| { readonly name: 'stats'; readonly view: StatisticsView | undefined | null };",
      "| { readonly name: 'stats'; readonly view: StatisticsView | undefined | null }\n  | { readonly name: 'settings' };",
    );
    const files = [
      ...UI_FILES,
      { path: 'src/ui/settings/SettingsDialog.tsx', source: '<dialog open>…</dialog>' },
    ];
    const list: readonly ScreenEntry[] = [
      ...SCREEN_LIST,
      { id: 'old', kind: 'screen', route: 'gone' },
    ];
    expect(unlistedScreens(appScreens(app, files), list)).toEqual([
      'dialog SettingsDialog is not in the screen list',
      'screen list entry old matches no screen or dialog in the app',
      'screen settings is not in the screen list',
    ]);

    const confirm = {
      path: 'src/ui/common/ConfirmBox.tsx',
      source: '<div role="alertdialog" aria-modal="true">…</div>',
    };
    expect(appScreens(APP_SOURCE, [...UI_FILES, confirm]).dialogs).toEqual([
      'BustDialog',
      'ConfirmBox',
      'EndSessionDialog',
      'LeaveDialog',
    ]);
  });

  it('names a stale dialog entry whose component is gone', () => {
    expect(unlistedScreens(appScreens(APP_SOURCE, UI_FILES.slice(1)), SCREEN_LIST)).toEqual([
      'screen list entry end-session-dialog matches no screen or dialog in the app',
    ]);
  });
});

describe('paymentFindings', () => {
  it('paymentFindings flags the Payment Request API, a provider URL and a payment library', () => {
    expect(
      paymentFindings(
        [
          { name: 'a.js', text: 'const r = new PaymentRequest(m, d);' },
          { name: 'b.js', text: 'load("https://js.stripe.com/v3")' },
        ],
        { dependencies: { react: '1', '@stripe/stripe-js': '1' } },
      ),
    ).toEqual([
      'a.js: Payment Request API (PaymentRequest)',
      'b.js: payment-provider URL (js.stripe.com)',
      'package.json: payment library @stripe/stripe-js',
    ]);
    expect(
      paymentFindings(
        [{ name: 'x.js', text: 'fetch("http://www.w3.org/2000/svg"); "https://react.dev"' }],
        { dependencies: { react: '1', 'react-dom': '1' } },
      ),
    ).toEqual([]);
  });

  it('matches payment library names in every dependency field and nothing else', () => {
    const matched = [
      '@stripe/stripe-js',
      'stripe',
      'react-paypal-js',
      '@paypal/react-paypal-js',
      'payment-request-polyfill',
    ];
    const clean = ['react', 'vite', '@playwright/test', 'fast-check', 'prettier'];
    const deps = (names: string[]) => Object.fromEntries(names.map((n) => [n, '1']));
    expect(
      paymentFindings([], {
        dependencies: deps(matched.slice(0, 2)),
        devDependencies: deps([...matched.slice(2, 4), ...clean]),
        optionalDependencies: deps(matched.slice(4)),
        peerDependencies: {},
      }),
    ).toEqual(matched.map((n) => `package.json: payment library ${n}`));
  });

  it('flags canMakePayment and provider hosts on any subdomain, not look-alike hosts', () => {
    expect(
      paymentFindings(
        [
          {
            name: 'c.js',
            text: 'x.canMakePayment(); "https://www.PayPal.com/sdk"; "notstripe.com"; "stripe.community"',
          },
        ],
        {},
      ),
    ).toEqual([
      'c.js: Payment Request API (canMakePayment)',
      'c.js: payment-provider URL (www.PayPal.com)',
    ]);
  });
});
