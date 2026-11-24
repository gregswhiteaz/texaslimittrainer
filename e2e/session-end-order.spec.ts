import { expect, test, type Page } from '@playwright/test';
import { header, storedRecords, storedReports, storedSessions } from './support/hand-records';
import { runUntil } from './support/paused-clock';
import { stubReplayWords } from './support/table-harness-bundle';

// TASK-10.1 fix brief item 1: Leave table ends the session only after every table write, including the
// last hand's write queued by the effect of the commit that showed its result.

const WORDS = [0x9e3779b9, 1, 2, 3];

type Json = Record<string, unknown>;

interface HoldWindow {
  __releaseGrades?: () => void;
  __leftInGap?: boolean;
}

const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });
const resumeButton = (page: Page) => page.getByRole('button', { name: /^Resume session/ });
const reportHeading = (page: Page) =>
  page.getByRole('heading', { level: 1, name: 'Session report' });
const tableSection = (page: Page) => page.getByRole('region', { name: 'Table' });

/**
 * Init script: holds every advice-worker grade reply (so the hand's write cannot finish) until
 * window.__releaseGrades(), and clicks Leave table from the MutationObserver microtask in which Hand over
 * first reaches the DOM, before React runs that commit's passive effects (which queue the hand's write).
 */
function holdGradesAndLeaveOnHandOver(): void {
  const w = window as HoldWindow;
  const RealWorker = window.Worker;
  const held: (() => void)[] = [];
  const released = new WeakSet<Event>();
  let holding = true;
  w.__releaseGrades = () => {
    holding = false;
    for (const deliver of held.splice(0)) deliver();
  };
  class HoldingWorker extends RealWorker {
    readonly #grades = new Set<unknown>();
    constructor(url: string | URL, options?: WorkerOptions) {
      super(url, options);
      this.addEventListener('message', (event: MessageEvent<{ id?: unknown } | null>) => {
        if (!holding || released.has(event) || !this.#grades.has(event.data?.id)) return;
        event.stopImmediatePropagation();
        held.push(() => {
          const again = new MessageEvent('message', { data: event.data });
          released.add(again);
          this.dispatchEvent(again);
        });
      });
    }
    override postMessage(message: unknown, options?: Transferable[] | StructuredSerializeOptions) {
      const request = message as { kind?: unknown; id?: unknown } | null;
      if (request?.kind === 'grade') this.#grades.add(request.id);
      super.postMessage(message, options as StructuredSerializeOptions);
    }
  }
  window.Worker = HoldingWorker;
  new MutationObserver((_records, observer) => {
    const over = [...document.querySelectorAll('[role="status"]')].some((el) =>
      el.textContent?.includes('Hand over'),
    );
    if (!over) return;
    observer.disconnect();
    const leave = [...document.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Leave table',
    );
    w.__leftInGap = leave !== undefined;
    leave?.click();
  }).observe(document, { childList: true, subtree: true, characterData: true });
}

test('Leave table before the last hand is written ends the session after that write', async ({
  page,
}) => {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(stubReplayWords, WORDS);
  await page.addInitScript(holdGradesAndLeaveOnHandOver);
  await page.goto('/');
  await page.getByRole('button', { name: /^New game/ }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  await runUntil(page, async () => (await header(page).count()) > 0, { label: 'no table' });

  // Plays hand 1, folding (or checking) at the user's turns; the init script leaves as its result appears.
  const left = () => page.evaluate(() => (window as HoldWindow).__leftInGap === true);
  const actions = page.locator('[aria-label="Your actions"] button:not(:disabled)');
  for (let slice = 0; slice < 2000 && !(await left()); slice++) {
    const names = await actions.allTextContents();
    const play = ['Fold', 'Check'].find((name) => names.includes(name));
    if (play === undefined) await page.clock.runFor(50);
    else await actions.filter({ hasText: new RegExp(`^${play}$`) }).click();
  }
  expect(await left()).toBe(true);
  await expect(tableSection(page)).toHaveCount(0);
  await page.clock.runFor(5000);
  expect(await storedRecords(page)).toEqual([]);
  await expect(reportHeading(page)).toHaveCount(0);

  await page.evaluate(() => (window as HoldWindow).__releaseGrades?.());
  await expect(reportHeading(page)).toBeFocused();
  await expect(page.locator('.report-header-line')).toHaveText('Cash · 6 players · $4/$8 · 1 hand');
  expect((await storedRecords(page)).map((r) => r.handNumber)).toEqual([1]);
  const [session] = (await storedSessions(page)) as [Json];
  expect(session.handsPlayed).toBe(1);
  expect(typeof session.endedAt).toBe('string');
  expect(await storedReports(page)).toHaveLength(1);

  await page.getByRole('button', { name: 'Back to Home' }).click();
  await expect(menu(page)).toHaveAttribute('data-paused', 'none');
  await expect(resumeButton(page)).toHaveCount(0);
  await page.reload();
  await expect(menu(page)).toHaveAttribute('data-paused', 'none');
  await expect(resumeButton(page)).toHaveCount(0);
});
