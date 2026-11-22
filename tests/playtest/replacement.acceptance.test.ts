import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { replacementStyles, type LineUpPreset } from '../../src/bots/lineup';
import type { SeatNumber } from '../../src/engine/hand';
import { checkStep } from '../../src/engine/invariants';
import { formatHand, main } from '../../src/playtest/cli';
import {
  handReplayCode,
  runPlaytest,
  type ActionHook,
  type PlayedHand,
  type PlaytestSeams,
} from '../../src/playtest/runner';
import { drawReplacementStyle } from '../../src/table/session';
import { REPO_ROOT, sandboxEnv } from '../support/sandbox';

const SLOW = process.env.TLH_SLOW_TESTS === '1';
const TEST_TIMEOUT_MS = 120_000;
const SLOW_RUN_LIMIT_MS = 300_000;

interface Replacement {
  hand: number;
  seat: SeatNumber;
  name: string | null;
  style: string | null;
}

/** Every hand of a 300-hand seed-42 cash run of `preset`, and its summary. */
function run(preset: LineUpPreset) {
  const hands: PlayedHand[] = [];
  const summary = runPlaytest({ hands: 300, seed: 42, size: 6, lineUp: preset }, (hand) =>
    hands.push(hand),
  );
  return { hands, summary };
}

function replacements(hands: readonly PlayedHand[]): Replacement[] {
  return hands.flatMap((hand) =>
    (hand.replaced ?? []).map((seat) => {
      const { name, style } = hand.lineUp?.[seat - 1] ?? { name: null, style: null };
      return { hand: hand.number, seat, name, style };
    }),
  );
}

function capture(argv: string[], seams?: PlaytestSeams) {
  let out = '';
  let err = '';
  const code = main(argv, { out: (t) => (out += t), err: (t) => (err += t) }, seams);
  return { code, out, err };
}

/** checkStep, plus a 'test' violation on the first player action of hand `target` (counted from 1). */
function flagFirstActionOfHand(target: number): ActionHook {
  let hand = 0;
  return (step) => {
    const playerActions = step.before.actions.filter(
      (a) => a.type !== 'small-blind' && a.type !== 'big-blind',
    );
    if (playerActions.length === 0) hand++;
    return hand === target && playerActions.length === 0
      ? [{ invariant: 'test', message: 'flagged' }]
      : checkStep(step);
  };
}

/** The printed hand block (from its "Hand n:" line to its Result line) with the hand number removed. */
function handLines(out: string): string {
  const lines = out.split('\n');
  const start = lines.findIndex((line) => /^Hand \d+: /.test(line));
  const end = lines.findIndex((line, i) => i > start && line.startsWith('Result: '));
  return lines
    .slice(start, end + 1)
    .join('\n')
    .replace(/^Hand \d+: /, 'Hand: ');
}

describe('replacement bots in the playtest', () => {
  it(
    'a cash line-up playtest replaces busted bots the same way every run',
    () => {
      const first = run('Mixed');
      const second = run('Mixed');
      const replaced = replacements(first.hands);
      expect(replaced.length).toBeGreaterThan(0);
      expect(replacements(second.hands)).toEqual(replaced);
      expect(first.summary).toEqual(second.summary);
      expect(first.summary.violations).toBe(0);
      const cli = capture(['--hands', '300', '--seed', '42', '--lineup', 'mixed']);
      expect(cli.code).toBe(0);
      expect(cli.out.endsWith(`Invariant violations: 0\nBots replaced: ${replaced.length}\n`)).toBe(
        true,
      );

      const mixedStyles = replacementStyles('Mixed', 6);
      for (const [i, hand] of first.hands.entries()) {
        const seats = hand.lineUp ?? [];
        expect(seats).toHaveLength(6);
        expect(hand.replaced).toBeDefined();
        expect(hand.replaced).not.toContain(1);
        const previous = first.hands[i - 1];
        for (const seat of seats) {
          const isNew = hand.replaced?.includes(seat.seat) ?? false;
          if (previous === undefined) {
            expect(isNew).toBe(false);
            continue;
          }
          const before = previous.lineUp?.[seat.seat - 1];
          if (!isNew) {
            expect(seat).toEqual(before);
            continue;
          }
          const endStack = previous.final.players.find((p) => p.seat === seat.seat)?.stack;
          expect(endStack).toBe(0);
          expect(hand.record.seats.find((s) => s.seat === seat.seat)?.stack).toBe(160);
          expect(mixedStyles).toContain(seat.style);
          expect(seat.style).toBe(
            drawReplacementStyle('Mixed', 6, handReplayCode(42, hand.number - 1), seat.seat),
          );
          expect(seats.filter((s) => s.name === seat.name)).toHaveLength(1);
          expect(seat.name).not.toBe(before?.name);
        }
      }

      const soft = replacements(run('Soft').hands);
      expect(soft.length).toBeGreaterThan(0);
      for (const { style } of soft) expect(['Calling station', 'Rock']).toContain(style);
    },
    TEST_TIMEOUT_MS,
  );

  it(
    'a violation after a replacement prints a Replay line that reproduces the hand',
    () => {
      const { hands } = run('Mixed');
      const firstReplaced = hands.find((hand) => (hand.replaced ?? []).length > 0) as PlayedHand;
      const k = firstReplaced.number;
      const slugs = (firstReplaced.lineUp ?? [])
        .slice(1)
        .map((s) => String(s.style).toLowerCase().replace(' ', '-'))
        .join(',');

      const violating = capture(['--hands', String(k), '--seed', '42', '--lineup', 'mixed'], {
        onAction: flagFirstActionOfHand(k),
      });
      expect(violating.code).toBe(1);
      expect(violating.out).toContain(`First violation: hand ${k}, player action 1 (`);
      const replayLine = violating.out
        .split('\n')
        .find((line) => line.startsWith('Replay: ')) as string;
      expect(replayLine.endsWith(` --lineup mixed --styles ${slugs}`)).toBe(true);

      const replayArgs = replayLine.slice(replayLine.indexOf(' -- ') + 4).split(' ');
      const replayed = capture(replayArgs, { onAction: flagFirstActionOfHand(1) });
      expect(replayed.code).toBe(1);
      expect(replayed.out).toContain(` --lineup mixed --styles ${slugs}\n`);
      expect(handLines(replayed.out)).toBe(
        handLines(violating.out.slice(violating.out.indexOf('Replay: '))),
      );

      // Every hand with a replaced bot replays in full from its printed options.
      for (const hand of hands.filter((h) => (h.replaced ?? []).length > 0)) {
        const styles = (hand.lineUp ?? [])
          .slice(1)
          .map((s) => String(s.style).toLowerCase().replace(' ', '-'))
          .join(',');
        const stacks = Array.from(
          { length: 6 },
          (_, i) => hand.record.seats.find((s) => s.seat === i + 1)?.stack ?? 0,
        ).join(',');
        const full = capture([
          '--replay-code',
          hand.record.replayCode,
          '--button',
          String(hand.record.button),
          '--stacks',
          stacks,
          '--lineup',
          'mixed',
          '--styles',
          styles,
        ]);
        expect(full.code).toBe(0);
        expect(full.out).toContain(formatHand({ ...hand, number: 1 }));
      }

      const code = handReplayCode(42, 1);
      for (const argv of [
        ['--hands', '5', '--lineup', 'mixed', '--styles', slugs],
        ['--replay-code', code, '--styles', slugs],
        ['--replay-code', code, '--lineup', 'mixed', '--styles', 'tag,tag'],
        ['--replay-code', code, '--lineup', 'mixed', '--styles', 'tag,tag,tag,tag,loose'],
      ]) {
        const bad = capture(argv);
        expect(bad.code).toBe(2);
        expect(bad.out).toBe('');
        expect(bad.err.startsWith('Error: --styles ')).toBe(true);
      }
    },
    TEST_TIMEOUT_MS,
  );

  it.runIf(SLOW)(
    '10,000 Mixed hands replace busted bots with zero violations (slow, opt-in)',
    () => {
      const args = [
        'run',
        'playtest',
        '--',
        '--hands',
        '10000',
        '--seed',
        '42',
        '--lineup',
        'mixed',
      ];
      const spawn = () =>
        spawnSync('npm', args, {
          cwd: REPO_ROOT,
          env: sandboxEnv(),
          encoding: 'utf8',
          timeout: SLOW_RUN_LIMIT_MS,
        });
      const first = spawn();
      expect(first.status).toBe(0);
      expect(first.stdout).toContain('Invariant violations: 0\n');
      const replaced = /^Bots replaced: (\d+)$/m.exec(first.stdout);
      expect(Number(replaced?.[1])).toBeGreaterThanOrEqual(1);
      expect(spawn().stdout).toBe(first.stdout);
    },
    SLOW_RUN_LIMIT_MS * 2 + 60_000,
  );
});
