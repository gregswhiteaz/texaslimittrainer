import { expect, test, type Page } from '@playwright/test';
import { replayCodeFromWords } from '../src/engine/deck';
import {
  addStyleCounts,
  EMPTY_STYLE_COUNTS,
  handStyleCounts,
  type StyleCounts,
} from '../src/stats/style-stats';
import { parseHandRecord, type HandRecord } from '../src/table/hand-record';
import {
  completedHand,
  countObserved,
  DEFAULT_SESSION_CONFIG,
  seatSession,
  type CompletedHand,
  type ObservedCounts,
} from '../src/table/session';
import {
  handWrite,
  type SessionRecord,
  type SessionRecordObserved,
} from '../src/table/session-record';
import { playSession } from '../tests/support/session-play';
import {
  advanceToHand,
  handOver,
  header,
  playToResult,
  seedStoredRecords,
  seedStoredSessions,
  storedRecords,
  storedSessions,
} from './support/hand-records';
import { runUntil, runUntilMyTurn } from './support/paused-clock';
import { stubReplayWords } from './support/table-harness-bundle';

// TASK-8.6: observed opponent counts are saved with each hand's session record and restored on Resume.

/** TASK-3.1's pinned replay code words: every hand of the app session is dealt from them. */
const WORDS = [0x9e3779b9, 1, 2, 3];
const SESSION_ID = 'e'.repeat(32);
const STARTED = new Date('2026-11-26T10:00:00Z');
const at = (minute: number): Date => new Date(STARTED.getTime() + minute * 60_000);
const BASIS_45 = 'based on 45 hands of this opponent';

type Json = Record<string, unknown>;

const menu = (page: Page) => page.getByRole('navigation', { name: 'Main menu' });
const resumeButton = (page: Page) => page.getByRole('button', { name: /^Resume session/ });
const homeButton = (page: Page) => page.getByRole('button', { name: 'Home', exact: true });
const newGame = (page: Page) => page.getByRole('button', { name: /^New game/ });
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const tableSection = (page: Page) => page.getByRole('region', { name: 'Table' });
const enabledActions = (page: Page) =>
  page.locator('[aria-label="Your actions"] button:not(:disabled)');
const hintToggle = (page: Page) => page.locator('button.hint-toggle');
const opponentRanges = (page: Page) =>
  page.locator('#hint-card').getByRole('list', { name: 'Opponent ranges' }).getByRole('listitem');

async function pausedClock(page: Page): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.addInitScript(stubReplayWords, WORDS);
}

/** One 50 ms slice, or Deal next hand when a review holds the next deal. */
const slice = (page: Page) => async (): Promise<void> => {
  const deal = button(page, 'Deal next hand');
  if (await deal.isVisible()) await deal.click();
  else await page.clock.runFor(50);
};

const actionCount = async (page: Page): Promise<number> =>
  Number(await tableSection(page).getAttribute('data-action-count'));

/** Check if offered, else the call; waits until it is applied. */
async function checkOrCall(page: Page): Promise<void> {
  const before = await actionCount(page);
  const check = enabledActions(page).filter({ hasText: /^Check$/ });
  await (
    (await check.count()) > 0 ? check : enabledActions(page).filter({ hasText: /^Call / })
  ).click();
  await expect.poll(() => actionCount(page)).toBeGreaterThan(before);
}

/** The session after 45 headless hands of a default 6-max session with its observed counts, and records 1–45 (A-7). */
function afterHand45(): { records: Json[]; session: SessionRecord } {
  const played = playSession(seatSession(DEFAULT_SESSION_CONFIG), 45, (n) =>
    replayCodeFromWords([0x9e3779b9, n, 2, 3]),
  );
  let counts: ObservedCounts = {};
  const writes = played.map((table, i) => {
    counts = countObserved(counts, completedHand(table) as CompletedHand);
    return handWrite(
      table,
      { sessionId: SESSION_ID, startedAt: STARTED, completedAt: at(i + 1) },
      undefined,
      counts,
    );
  });
  const last = writes.at(-1);
  if (last === undefined) throw new Error('No hands played');
  return { records: writes.map((w) => w.record as unknown as Json), session: last.session };
}

/** The `observed` entries `session` should hold: handStyleCounts of `records` summed per bot id, for the
 *  session's bot seats with at least one hand, ascending seat. */
function expectedObserved(records: readonly Json[], session: Json): SessionRecordObserved[] {
  const counts = new Map<number, StyleCounts>();
  for (const record of records.map((r) => parseHandRecord(r) as HandRecord)) {
    for (const { seat, botId } of record.seats) {
      if (botId === null) continue;
      counts.set(
        botId,
        addStyleCounts(counts.get(botId) ?? EMPTY_STYLE_COUNTS, handStyleCounts(record, seat)),
      );
    }
  }
  return [...(session.seats as SessionRecord['seats'])]
    .sort((a, b) => a.seat - b.seat)
    .flatMap(({ botId }) => {
      const c = botId === null ? undefined : counts.get(botId);
      return botId === null || c === undefined || c.handsDealt < 1
        ? []
        : [{ botId, hands: c.handsDealt, vpipHands: c.voluntary, pfrHands: c.preflopRaised }];
    });
}

/** Opens Home, seeds `records` and `sessions`, and reloads so Home reads them. */
async function homeWith(page: Page, records: readonly Json[], sessions: readonly unknown[]) {
  await page.goto('/');
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  if (records.length > 0) await page.evaluate(seedStoredRecords, [...records]);
  await page.evaluate(seedStoredSessions, [...sessions]);
  await page.reload();
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
}

test("a resumed session's hint uses the 45 hands observed before the pause", async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));
  await pausedClock(page);
  const seed = afterHand45();
  const seats = seed.session.seats;
  const observed = seed.session.observed ?? [];
  expect(observed.some((o) => o.hands === 45)).toBe(true);
  await homeWith(page, seed.records, [seed.session]);
  await expect(resumeButton(page).locator('.menu-subtitle')).toHaveText(
    'Cash · 6 players · $4/$8 · 45 hands · paused',
  );

  await resumeButton(page).click();
  await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #46');

  // Check/call to the first postflop decision whose hint lists a live 45-hand opponent.
  let decisions = 0;
  let found: { seat: number; street: string } | null = null;
  while (found === null) {
    await runUntil(
      page,
      async () => (await enabledActions(page).count()) > 0 || (await handOver(page).count()) > 0,
      { label: 'hand 46: no user turn' },
    );
    if ((await handOver(page).count()) > 0) {
      throw new Error('Hand 46 ended before a postflop decision with a live 45-hand opponent');
    }
    const street = (await tableSection(page).getAttribute('data-street')) ?? '';
    if (street !== 'preflop') {
      await hintToggle(page).click();
      await expect(page.locator('#hint-card [data-part="hint-action"]')).toHaveText(
        /^Recommended: \S/,
      );
      const lines = await opponentRanges(page).evaluateAll((items) =>
        items.map((li) => ({ seat: Number(li.dataset.seat), text: li.textContent ?? '' })),
      );
      expect(lines.length).toBeGreaterThan(0);
      for (const { seat, text } of lines) {
        const stored = seats.find((s) => s.seat === seat);
        const hands = observed.find((o) => o.botId === stored?.botId)?.hands ?? 0;
        const basis = hands >= 30 ? `based on ${hands} hands of this opponent` : 'typical player';
        expect(text).toBe(`${stored?.name ?? ''}: ${basis}`);
      }
      const live45 = lines.find((l) => l.text.endsWith(`: ${BASIS_45}`));
      if (live45 !== undefined) found = { seat: live45.seat, street };
    }
    if (found === null) {
      await checkOrCall(page);
      decisions++;
    }
  }

  const { seat, street } = found;
  const botId = seats.find((s) => s.seat === seat)?.botId;
  await checkOrCall(page);
  await playToResult(page, 46, slice(page), { play: 'call' });
  await expect.poll(async () => (await storedSessions(page))[0]?.handsPlayed).toBe(46);

  const record = (await storedRecords(page)).find((r) => r.handNumber === 46);
  const decision = (record?.decisions as HandRecord['decisions'] | undefined)?.[decisions];
  expect(decision?.street).toBe(street);
  expect(decision?.hinted).toBe(true);
  expect(decision?.opponentBasis.find((b) => b.seat === seat)?.text).toBe(BASIS_45);
  const session = (await storedSessions(page))[0] as SessionRecord | undefined;
  expect(session?.observed?.find((o) => o.botId === botId)?.hands).toBe(46);
  expect(pageErrors).toEqual([]);
});

test('a stored record with malformed observed counts is skipped and Home stays usable', async ({
  page,
}) => {
  const errors: string[] = [];
  const pageErrors: Error[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error));
  await pausedClock(page);
  const { session } = afterHand45();
  const [first, ...rest] = session.observed ?? [];
  if (first === undefined) throw new Error('No observed entry');
  const bad = { ...session, observed: [{ ...first, hands: 4.5 }, ...rest] };
  await homeWith(page, [], [bad]);

  await expect(menu(page)).toHaveAttribute('data-paused', 'none');
  await expect(resumeButton(page)).toHaveCount(0);
  await expect
    .poll(() => errors.some((text) => text.includes('Session record could not be read')))
    .toBe(true);
  expect(pageErrors).toEqual([]);

  await newGame(page).click();
  await button(page, 'Start game').click();
  await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #1');
  await runUntilMyTurn(page);
  expect(pageErrors).toEqual([]);
});

test('observed counts are saved with each hand and carried through Home and Resume', async ({
  page,
}) => {
  await pausedClock(page);
  await page.goto('/');
  await expect(menu(page)).not.toHaveAttribute('data-paused', 'loading');
  await newGame(page).click();
  await button(page, 'Start game').click();
  await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #1');

  await playToResult(page, 1, slice(page), { play: 'call' });
  await advanceToHand(page, 2, slice(page));
  await playToResult(page, 2, slice(page), { play: 'call' });
  await expect.poll(async () => (await storedSessions(page))[0]?.handsPlayed).toBe(2);
  const [after2] = await storedSessions(page);
  if (after2 === undefined) throw new Error('No stored session');
  const records2 = await storedRecords(page);
  expect(records2.map((r) => r.handNumber)).toEqual([1, 2]);
  expect(after2.observed).toEqual(expectedObserved(records2, after2));
  expect((after2.observed as SessionRecordObserved[]).length).toBeGreaterThan(0);

  await homeButton(page).click();
  await expect(menu(page)).toHaveAttribute('data-paused', 'shown');
  await resumeButton(page).click();
  await expect(header(page)).toHaveText('Cash · 6 players · $4/$8 · Hand #3');
  await playToResult(page, 3, slice(page), { play: 'call' });
  await expect.poll(async () => (await storedSessions(page))[0]?.handsPlayed).toBe(3);
  const [after3] = await storedSessions(page);
  if (after3 === undefined) throw new Error('No stored session');
  const records3 = await storedRecords(page);
  expect(records3.map((r) => r.handNumber)).toEqual([1, 2, 3]);
  const observed3 = after3.observed as SessionRecordObserved[];
  expect(observed3).toEqual(expectedObserved(records3, after3));

  // Every bot seated since hand 1 holds all 3 hands: the resumed hook started from the stored counts.
  const since1 = (after2.observed as SessionRecordObserved[])
    .filter((o) => o.hands === 2)
    .map((o) => o.botId);
  const kept = (after3.seats as SessionRecord['seats']).filter(
    (s) => s.botId !== null && since1.includes(s.botId),
  );
  expect(kept.length).toBeGreaterThan(0);
  for (const { botId } of kept) {
    expect(observed3.find((o) => o.botId === botId)?.hands).toBe(3);
  }
});
