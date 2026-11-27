import { expect, test, type Page } from '@playwright/test';
import { ERROR_HEADING } from '../src/ui/error/ErrorScreen';
import { armFault, installFaults } from './support/fault-injection';
import { header, storedRecords, storedSessions } from './support/hand-records';
import { runUntil } from './support/paused-clock';
import { stubReplayWords } from './support/table-harness-bundle';

// TASK-13.13: Return Home after an error in hand 1 steps off the Table's history entry (AC#1), and the 0-hand
// paused session it leaves is offered for Resume, as decided in Q-1 (AC#2).

const WORDS = [0x9e3779b9, 1, 2, 3];
const TABLE_KEY = /^[0-9a-f]{32}$/;

const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });
const newGame = (page: Page) => page.getByRole('button', { name: /^New game/ });
const startButton = (page: Page) => page.getByRole('button', { name: 'Start game', exact: true });
const resumeButton = (page: Page) => page.getByRole('button', { name: /^Resume session/ });
const homeHeading = (page: Page) => page.getByRole('heading', { level: 1, name: 'TLH Trainer' });
const errorHeading = (page: Page) => page.getByRole('heading', { level: 1, name: ERROR_HEADING });
const returnHome = (page: Page) => page.getByRole('button', { name: 'Return Home', exact: true });
const tableSection = (page: Page) => page.getByRole('region', { name: 'Table' });
const enabledActions = (page: Page) =>
  page.locator('[aria-label="Your actions"] button:not(:disabled)');
/** The current history entry's Table key (copied from e2e/pause-history.spec.ts). */
const tableKey = (page: Page): Promise<unknown> =>
  page.evaluate(() => (history.state as { tlhTable?: unknown } | null)?.tlhTable);

/** Runs the paused clock, folding (or checking) at the user's turns, until the error screen shows
 *  (copied from e2e/error-recovery.spec.ts). */
async function runUntilErrorScreen(page: Page): Promise<void> {
  await runUntil(
    page,
    async () => {
      if ((await errorHeading(page).count()) > 0) return true;
      if ((await enabledActions(page).count()) > 0) {
        const texts = await enabledActions(page).allTextContents();
        await enabledActions(page)
          .filter({ hasText: texts.includes('Fold') ? 'Fold' : 'Check' })
          .first()
          .click();
      }
      return false;
    },
    { label: 'error screen not shown' },
  );
}

/** Starts the default game under the paused clock, faults a bot step in hand 1 once the 0-hand start record
 *  is stored, and returns Home from the error screen. */
async function returnHomeAfterHand1Error(page: Page): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(stubReplayWords, WORDS);
  await page.addInitScript(installFaults);
  await page.goto('/');
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');

  await newGame(page).click();
  await startButton(page).click();
  await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #1');
  await expect.poll(() => tableKey(page)).toMatch(TABLE_KEY);
  await expect
    .poll(async () => (await storedSessions(page)).map((s) => s.handsPlayed))
    .toEqual([0]);

  await armFault(page, 'illegal-bot');
  await runUntilErrorScreen(page);
  await returnHome(page).click();
  await expect(homeHeading(page)).toBeFocused();
}

test('Return Home after an error in hand 1 steps off the Table history entry so one Back leaves the app', async ({
  page,
}) => {
  await returnHomeAfterHand1Error(page);
  await expect(tableSection(page)).toHaveCount(0);
  await expect.poll(() => tableKey(page)).toBeUndefined();

  await page.goBack();
  await expect.poll(() => page.url()).toBe('about:blank');
});

test('an error in hand 1 leaves a 0-hand paused session that Home offers for Resume', async ({
  page,
}) => {
  await returnHomeAfterHand1Error(page);
  await expect(menu(page)).toHaveAttribute('data-paused', 'shown');
  await expect(resumeButton(page).locator('.menu-subtitle')).toHaveText(
    'Cash · 6 players · $4/$8 · 0 hands · paused',
  );
  expect(await storedRecords(page)).toEqual([]);
  const sessions = await storedSessions(page);
  expect(sessions).toHaveLength(1);
  expect(sessions[0]?.handsPlayed).toBe(0);
  expect(sessions[0]?.endedAt ?? null).toBeNull();

  await resumeButton(page).click();
  await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #1');
});
