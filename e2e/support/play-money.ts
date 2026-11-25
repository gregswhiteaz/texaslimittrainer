import type { ScreenEntry } from './screen-list';

// TASK-2.15: pure play-money rules shared by Vitest and Playwright (no @playwright/test import here).
// See docs/ui/play-money.md.

/** Real-money offer phrases (A-1). Single poker words (buy, pay, cash, wager, bet, $) are never flagged alone. */
const OFFER_PHRASES = [
  String.raw`deposit\w*`,
  String.raw`withdraw\w*`,
  String.raw`cash[\s-]?outs?`,
  String.raw`purchas\w*`,
  'checkout',
  'payments?',
  'pay (?:now|with|online)',
  'buy (?:now|chips|more chips|coins|credits|tokens)',
  String.raw`top[\s-]?up`,
  String.raw`real[\s-]?(?:money|cash)`,
  String.raw`redeem\w*`,
  String.raw`convert\w* (?:chips|winnings|to cash|to money)`,
  'exchange (?:chips|winnings)',
  'credit card',
  'debit card',
  'card number',
  'paypal',
  'stripe',
  'apple pay',
  'google pay',
  'venmo',
  'skrill',
  'neteller',
  'klarna',
];
const OFFER = new RegExp(String.raw`\b(?:${OFFER_PHRASES.join('|')})\b`, 'gi');

/** Every real-money offer phrase in `text`, in order, as written. */
export function realMoneyOffers(text: string): string[] {
  return [...text.matchAll(OFFER)].map((match) => match[0]);
}

/** The text of the `type Screen =` declaration, up to its `;` outside any braces. */
function screenType(appSource: string): string {
  const start = appSource.indexOf('type Screen =');
  if (start < 0) return '';
  let depth = 0;
  for (let i = start; i < appSource.length; i++) {
    const char = appSource[i];
    if (char === '{') depth++;
    else if (char === '}') depth--;
    else if (char === ';' && depth === 0) return appSource.slice(start, i);
  }
  return appSource.slice(start);
}

/** `<dialog>`, or a `role` of dialog/alertdialog written as a string or a JSX expression (`role={'dialog'}`). */
const DIALOG = /<dialog\b|role=\{?\s*["'`]?(alert)?dialog\b/;

/** App routes (the `name` literals of App.tsx's Screen union) and dialog components (by file basename). */
export function appScreens(
  appSource: string,
  uiFiles: readonly { path: string; source: string }[],
): { routes: string[]; dialogs: string[] } {
  const routes = new Set(
    [...screenType(appSource).matchAll(/\bname:\s*['"]([^'"]+)['"]/g)].map((m) => m[1] ?? ''),
  );
  const dialogs = uiFiles
    .filter((file) => DIALOG.test(file.source))
    .map((file) => (file.path.split(/[\\/]/).pop() ?? '').replace(/\.tsx$/, ''));
  return { routes: [...routes].sort(), dialogs: [...new Set(dialogs)].sort() };
}

/** Messages for found screens and dialogs missing from `list`, and for stale entries (A-4), sorted. */
export function unlistedScreens(
  found: { routes: string[]; dialogs: string[] },
  list: readonly ScreenEntry[],
): string[] {
  const listedRoutes = new Set(list.flatMap((e) => (e.kind === 'screen' ? [e.route] : [])));
  const listedDialogs = new Set(list.flatMap((e) => (e.kind === 'dialog' ? [e.component] : [])));
  const routes = new Set(found.routes);
  const dialogs = new Set(found.dialogs);
  return [
    ...found.routes
      .filter((route) => !listedRoutes.has(route))
      .map((route) => `screen ${route} is not in the screen list`),
    ...found.dialogs
      .filter((dialog) => !listedDialogs.has(dialog))
      .map((dialog) => `dialog ${dialog} is not in the screen list`),
    ...list
      .filter((e) => (e.kind === 'screen' ? !routes.has(e.route) : !dialogs.has(e.component)))
      .map((e) => `screen list entry ${e.id} matches no screen or dialog in the app`),
  ].sort();
}

const PAYMENT_API =
  /\b(?:PaymentRequest|PaymentResponse|PaymentRequestUpdateEvent|PaymentMethodChangeEvent|PaymentAddress)\b|canMakePayment/g;

const PROVIDER_HOSTS = [
  'stripe.com',
  'stripe.network',
  'paypal.com',
  'paypalobjects.com',
  'braintreegateway.com',
  'braintree-api.com',
  'adyen.com',
  'checkout.com',
  'squareup.com',
  'squarecdn.com',
  'razorpay.com',
  'klarna.com',
  'mollie.com',
  'paddle.com',
  'pay.google.com',
  'apple-pay-gateway.apple.com',
  'skrill.com',
  'neteller.com',
  'venmo.com',
  'coinbase.com',
  'chargebee.com',
  'recurly.com',
  'lemonsqueezy.com',
];
const PROVIDER_URL = new RegExp(
  String.raw`(?<![\w-])(?:[a-z0-9-]+\.)*(?:${PROVIDER_HOSTS.map((h) => h.replaceAll('.', String.raw`\.`)).join('|')})(?![\w-])`,
  'gi',
);

const PAYMENT_LIBRARY =
  /(^|[@/-])(stripe|paypal|braintree|adyen|square|razorpay|klarna|mollie|paddle|chargebee|recurly|lemonsqueezy|revenuecat|payment|payments|billing|checkout)([/-]|$)/i;

const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
];

const unique = (values: Iterable<string>): string[] => [...new Set(values)];

/** Payment Request API uses and payment-provider hosts in `files`, then payment libraries in `pkg`. */
export function paymentFindings(
  files: readonly { name: string; text: string }[],
  pkg: Record<string, unknown>,
): string[] {
  const api = files.flatMap((file) =>
    unique([...file.text.matchAll(PAYMENT_API)].map((m) => m[0])).map(
      (match) => `${file.name}: Payment Request API (${match})`,
    ),
  );
  const urls = files.flatMap((file) =>
    unique([...file.text.matchAll(PROVIDER_URL)].map((m) => m[0])).map(
      (host) => `${file.name}: payment-provider URL (${host})`,
    ),
  );
  const libraries = DEPENDENCY_FIELDS.flatMap((field) => {
    const deps = pkg[field];
    return typeof deps === 'object' && deps !== null ? Object.keys(deps) : [];
  })
    .filter((name) => PAYMENT_LIBRARY.test(name))
    .map((name) => `package.json: payment library ${name}`);
  return [...api, ...urls, ...unique(libraries)];
}
