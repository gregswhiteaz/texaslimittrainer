import { expect, test, type Locator, type Page } from '@playwright/test';
import { formatCard, parseCard, type Card } from '../src/engine/cards';
import { cardLabel } from '../src/ui/cards/card-art';
import { expectNoSeriousAxeViolations } from './support/axe';
import { playToResult, storedRecords } from './support/hand-records';
import { axeWithPausedClock, runUntil } from './support/paused-clock';
import { buildTableScenes, openTableScene, stubReplayWords } from './support/table-harness-bundle';

const ORIGIN = 'http://localhost:4173';
/** Pinned replay code words: 9e3779b9 00000001 00000002 00000003. */
const WORDS = [0x9e3779b9, 1, 2, 3];
const SUIT_GLYPHS: Record<string, string> = { c: '♣', d: '♦', h: '♥', s: '♠' };

function logRequests(page: Page): string[] {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  return requests;
}

async function cardsOf(scope: Locator): Promise<string[]> {
  return scope
    .locator('svg[data-card]')
    .evaluateAll((cards) => cards.map((c) => c.getAttribute('data-card') ?? ''));
}

/** Every data-card, aria-label, title and alt value and <title> text inside the panel, and its innerText. */
async function panelTraces(
  panel: Locator,
): Promise<{ cards: string[]; labels: string[]; text: string }> {
  return panel.evaluate((aside) => {
    const cards: string[] = [];
    const labels: string[] = [];
    for (const el of [aside, ...aside.querySelectorAll('*')]) {
      const card = el.getAttribute('data-card');
      if (card !== null) cards.push(card);
      for (const name of ['aria-label', 'title', 'alt']) {
        const value = el.getAttribute(name);
        if (value !== null) labels.push(value);
      }
      if (el.tagName.toLowerCase() === 'title') labels.push(el.textContent ?? '');
    }
    return { cards, labels, text: (aside as HTMLElement).innerText };
  });
}

function glyphForm(code: string): string {
  return `${code[0] === 'T' ? '10' : (code[0] ?? '')}${SUIT_GLYPHS[code[1] ?? ''] ?? ''}`;
}

let scenes: string;
test.beforeAll(async () => {
  scenes = await buildTableScenes();
});

test("the review shows Ben's shown cards and never Dee's mucked or folded cards", async ({
  page,
}) => {
  const requests = logRequests(page);
  expect(page.viewportSize()).toEqual({ width: 1280, height: 720 });
  await openTableScene(page, scenes, 'review-shown');
  const panel = page.getByRole('complementary', { name: 'Hand #1 review' });
  await expect(panel).toBeVisible();

  const list = panel.getByRole('list', { name: 'Shown at showdown' });
  await expect(list.getByRole('listitem')).toHaveText(['Ben showed · Pair of kings']);
  expect(await cardsOf(panel.getByRole('group', { name: "Ben's shown cards" }))).toEqual([
    'Kd',
    '7c',
  ]);

  const hidden = ['5c', '5d', '2c', '3c', '2d', '3d', '2s', '3h'];
  const traces = await panelTraces(panel);
  for (const code of hidden) {
    expect(traces.cards).not.toContain(code);
    const name = cardLabel(parseCard(code));
    for (const value of [...traces.labels, traces.text]) {
      expect(value).not.toContain(name);
      expect(value).not.toContain(glyphForm(code));
    }
  }
  await expect(page.locator('svg[data-card="5c"], svg[data-card="5d"]')).toHaveCount(0);

  const layout = await panel.evaluate((aside) => {
    const shown = aside.querySelector('ul.review-shown') as Element;
    return {
      overflow: aside.scrollWidth - aside.clientWidth,
      beyond: shown.getBoundingClientRect().right - aside.getBoundingClientRect().right,
    };
  });
  expect(layout.overflow).toBeLessThanOrEqual(0);
  expect(layout.beyond).toBeLessThanOrEqual(0);

  await expectNoSeriousAxeViolations(page);
  expect(requests.filter((url) => /^https?:/.test(url))).toEqual([]);
});

test('a fold-out review shows no opponent cards', async ({ page }) => {
  await openTableScene(page, scenes, 'review-fold-out');
  const panel = page.getByRole('complementary', { name: 'Hand #1 review' });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('list', { name: 'Shown at showdown' })).toHaveCount(0);
  expect(await cardsOf(panel)).toEqual(['Ah', '9s']);
  await expectNoSeriousAxeViolations(page);
});

test("a live review shows only the stored record's shown opponent cards", async ({ page }) => {
  const requests = logRequests(page);
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(stubReplayWords, WORDS);
  await page.goto('/');
  await page.getByRole('button', { name: 'New game' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();

  const advance = () => page.clock.runFor(50);
  await playToResult(page, 1, advance, { play: 'call' });
  const panel = page.getByRole('complementary', { name: 'Hand #1 review' });
  await runUntil(
    page,
    async () => (await panel.count()) > 0 && (await storedRecords(page)).length === 1,
    { label: 'review panel and stored record' },
  );
  await expect(panel).toBeVisible();

  const [record] = await storedRecords(page);
  if (record === undefined) throw new Error('No stored record');
  const userSeat = record.userSeat as number;
  const shown = (
    (record.shown as { shown: { seat: number; holeCards: Card[] }[] } | null)?.shown ?? []
  ).filter((s) => s.seat !== userSeat);
  const rows = await panel.locator('li[data-review-shown]').evaluateAll((items) =>
    items.map((li) => ({
      seat: Number(li.getAttribute('data-review-shown')),
      cards: [...li.querySelectorAll('svg[data-card]')].map((c) => c.getAttribute('data-card')),
    })),
  );
  expect(rows).toEqual(shown.map((s) => ({ seat: s.seat, cards: s.holeCards.map(formatCard) })));

  const allowed = new Set<Card>([
    ...(record.userHoleCards as Card[]),
    ...(record.board as Card[]),
    ...shown.flatMap((s) => s.holeCards),
  ]);
  const traces = await panelTraces(panel);
  expect(traces.cards.length).toBeGreaterThan(0);
  for (const code of traces.cards) expect(allowed).toContain(parseCard(code));
  for (let card = 0; card < 52; card++) {
    if (allowed.has(card)) continue;
    for (const label of traces.labels) expect(label).not.toContain(cardLabel(card));
  }

  await axeWithPausedClock(page);
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});
