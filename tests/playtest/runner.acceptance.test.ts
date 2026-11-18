import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import type { HandState } from '../../src/engine/hand';
import { formatHand, main } from '../../src/playtest/cli';
import { replayHand, runPlaytest, type PlayedHand } from '../../src/playtest/runner';
import { REPO_ROOT, sandboxEnv } from '../support/sandbox';

const TEST_TIMEOUT_MS = 120_000;

function collect(hands: number, seed: number, size: number) {
  const played: PlayedHand[] = [];
  const summary = runPlaytest({ hands, seed, size }, (hand) => played.push(hand));
  return { played, summary };
}

/** Bet count per street: the big blind counts as 1 preflop, then every bet and raise. */
function betCounts(state: HandState): number[] {
  const counts = new Map<string, number>();
  for (const a of state.actions) {
    if (a.type === 'big-blind' || a.type === 'bet' || a.type === 'raise') {
      counts.set(a.street, (counts.get(a.street) ?? 0) + 1);
    }
  }
  return [...counts.values()];
}

describe('playtest runner', () => {
  it('AC#1 hands are real engine hands at $4/$8 with $160 stacks', () => {
    const { played, summary } = collect(600, 42, 6);
    expect(played).toHaveLength(600);
    for (const hand of played) {
      const { record, final } = hand;
      expect(record.stakes).toEqual({ smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 });
      expect(record.seats).toEqual([1, 2, 3, 4, 5, 6].map((seat) => ({ seat, stack: 160 })));
      expect(final.result).not.toBeNull();
      expect(replayHand(record).result).toEqual(final.result);
    }
    expect(summary.handsPlayed).toBe(600);
    expect(summary.violations).toBe(0);
  });

  it(
    'AC#2 every hand is dealt to exactly n players for n = 3..10',
    () => {
      for (let n = 3; n <= 10; n++) {
        const { played } = collect(200, 7, n);
        expect(played).toHaveLength(200);
        const seats = Array.from({ length: n }, (_, i) => i + 1);
        for (const { final } of played) {
          expect(final.players.map((p) => p.seat)).toEqual(seats);
          const hole = final.players.flatMap((p) => p.holeCards);
          expect(hole).toHaveLength(2 * n);
          expect(new Set(hole).size).toBe(2 * n);
        }
      }
      const run = spawnSync(
        'npm',
        ['run', 'playtest', '--', '--hands', '50', '--seed', '7', '--size', '10'],
        {
          cwd: REPO_ROOT,
          env: sandboxEnv(),
          encoding: 'utf8',
          timeout: TEST_TIMEOUT_MS,
        },
      );
      expect(run.status).toBe(0);
      const lines = run.stdout.split('\n');
      expect(lines.some((line) => line.startsWith('Table: 10 players, '))).toBe(true);
      expect(lines).toContain('Hands played: 50');
    },
    TEST_TIMEOUT_MS,
  );

  it('AC#5 a recorded hand replays with the same hole cards and board', () => {
    for (const size of [3, 6, 9, 10]) {
      for (const { record, final } of collect(100, 5, size).played) {
        const replayed = replayHand(record);
        for (const player of final.players) {
          const again = replayed.players.find((p) => p.seat === player.seat);
          expect(again?.holeCards).toEqual(player.holeCards);
        }
        expect(replayed.board).toEqual(final.board);
        expect(replayed.burned).toEqual(final.burned);
        expect(replayed.result).toEqual(final.result);
      }
    }

    const fourth = collect(4, 42, 6).played[3] as PlayedHand;
    expect(fourth.record.replayCode).toBe('000000000000002a0000000000000004');
    expect(fourth.record.button).toBe(4);
    let out = '';
    const code = main(
      ['--replay-code', '000000000000002a0000000000000004', '--size', '6', '--button', '4'],
      { out: (t) => (out += t), err: () => undefined },
    );
    expect(code).toBe(0);
    const block = formatHand(fourth).replace(/^Hand 4:/, 'Hand 1:');
    expect(block.startsWith('Hand 1: replay code 000000000000002a0000000000000004')).toBe(true);
    expect(out).toContain(block);
  });

  it(
    'AC#6 10,000 hands record no street with more than 4 bets',
    () => {
      let highest = 0;
      let capped = 0;
      const summary = runPlaytest({ hands: 10_000, seed: 42, size: 6 }, ({ final }) => {
        for (const count of betCounts(final)) {
          highest = Math.max(highest, count);
          if (count === 4) capped++;
        }
      });
      expect(highest).toBeLessThanOrEqual(4);
      expect(capped).toBeGreaterThan(0);
      expect(summary.cappedStreets).toBe(capped);
      expect(summary.violations).toBe(0);
    },
    TEST_TIMEOUT_MS,
  );
});
