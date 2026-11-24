# Play-money check (TASK-2.15)

TLH Trainer deals only in play money (REQ-006.3, REQ-061.1). An automated check runs with every push and fails
if any screen or dialog offers a deposit, payment, purchase, cash-out, real-money wager or real-money
conversion, or if payment code ships with the app.

## What the check flags

`realMoneyOffers` in `e2e/support/play-money.ts` matches these phrases, case-insensitive and word-bounded
(`[\s-]?` is an optional space or hyphen):

- `deposit…`, `withdraw…`, `cash out` / `cash-out` / `cashout(s)`, `purchas…`, `checkout`, `payment(s)`,
  `pay now`, `pay with`, `pay online`
- `buy now`, `buy chips`, `buy more chips`, `buy coins`, `buy credits`, `buy tokens`, `top up` / `top-up`
- `real money`, `real cash`, `redeem…`, `convert… chips|winnings|to cash|to money`, `exchange chips|winnings`
- `credit card`, `debit card`, `card number`, `paypal`, `stripe`, `apple pay`, `google pay`, `venmo`, `skrill`,
  `neteller`, `klarna`

Single poker words (`buy`, `pay`, `cash`, `wager`, `bet`, `$`) are never flagged alone, so play-money text such
as "Buy-in", "Rebuy for $160", "Cash game" and "pays off value bets" passes.

On each screen the check reads `document.body.innerText`, the text of every `<option>`, the `aria-label`,
`aria-description`, `title`, `alt` and `placeholder` attributes, and every `<input>` value. A failure names the
screen: `Play-money check failed on home: "Deposit"`.

The bundle scan (`paymentFindings`) reads every `.js`, `.html` and `.css` file in the built `dist/` and the
dependency fields of `package.json`. It flags the Payment Request API (`PaymentRequest`, `canMakePayment`, …),
payment-provider hosts (Stripe, PayPal, Braintree, Adyen, Square, Klarna, …) and payment library names.

## The screen list

`e2e/support/screen-list.ts` lists every App screen and dialog component:

| id                   | kind   | route / component  |
| -------------------- | ------ | ------------------ |
| `home`               | screen | `home`             |
| `game-config`        | screen | `config`           |
| `end-session-dialog` | dialog | `EndSessionDialog` |
| `table`              | screen | `table`            |
| `bust-dialog`        | dialog | `BustDialog`       |
| `ending`             | screen | `ending`           |
| `session-report`     | screen | `report`           |

`tests/ui/screen-list.acceptance.test.ts` compares the list with the source: every `name: '<x>'` in the
`Screen` union of `src/ui/App.tsx` is a route, and every `src/ui/**/*.tsx` file (tests excluded) with a
`<dialog>` or `role="dialog"` / `role="alertdialog"` is a dialog component, named by its file. The test fails
with `screen <route> is not in the screen list`, `dialog <Component> is not in the screen list`, or
`screen list entry <id> matches no screen or dialog in the app` for an entry whose screen is gone.

## Registering a new screen or dialog

1. Add an entry to `SCREEN_LIST`: `{ id, kind: 'screen', route }` for a new `Screen` union member, or
   `{ id, kind: 'dialog', component }` for a new dialog component.
2. Extend the walk in `e2e/play-money.spec.ts` to reach it and call `checkPlayMoney(page, '<id>')`. The walk
   fails with `screen list entries not visited: <ids>` until it does.

## Running it

- `npx vitest run tests/ui/screen-list.acceptance.test.ts tests/ui/play-money.test.ts` (also part of
  `npm test`)
- `npx playwright test e2e/play-money.spec.ts` (also part of `npm run e2e`, which CI runs on every push): the
  walk, the Deposit fixture and the bundle scan, in Chromium and WebKit.
