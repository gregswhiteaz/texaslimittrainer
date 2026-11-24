import { expect, test, type Page } from '@playwright/test';
import { chartBasisText } from '../src/advice/explain';
import { GRADE_LABELS, type GradeResult } from '../src/advice/grade';
import type { PreflopRecommendation } from '../src/advice/preflop';
import type { Recommendation } from '../src/advice/recommend';
import { expectNoSeriousAxeViolations } from './support/axe';
import { axeWithPausedClock, runUntil } from './support/paused-clock';
import { buildTableScenes, openTableScene, stubReplayWords } from './support/table-harness-bundle';

// Helpers copied from e2e/review.spec.ts (paused clock, pinned words, checkOrCallToResult).

const ORIGIN = 'http://localhost:4173';
/** Pinned replay code words: 9e3779b9 00000001 00000002 00000003. */
const WORDS = [0x9e3779b9, 1, 2, 3];

interface LoggedRequest {
  id: number;
  kind: string;
  userAction: string | null;
  street: string | null;
}

interface AdviceLog {
  requests: LoggedRequest[];
  /** Reply value by request id. */
  replies: Record<number, unknown>;
  /** Grade requests posted by the end of the task in which the hand result first appeared; null until then. */
  gradesAtResult: number | null;
}

declare global {
  interface Window {
    __adviceLog: AdviceLog;
  }
}

/**
 * Init script: every Worker the page creates logs each posted request (id, kind, userAction, view.street) and
 * each reply; a MutationObserver notes the grade requests posted when the hand result appears.
 */
function logWorkerTraffic(): void {
  const log: AdviceLog = { requests: [], replies: {}, gradesAtResult: null };
  window.__adviceLog = log;
  const RealWorker = window.Worker;
  class LoggedWorker extends RealWorker {
    constructor(url: string | URL, options?: WorkerOptions) {
      super(url, options);
      this.addEventListener('message', (event: MessageEvent) => {
        const data = event.data as { id?: unknown; ok?: unknown; value?: unknown } | null;
        if (data !== null && typeof data.id === 'number' && data.ok === true) {
          log.replies[data.id] = data.value;
        }
      });
    }
    override postMessage(message: unknown, options?: unknown): void {
      const m = message as {
        id?: unknown;
        kind?: unknown;
        userAction?: unknown;
        view?: { street?: unknown };
      } | null;
      if (m !== null && typeof m === 'object' && typeof m.id === 'number') {
        log.requests.push({
          id: m.id,
          kind: String(m.kind),
          userAction: typeof m.userAction === 'string' ? m.userAction : null,
          street: typeof m.view?.street === 'string' ? m.view.street : null,
        });
      }
      super.postMessage(message, options as StructuredSerializeOptions);
    }
  }
  window.Worker = LoggedWorker;
  // Sampled in the next task (a MessagePort message, which the page clock does not hold back): the decision
  // that ends the hand is requested in the same task as the result's commit, in a microtask just after it.
  let seen = false;
  const sample = new MessageChannel();
  sample.port1.onmessage = () => {
    log.gradesAtResult = log.requests.filter((r) => r.kind === 'grade').length;
  };
  new MutationObserver(() => {
    if (seen) return;
    if (document.querySelector('[role="status"]')?.textContent?.includes('Hand over')) {
      seen = true;
      sample.port2.postMessage(null);
    }
  }).observe(document, { subtree: true, childList: true, characterData: true });
}

const tableSection = (page: Page) => page.getByRole('region', { name: 'Table' });
const yourActions = (page: Page) => page.getByRole('group', { name: 'Your actions' });
const enabledActions = (page: Page) =>
  page.locator('[aria-label="Your actions"] button:not(:disabled)');
const handOver = (page: Page) => page.getByRole('status').filter({ hasText: 'Hand over' });
const reviewPanel = (page: Page) => page.getByRole('complementary');
const adviceLog = (page: Page) => page.evaluate(() => window.__adviceLog);
const gradeRequests = async (page: Page) =>
  (await adviceLog(page)).requests.filter((r) => r.kind === 'grade');

async function actionCount(page: Page): Promise<number> {
  return Number(await tableSection(page).getAttribute('data-action-count'));
}

/** Clicks Check if offered, else Call; waits until it is applied. Returns the clicked action type. */
async function checkOrCall(page: Page): Promise<string> {
  const before = await actionCount(page);
  const texts = await yourActions(page).getByRole('button').allTextContents();
  const check = texts.includes('Check');
  await yourActions(page)
    .getByRole('button', check ? { name: 'Check', exact: true } : { name: /^Call \$\d+$/ })
    .click();
  await expect.poll(() => actionCount(page)).toBeGreaterThan(before);
  return check ? 'check' : 'call';
}

interface ShownEntry {
  street: string;
  grade: string;
  chart: string | null;
  equity: string | null;
  required: string | null;
  explanation: string;
  opponents: string[];
}

async function shownEntries(page: Page): Promise<ShownEntry[]> {
  return reviewPanel(page)
    .getByRole('list', { name: 'Decisions' })
    .locator('li[data-entry]')
    .evaluateAll((lis) =>
      lis.map((li) => {
        const part = (name: string): string | null =>
          li.querySelector(`[data-part="${name}"]`)?.textContent ?? null;
        return {
          street: part('street') ?? '',
          grade: part('grade') ?? '',
          chart: part('chart'),
          equity: part('equity'),
          required: part('required'),
          explanation: part('explanation') ?? '',
          opponents: [...li.querySelectorAll('li[data-opponent]')].map((o) => o.textContent ?? ''),
        };
      }),
    );
}

test('review entries show the grade replies the worker sent during the hand', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(logWorkerTraffic);
  await page.addInitScript(stubReplayWords, WORDS);
  await page.goto('/');
  await page.getByRole('button', { name: 'New game' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();

  const clicked: string[] = [];
  await runUntil(page, async () => {
    if ((await enabledActions(page).count()) > 0) {
      clicked.push(await checkOrCall(page));
      await expect.poll(async () => (await gradeRequests(page)).length).toBe(clicked.length);
    }
    return (await handOver(page).count()) > 0;
  });
  await expect(handOver(page)).toBeVisible();
  expect(clicked).toEqual(['call', 'call', 'call', 'call']);

  const grades = await gradeRequests(page);
  await expect.poll(async () => (await adviceLog(page)).gradesAtResult).not.toBeNull();
  expect((await adviceLog(page)).gradesAtResult).toBe(4);
  expect(grades.map((r) => r.street)).toEqual(['preflop', 'flop', 'turn', 'river']);
  expect(grades.map((r) => r.userAction)).toEqual(['call', 'call', 'call', 'call']);

  const panel = page.getByRole('complementary', { name: 'Hand #1 review' });
  await runUntil(page, async () => (await panel.count()) > 0);
  await expect(panel).toBeVisible();

  const { replies } = await adviceLog(page);
  const shown = await shownEntries(page);
  expect(shown.map((e) => e.street)).toEqual(['Preflop', 'Flop', 'Turn', 'River']);
  grades.forEach((request, i) => {
    const reply = replies[request.id] as GradeResult<Recommendation> | undefined;
    if (reply === undefined) throw new Error(`No reply to grade request ${request.id}`);
    const entry = shown[i] as ShownEntry;
    const rec = reply.recommendation;
    expect(entry.grade).toBe(GRADE_LABELS[reply.grade]);
    expect(entry.explanation).toBe(rec.explanation);
    if (rec.basis === 'chart') {
      expect(entry.chart).toBe(chartBasisText(rec as PreflopRecommendation));
      expect(entry.equity).toBeNull();
      expect(entry.required).toBeNull();
    } else {
      expect(entry.chart).toBeNull();
      expect(entry.equity).toBe(`Equity ${rec.equityPct.toFixed(1)}%`);
      expect(entry.required).toBe(`Required equity ${rec.requiredEquityPct.toFixed(1)}%`);
      expect(entry.opponents).toHaveLength(rec.opponentBasis.length);
      rec.opponentBasis.forEach((b, j) => {
        expect(entry.opponents[j]?.endsWith(`: ${b.text}`)).toBe(true);
      });
    }
  });

  await axeWithPausedClock(page);
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});

let scenes: string;
test.beforeAll(async () => {
  scenes = await buildTableScenes();
});

test('a ten-seat review with four entries fits 1280 x 720 without horizontal scrolling', async ({
  page,
}) => {
  expect(page.viewportSize()).toEqual({ width: 1280, height: 720 });
  await openTableScene(page, scenes, 'ten-seat-review');
  const panel = reviewPanel(page);
  await expect(panel).toBeVisible();
  const entries = panel.locator('li[data-entry]');
  await expect(entries).toHaveCount(4);
  const shown = await shownEntries(page);
  expect(shown.map((e) => e.street)).toEqual(['Preflop', 'Flop', 'Turn', 'River']);
  for (const entry of shown) expect(entry.explanation.length).toBeGreaterThan(0);
  for (const entry of shown.slice(1)) expect(entry.opponents).toHaveLength(9);

  const overflow = await page.evaluate(() => ({
    page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  expect(overflow.page).toBeLessThanOrEqual(0);
  const layout = await panel.evaluate((aside) => {
    const right = aside.getBoundingClientRect().right;
    const parts = [...aside.querySelectorAll('[data-part="explanation"], li[data-opponent]')];
    return {
      panel: aside.scrollWidth - aside.clientWidth,
      parts: parts.map((el) => ({
        text: el.textContent ?? '',
        beyond: el.getBoundingClientRect().right - right,
        scroll: el.scrollWidth - el.clientWidth,
      })),
    };
  });
  expect(layout.panel).toBeLessThanOrEqual(0);
  expect(layout.parts.length).toBeGreaterThanOrEqual(4 + 27);
  for (const part of layout.parts) {
    expect(part.beyond, part.text).toBeLessThanOrEqual(0);
    expect(part.scroll, part.text).toBeLessThanOrEqual(0);
  }
  await expectNoSeriousAxeViolations(page);
});
