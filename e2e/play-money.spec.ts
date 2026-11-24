import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { DEFAULT_SESSION_CONFIG, seatSession, type TableState } from '../src/table/session';
import { sessionRecord, type SessionRecord } from '../src/table/session-record';
import { handOver, header, playToResult, seedStoredSessions } from './support/hand-records';
import { runUntil, runUntilMyTurn } from './support/paused-clock';
import { paymentFindings, realMoneyOffers } from './support/play-money';
import { SCREEN_LIST, type ScreenId } from './support/screen-list';
import { stubReplayWords } from './support/table-harness-bundle';

// TASK-2.15: every listed screen and dialog shows only play money, and no payment code ships (REQ-006.3,
// REQ-061.1). See docs/ui/play-money.md.

const ORIGIN = 'http://localhost:4173';
const WORDS = [0x9e3779b9, 1, 2, 3];
const SESSION_ID = 'e'.repeat(32);
const STARTED = new Date('2026-11-23T10:00:00Z');
const ROOT = fileURLToPath(new URL('../', import.meta.url));

const visited = new Set<string>();

const fakeSlice = (page: Page) => () => page.clock.runFor(50);
const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });
const resumeButton = (page: Page) => page.getByRole('button', { name: /^Resume session/ });
const headerFor = (hand: number) => `Cash · 6 players · $4/$8 · Hand #${hand}`;

/** The A-6 seed of TASK-3.11 (copied from e2e/rebuy.spec.ts, locked): the user on $4 in the big blind of
 *  hand 13, so hand 13 busts the user under the pinned words. */
function seededSession(): SessionRecord {
  const seated = seatSession(DEFAULT_SESSION_CONFIG);
  const table: TableState = {
    ...seated,
    stacks: seated.stacks.map((s) => (s.seat === 5 ? { seat: 5, stack: 4 } : s)),
    button: 3,
    handNumber: 13,
  };
  return sessionRecord(table, { sessionId: SESSION_ID, startedAt: STARTED, updatedAt: STARTED });
}

/** Runs in the page: the text the check reads (A-7). */
function collectText(): string[] {
  const texts = [document.body.innerText];
  for (const option of document.querySelectorAll('option')) texts.push(option.textContent ?? '');
  for (const name of ['aria-label', 'aria-description', 'title', 'alt', 'placeholder']) {
    for (const el of document.querySelectorAll(`[${name}]`))
      texts.push(el.getAttribute(name) ?? '');
  }
  for (const input of document.querySelectorAll('input')) texts.push(input.value);
  return texts;
}

interface EndingWindow {
  __ending?: Promise<string[]>;
}

/** Runs in the page (A-6): records the busy `<main>`'s text as soon as the ending screen appears. */
function watchEnding(): void {
  (window as EndingWindow).__ending = new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const main = document.querySelector<HTMLElement>('main[aria-busy="true"]');
      if (main === null) return;
      observer.disconnect();
      const texts = [main.innerText];
      for (const el of [main, ...main.querySelectorAll('*')]) {
        for (const name of ['aria-label', 'aria-description', 'title', 'alt', 'placeholder']) {
          const value = el.getAttribute(name);
          if (value !== null) texts.push(value);
        }
      }
      resolve(texts);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
}

function checkTexts(id: string, texts: readonly string[]): void {
  const matches = [...new Set(texts.flatMap(realMoneyOffers))];
  if (matches.length > 0) {
    throw new Error(`Play-money check failed on ${id}: ${matches.map((m) => `"${m}"`).join(', ')}`);
  }
  visited.add(id);
}

async function checkPlayMoney(page: Page, id: ScreenId | 'fixture-deposit'): Promise<void> {
  checkTexts(id, await page.evaluate(collectText));
}

test('every listed screen and dialog shows only play money', async ({ page }) => {
  visited.clear();
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(stubReplayWords, WORDS);

  await page.goto('/');
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  await page.evaluate(seedStoredSessions, [seededSession()]);
  await page.reload();
  await expect(resumeButton(page).locator('.menu-subtitle')).toHaveText(
    'Cash · 6 players · $4/$8 · 12 hands · paused',
  );
  await checkPlayMoney(page, 'home');

  await page.getByRole('button', { name: /^New game/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'New game' })).toBeVisible();
  await checkPlayMoney(page, 'game-config');

  await page.getByRole('button', { name: 'Start game', exact: true }).click();
  const endDialog = page.getByRole('dialog', { name: 'End your paused session?' });
  await expect(endDialog).toBeVisible();
  await checkPlayMoney(page, 'end-session-dialog');

  await endDialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(endDialog).toBeHidden();
  await page.getByRole('button', { name: '← Home' }).click();
  await resumeButton(page).click();
  await expect(header(page)).toHaveText(headerFor(13));
  await checkPlayMoney(page, 'table');

  await runUntil(page, async () => (await handOver(page).count()) > 0, {
    label: 'hand 13 has no result',
  });
  const bustDialog = page.getByRole('dialog', { name: 'Out of chips' });
  await expect(bustDialog).toBeVisible();
  await checkPlayMoney(page, 'bust-dialog');

  await bustDialog.getByRole('button', { name: 'Rebuy' }).click();
  await expect(header(page)).toHaveText(headerFor(14));
  await runUntilMyTurn(page);
  await page.getByRole('button', { name: 'Hint', exact: true }).click();
  await expect(page.locator('#hint-card [data-part="hint-action"]')).toHaveText(/^Recommended: \S/);
  await checkPlayMoney(page, 'table');

  // A lone preflop fold opens no Hand Review (REQ-043.12), so the user checks or calls to the result.
  await playToResult(page, 14, fakeSlice(page), { play: 'call' });
  await expect(page.getByRole('complementary', { name: 'Hand #14 review' })).toBeVisible();
  await checkPlayMoney(page, 'table');

  await page.evaluate(watchEnding);
  await page.getByRole('button', { name: 'Leave table' }).click();
  checkTexts('ending', await page.evaluate(() => (window as EndingWindow).__ending ?? []));

  await expect(page.getByRole('heading', { level: 1, name: 'Session report' })).toBeVisible();
  await checkPlayMoney(page, 'session-report');

  const missing = SCREEN_LIST.map((e) => e.id).filter((id) => !visited.has(id));
  expect(missing, `screen list entries not visited: ${missing.join(', ')}`).toEqual([]);
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});

test('a fixture screen with a Deposit control fails the check and names it', async ({ page }) => {
  const message = 'Play-money check failed on fixture-deposit: "Deposit"';
  const failure = () =>
    checkPlayMoney(page, 'fixture-deposit').then(
      () => 'passed',
      (error: Error) => error.message,
    );
  await page.setContent('<main><h1>Fixture</h1><button type="button">Deposit</button></main>');
  expect(await failure()).toBe(message);
  await page.setContent('<main><h1>Fixture</h1><button aria-label="Deposit"></button></main>');
  expect(await failure()).toBe(message);
});

test('the built bundle and package.json carry no payment library, Payment Request API or payment-provider URL', () => {
  const dist = join(ROOT, 'dist');
  const files = readdirSync(dist, { recursive: true, encoding: 'utf8' })
    .filter((name) => /\.(js|html|css)$/.test(name))
    .map((name) => ({ name, text: readFileSync(join(dist, name), 'utf8') }));
  expect(files.filter((file) => file.name.endsWith('.js')).length).toBeGreaterThan(0);
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as Record<
    string,
    unknown
  >;
  expect(paymentFindings(files, pkg)).toEqual([]);
});
