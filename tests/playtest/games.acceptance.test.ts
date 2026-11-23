import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { tagPolicy } from '../../src/bots/tag';
import { applyAction, createHand, type SeatConfig } from '../../src/engine/hand';
import { main } from '../../src/playtest/cli';
import {
  handReplayCode,
  runPlaytest,
  type GameType,
  type PlayedHand,
  type PlaytestSeams,
} from '../../src/playtest/runner';
import { randomMovePolicy, seatGenerator } from '../../src/playtest/policy';
import { REPO_ROOT, sandboxEnv } from '../support/sandbox';

const SLOW = process.env.TLH_SLOW_TESTS === '1';
const TEST_TIMEOUT_MS = 120_000;
const SEATS = [1, 2, 3, 4, 5, 6];
const SNG_TABLE_LINE =
  'Table: 6 players, sit-and-go 20/40 (blinds 10/20), 1500 chips each, busted seats sit out, a new sit-and-go starts when one player has all the chips';

function collect(hands: number, seed: number, size: number, game: GameType, seams?: PlaytestSeams) {
  const played: PlayedHand[] = [];
  const summary = runPlaytest({ hands, seed, size, game }, (hand) => played.push(hand), seams);
  return { played, summary };
}

function capture(argv: string[], seams?: PlaytestSeams) {
  let out = '';
  const code = main(argv, { out: (t) => (out += t), err: (t) => (out += t) }, seams);
  return { code, out };
}

const sngCli = new Map<number, { status: number | null; lines: string[] }>();
/** `npm run playtest -- --hands <hands> --game sng --seed 42`, run once per hand count and shared. */
function sngPlaytest(hands: number) {
  let cli = sngCli.get(hands);
  if (cli === undefined) {
    const result = spawnSync(
      'npm',
      ['run', 'playtest', '--', '--hands', String(hands), '--game', 'sng', '--seed', '42'],
      { cwd: REPO_ROOT, env: sandboxEnv(), encoding: 'utf8', timeout: TEST_TIMEOUT_MS },
    );
    cli = { status: result.status, lines: result.stdout.split('\n') };
    sngCli.set(hands, cli);
  }
  return cli;
}

const finals = (hand: PlayedHand): SeatConfig[] =>
  hand.final.players.map(({ seat, stack }) => ({ seat, stack }));

/** Seats with chips clockwise after `from` (ascending seat order, wrapping). */
function liveAfter(chips: Map<number, number>, from: number): number[] {
  const live = [...chips.keys()].filter((seat) => (chips.get(seat) ?? 0) > 0).sort((a, b) => a - b);
  const start = live.findIndex((seat) => seat > from);
  return start <= 0 ? live : [...live.slice(start), ...live.slice(0, start)];
}

// The 10,000-hand runs are opt-in (TLH_SLOW_TESTS=1); every push runs the same checks on 1,000 hands.
const RUNS = [
  { hands: 10_000, test: it.runIf(SLOW), suffix: '', lastCode: '000000000000002a0000000100002710' },
  {
    hands: 1_000,
    test: it,
    suffix: ' (1,000 hands)',
    lastCode: '000000000000002a00000001000003e8',
  },
];

describe('cash and sit-and-go playtest games', () => {
  for (const { hands, test, suffix, lastCode } of RUNS) {
    test(
      `AC#6 sit-and-go playtest restarts at 1,500 chips, never refills busted seats and skips them${suffix}`,
      () => {
        // The pre-TASK-6.2 default: pure TAG at 6 dealt-in seats, random-move otherwise (TASK-6.2 Q-4).
        // Seed 42's first sit-and-go ends at hand 4,740, so this cheap mostly-random run stays at
        // 10,000 hands in both versions; only the TAG CLI run below scales with `hands`.
        const { played, summary } = collect(10_000, 42, 6, 'sng', {
          makePolicy: (code, seat) => {
            const random = randomMovePolicy(seatGenerator(code, seat));
            return (view) => (view.players.length === 6 ? tagPolicy(view) : random(view));
          },
        });
        expect(played).toHaveLength(10_000);
        const chips = new Map<number, number>();
        let fresh = true;
        let previousButton = 0;
        let completed = 0;
        let firstCompletion = 0;
        let shortHanded = 0;
        let headsUp = 0;
        let skipped = 0;
        for (const hand of played) {
          const { record, final } = hand;
          expect(record.stakes).toEqual({ smallBlind: 10, bigBlind: 20, smallBet: 20, bigBet: 40 });
          const sb = final.actions.filter((a) => a.type === 'small-blind');
          const bb = final.actions.filter((a) => a.type === 'big-blind');
          expect(sb).toHaveLength(1);
          expect(bb).toHaveLength(1);
          if (fresh) {
            expect(record.seats).toEqual(SEATS.map((seat) => ({ seat, stack: 1500 })));
            expect(record.button).toBe(1);
          } else {
            const live = liveAfter(chips, previousButton);
            expect(record.seats).toEqual(
              [...live].sort((a, b) => a - b).map((seat) => ({ seat, stack: chips.get(seat) })),
            );
            const button = live[0] as number;
            expect(record.button).toBe(button);
            const order = liveAfter(chips, button);
            const [small, big] = order.length === 2 ? [button, order[0]] : [order[0], order[1]];
            expect(sb[0]?.seat).toBe(small);
            expect(bb[0]?.seat).toBe(big);
            let seat = previousButton;
            while (seat !== big) {
              seat = (seat % 6) + 1;
              if ((chips.get(seat) ?? 0) === 0) {
                skipped++;
                break;
              }
            }
          }
          if (record.seats.length < 6) shortHanded++;
          if (record.seats.length === 2) headsUp++;
          expect(hand.violations).toBe(0);
          chips.clear();
          for (const seat of SEATS) chips.set(seat, 0);
          for (const { seat, stack } of finals(hand)) chips.set(seat, stack);
          previousButton = record.button;
          fresh = [...chips.values()].filter((stack) => stack > 0).length < 2;
          if (fresh) {
            completed++;
            if (firstCompletion === 0) firstCompletion = hand.number;
          }
        }
        expect(summary.violations).toBe(0);
        expect(completed).toBeGreaterThanOrEqual(1);
        expect(firstCompletion).toBeLessThan(10_000);
        expect(played[firstCompletion]?.record.seats).toEqual(
          SEATS.map((seat) => ({ seat, stack: 1500 })),
        );
        expect(played[firstCompletion]?.record.button).toBe(1);
        expect(shortHanded).toBeGreaterThan(0);
        expect(headsUp).toBeGreaterThan(0);
        expect(skipped).toBeGreaterThan(0);

        const cli = sngPlaytest(hands);
        expect(cli.status).toBe(0);
        expect(cli.lines).toContain(`Options: --hands ${hands} --seed 42 --size 6 --game sng`);
        expect(cli.lines).toContain(SNG_TABLE_LINE);
        expect(cli.lines).toContain(`Hands played: ${hands}`);
        expect(cli.lines).toContain('Invariant violations: 0');
      },
      TEST_TIMEOUT_MS,
    );

    test(
      `AC#7 cash playtest keeps real stacks, rebuys only busted seats and has all-ins and side pots${suffix}`,
      () => {
        const { played, summary } = collect(hands, 42, 6, 'cash');
        let expected = SEATS.map((seat) => ({ seat, stack: 160 }));
        let rebuys = 0;
        let allIns = 0;
        let sidePots = 0;
        for (const hand of played) {
          expect(hand.record.stakes).toEqual({
            smallBlind: 2,
            bigBlind: 4,
            smallBet: 4,
            bigBet: 8,
          });
          expect(hand.record.seats).toEqual(expected);
          rebuys += hand.final.players.filter((p) => p.stack === 0).length;
          if (hand.final.players.some((p) => p.allIn)) allIns++;
          if ((hand.final.result?.awards.length ?? 0) > 1) sidePots++;
          expected = finals(hand).map(({ seat, stack }) => ({
            seat,
            stack: stack === 0 ? 160 : stack,
          }));
        }
        expect(rebuys).toBeGreaterThan(0);
        expect(allIns).toBeGreaterThan(0);
        expect(sidePots).toBeGreaterThan(0);
        expect(summary.violations).toBe(0);

        const run = capture(['--hands', String(hands), '--seed', '42']);
        expect(run.code).toBe(0);
        const lines = run.out.split('\n');
        expect(lines).toContain(
          'Table: 6 players, cash $4/$8, stacks carry over, a busted seat rebuys for $160',
        );
        expect(lines).toContain('Invariant violations: 0');
      },
      TEST_TIMEOUT_MS,
    );

    test(
      `AC#8 sng and cash replay codes differ only in word 2${suffix}`,
      () => {
        for (const seed of [0, 42, 2 ** 32 + 5, 9007199254740991]) {
          for (const k of [1, 2, 255, 10_000]) {
            const sng = handReplayCode(seed, k, 'sng');
            const cash = handReplayCode(seed, k, 'cash');
            expect(sng.slice(0, 16)).toBe(cash.slice(0, 16));
            expect(sng.slice(24)).toBe(cash.slice(24));
            expect(sng.slice(16, 24)).toBe('00000001');
            expect(cash.slice(16, 24)).toBe('00000000');
            expect(cash.slice(24)).toBe(k.toString(16).padStart(8, '0'));
            expect(handReplayCode(seed, k)).toBe(cash);
          }
        }
        expect(handReplayCode(42, 1, 'sng')).toBe('000000000000002a0000000100000001');
        expect(handReplayCode(42, 1)).toBe('000000000000002a0000000000000001');
        expect(handReplayCode(42, 10_000, 'sng')).toBe('000000000000002a0000000100002710');

        const { played } = collect(3, 42, 6, 'sng');
        expect(played.map((h) => h.record.replayCode)).toEqual(
          [1, 2, 3].map((k) => handReplayCode(42, k, 'sng')),
        );
        const cli = sngPlaytest(hands);
        expect(cli.lines).toContain('First replay code: 000000000000002a0000000100000001');
        expect(cli.lines).toContain(`Last replay code: ${lastCode}`);
      },
      TEST_TIMEOUT_MS,
    );
  }

  it(
    'AC#9 each seat starts with its previous final stack and a mismatch is reported at the deal',
    () => {
      for (const game of ['cash', 'sng'] as const) {
        const { played } = collect(2000, 9, 4, game);
        let previous: PlayedHand | null = null;
        for (const hand of played) {
          expect(hand.dealViolations).toEqual([]);
          const continues =
            previous !== null &&
            (game === 'cash' || previous.final.players.filter((p) => p.stack > 0).length >= 2);
          if (previous !== null && continues) {
            const before = new Map(finals(previous).map((s) => [s.seat, s.stack]));
            for (const p of hand.final.players) {
              const last = before.get(p.seat) ?? 0;
              expect(p.startingStack).toBe(game === 'cash' && last === 0 ? 160 : last);
            }
            if (game === 'sng') {
              const dealt = new Set(hand.final.players.map((p) => p.seat));
              for (const [seat, stack] of before)
                if (stack === 0) expect(dealt.has(seat)).toBe(false);
            }
          }
          previous = hand;
        }
      }

      const seams: PlaytestSeams = {
        engine: {
          createHand: (c) =>
            createHand({
              ...c,
              seats: c.seats.map((s) => (s.seat === 1 ? { ...s, stack: s.stack + 1 } : s)),
            }),
          applyAction,
        },
      };
      const { played, summary } = collect(3, 42, 6, 'cash', seams);
      const [first, second, third] = played as [PlayedHand, PlayedHand, PlayedHand];
      const seat1 = first.final.players.find((p) => p.seat === 1)?.stack ?? 0;
      const f = seat1 === 0 ? 160 : seat1;
      expect(first.violations).toBe(0);
      expect(second.dealViolations).toEqual([
        { invariant: 'chips', message: `seat 1 starts with $${f + 1} but should start with $${f}` },
      ]);
      expect(second.final.result).toBeNull();
      expect(second.final.actions.map((a) => a.type)).toEqual(['small-blind', 'big-blind']);
      expect(third.violations).toBe(0);
      expect(third.record.seats).toEqual(SEATS.map((seat) => ({ seat, stack: 160 })));
      expect(summary.violations).toBe(1);
      expect(summary.violationCounts.chips).toBe(1);
      expect(summary.firstViolation).toBe(second);

      const run = capture(['--hands', '3', '--seed', '42'], seams);
      expect(run.code).toBe(1);
      const lines = run.out.split('\n');
      expect(lines).toContain('First violation: hand 2, at the deal');
      expect(lines).toContain(
        `Violation: chips: seat 1 starts with $${f + 1} but should start with $${f}`,
      );
      expect(
        lines.some((line) =>
          line.startsWith(
            'Replay: npm run playtest -- --replay-code 000000000000002a0000000000000002 --size 6 --button 2 --stacks ',
          ),
        ),
      ).toBe(true);
    },
    TEST_TIMEOUT_MS,
  );
});
