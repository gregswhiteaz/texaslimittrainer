import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, expect, test, type BrowserContext } from '@playwright/test';
import { advanceToHand, header, playToResult, storedRecords } from './support/hand-records';
import { stubReplayWords } from './support/table-harness-bundle';

// Opt-in slow check (TASK-3.9 A-5): kills the real browser process, so Chromium only.
const SKIP = process.env.TLH_SLOW_TESTS !== '1';
const ORIGIN = 'http://localhost:4173';
const WORDS = [0x9e3779b9, 1, 2, 3];

/** SIGKILLs every process whose command line names `profile` as its --user-data-dir. */
function killBrowser(profile: string): number {
  const lines = execFileSync('ps', ['-axo', 'pid=,command='], { encoding: 'utf8' }).split('\n');
  const pids = lines
    .filter((line) => line.includes(`--user-data-dir=${profile}`))
    .map((line) => Number(line.trim().split(/\s+/)[0]));
  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      // Already gone with its parent.
    }
  }
  return pids.length;
}

test("hand 12's record survives a killed browser process", async ({ browserName }) => {
  test.skip(
    SKIP || browserName !== 'chromium',
    'kills the browser: run npm run e2e:slow (Chromium)',
  );
  test.setTimeout(180_000);
  const profile = mkdtempSync(join(tmpdir(), 'tlh-kill-'));
  let relaunched: BrowserContext | null = null;
  try {
    const context = await chromium.launchPersistentContext(profile);
    const page = context.pages()[0] ?? (await context.newPage());
    await page.clock.install({ time: 0 });
    await page.clock.pauseAt(1000);
    await page.addInitScript(stubReplayWords, WORDS);
    await page.goto(`${ORIGIN}/`);
    await page.getByRole('button', { name: 'New game' }).click();
    await page.getByRole('button', { name: 'Start game' }).click();
    const slice = () => page.clock.runFor(50);
    for (let hand = 1; hand <= 12; hand++) {
      await advanceToHand(page, hand, slice);
      await playToResult(page, hand, slice);
    }
    await expect.poll(async () => (await storedRecords(page)).length).toBe(12);
    await expect(header(page)).toHaveText(/Hand #12$/);
    const sessionId = (await storedRecords(page)).find((r) => r.handNumber === 12)?.sessionId;

    expect(killBrowser(profile)).toBeGreaterThan(0);
    await context.close().catch(() => undefined);

    relaunched = await chromium.launchPersistentContext(profile);
    const fresh = relaunched.pages()[0] ?? (await relaunched.newPage());
    await fresh.goto(`${ORIGIN}/`);
    const records = await storedRecords(fresh);
    expect(records).toHaveLength(12);
    const twelfth = records.find((r) => r.handNumber === 12);
    expect(twelfth?.sessionId).toBe(sessionId);
    expect(records.every((r) => r.sessionId === sessionId)).toBe(true);
  } finally {
    await relaunched?.close();
    rmSync(profile, { recursive: true, force: true });
  }
});
