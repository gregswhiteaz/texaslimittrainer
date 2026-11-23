import { describe, expect, it } from 'vitest';
import { seatLineUp } from '../../src/bots/lineup';
import { decideManiac } from '../../src/bots/maniac';
import { parseStyle, type StyleName } from '../../src/bots/style';
import { decideTag } from '../../src/bots/tag';
import { botDecisionSeed, botRandom } from '../../src/engine/bot-random';
import type { ActionRecord } from '../../src/engine/hand';
import { main } from '../../src/playtest/cli';
import { seatStylesPolicyFactory } from '../../src/playtest/policy';
import {
  runPlaytest,
  type PlayedHand,
  type PlaytestSeams,
  type PolicyFactory,
} from '../../src/playtest/runner';
import {
  formatStyleReport,
  roundStat,
  STYLE_BANDS,
  type StyleBandTable,
} from '../../src/playtest/style-check';
import {
  addStyleCounts,
  EMPTY_STYLE_COUNTS,
  handStyleCounts,
  styleStats,
  type StyleCounts,
} from '../../src/stats/style-stats';
import maniacJson from '../../src/bots/styles/maniac.json' with { type: 'json' };

const SLOW = process.env.TLH_SLOW_TESTS === '1';
const FAST_TIMEOUT_MS = 30_000;
const SLOW_TIMEOUT_MS = 1_200_000;
const STYLE_LINE =
  /^Style: (TAG|Calling station|Maniac|Rock), (\d+) hands, VPIP (\d+\.\d)%, PFR (\d+\.\d)%, aggression (\d+\.\d%|—)$/;
const CHECKED_LINE =
  /^Style: (TAG|Calling station|Maniac|Rock), (\d+) hands, VPIP (\d+\.\d)% \(band (\d+\.\d)-(\d+\.\d)%\), PFR (\d+\.\d)% \(band (\d+\.\d)-(\d+\.\d)%\), aggression (\d+\.\d)% \(band (\d+\.\d)-(\d+\.\d)%\)$/;
const HEADER =
  'Style stats: VPIP and PFR per hand dealt, aggression = flop, turn and river bets and raises as a share of bets, raises and calls';

function capture(argv: string[], seams?: PlaytestSeams, bands?: StyleBandTable) {
  let out = '';
  let err = '';
  const code = main(argv, { out: (t) => (out += t), err: (t) => (err += t) }, seams, bands);
  return { code, out, err, lines: out.split('\n') };
}

/** Plain (no seams, no bands) runs shared between tests; a determinism check still does a fresh run. */
const shared = new Map<string, ReturnType<typeof capture>>();
function sharedCapture(argv: string[]) {
  const key = argv.join(' ');
  let run = shared.get(key);
  if (run === undefined) {
    run = capture(argv);
    shared.set(key, run);
  }
  return run;
}
const mixedArgv = (hands: number) => [
  '--hands',
  String(hands),
  '--seed',
  '42',
  '--lineup',
  'mixed',
  '--size',
  '6',
];

const linesStarting = (lines: readonly string[], prefix: string) =>
  lines.filter((line) => line.startsWith(prefix));

interface Printed {
  hands: number;
  vpip: number;
  pfr: number;
  aggression: number | null;
}

function printedStyles(lines: readonly string[]): Map<StyleName, Printed> {
  const styles = new Map<StyleName, Printed>();
  for (const line of linesStarting(lines, 'Style: ')) {
    const m = STYLE_LINE.exec(line);
    expect(m, line).not.toBeNull();
    const [, style, hands, vpip, pfr, aggression] = m as RegExpExecArray;
    styles.set(style as StyleName, {
      hands: Number(hands),
      vpip: Number(vpip),
      pfr: Number(pfr),
      aggression: aggression === '—' ? null : Number((aggression as string).slice(0, -1)),
    });
  }
  return styles;
}

/** Independent tally: bot seats by their hand's style (every seat TAG without a line-up), clean hands only. */
function tallyRun(hands: number, lineUp?: 'Mixed'): Map<StyleName, StyleCounts> {
  const counts = new Map<StyleName, StyleCounts>();
  runPlaytest(
    { hands, seed: 42, size: 6, game: 'cash', ...(lineUp === undefined ? {} : { lineUp }) },
    (hand: PlayedHand) => {
      const { result } = hand.final;
      if (hand.violations > 0 || result === null) return;
      const statHand = {
        seats: hand.record.seats,
        actions: hand.final.actions,
        board: hand.final.board,
        result,
      };
      for (const { seat } of hand.record.seats) {
        const lineUpSeat = hand.lineUp?.[seat - 1];
        const style = lineUpSeat === undefined ? 'TAG' : lineUpSeat.style;
        if (style === null) continue;
        const total = counts.get(style) ?? EMPTY_STYLE_COUNTS;
        counts.set(style, addStyleCounts(total, handStyleCounts(statHand, seat)));
      }
    },
  );
  return counts;
}

const MIXED_SEATS = seatLineUp('Mixed', 6, 1);
const mixedPolicy = seatStylesPolicyFactory(MIXED_SEATS);

/** Seats whose preset style is `style` play `policy`; the others play the Mixed line-up. */
function seamFor(style: StyleName, policy: PolicyFactory): PlaytestSeams {
  return {
    makePolicy: (code, seat) =>
      MIXED_SEATS[seat - 1]?.style === style ? policy(code, seat) : mixedPolicy(code, seat),
  };
}

function printsStyleStats(mixedHands: number, plainHands: number) {
  const argv = mixedArgv(mixedHands);
  const run = sharedCapture(argv);
  expect(run.code).toBe(0);
  expect(capture(argv).out).toBe(run.out);
  const header = run.lines.indexOf(HEADER);
  expect(header).toBeGreaterThan(run.lines.findIndex((line) => line.startsWith('Line-up: ')));
  const block = run.lines.slice(header + 1, header + 5);
  expect(block.map((line) => STYLE_LINE.exec(line)?.[1])).toEqual([
    'TAG',
    'Calling station',
    'Maniac',
    'Rock',
  ]);
  expect(run.lines[header + 5]).toMatch(/^Bot results: /);

  const printed = printedStyles(run.lines);
  const expected = tallyRun(mixedHands, 'Mixed');
  expect([...printed.keys()].sort()).toEqual([...expected.keys()].sort());
  for (const [style, c] of expected) {
    const stats = styleStats(c);
    expect(printed.get(style), style).toEqual({
      hands: c.handsDealt,
      vpip: roundStat(stats.vpip),
      pfr: roundStat(stats.pfr),
      aggression: roundStat(stats.aggression),
    });
  }

  const plain = capture(['--hands', String(plainHands), '--seed', '42']);
  expect(plain.code).toBe(0);
  const tag = linesStarting(plain.lines, 'Style: ');
  expect(tag).toHaveLength(1);
  expect(tag[0]).toMatch(new RegExp(`^Style: TAG, ${plainHands * 6} hands, `));
  const tagCounts = tallyRun(plainHands).get('TAG') as StyleCounts;
  const tagStats = styleStats(tagCounts);
  expect(printedStyles(plain.lines).get('TAG')).toEqual({
    hands: plainHands * 6,
    vpip: roundStat(tagStats.vpip),
    pfr: roundStat(tagStats.pfr),
    aggression: roundStat(tagStats.aggression),
  });
}

function testManiacFails(hands: number) {
  const style = parseStyle({ ...maniacJson, deviations: [] }, 'test-maniac.json');
  const seams = seamFor(
    'Maniac',
    (code) => (view) =>
      decideManiac(view, { random: botRandom(botDecisionSeed(code, view)), style }),
  );
  const argv = mixedArgv(hands);
  const checked = capture([...argv, '--check-styles'], seams);
  expect(checked.code).toBe(1);
  expect(checked.lines).toContain('Invariant violations: 0');
  expect(
    checked.lines.some((line) =>
      /^Outside band: Maniac VPIP \d+\.\d% \(band 50\.0-75\.0%\)$/.test(line),
    ),
  ).toBe(true);
  expect(checked.lines).toContain('Style check: failed');

  const plain = capture(argv, seams);
  expect(plain.code).toBe(0);
  expect(linesStarting(plain.lines, 'Outside band:')).toEqual([]);
}

function bandEdges(hands: number) {
  const argv = ['--hands', String(hands), '--seed', '42', '--lineup', 'soft', '--size', '6'];
  const printed = printedStyles(capture(argv).lines);
  expect([...printed.keys()].sort()).toEqual(['Calling station', 'Rock']);
  const exact = { ...STYLE_BANDS } as Record<StyleName, StyleBandTable[StyleName]>;
  for (const [style, p] of printed) {
    expect(p.aggression, style).not.toBeNull();
    exact[style] = {
      vpip: [p.vpip, p.vpip],
      pfr: [p.pfr, p.pfr],
      aggression: [p.aggression as number, p.aggression as number],
    };
  }
  const edges = capture([...argv, '--check-styles'], undefined, exact);
  expect(edges.code).toBe(0);
  const lines = linesStarting(edges.lines, 'Style: ');
  expect(lines).toHaveLength(2);
  for (const line of lines) {
    const m = CHECKED_LINE.exec(line);
    expect(m, line).not.toBeNull();
    const [, , , vpip, vLow, vHigh, pfr, pLow, pHigh, agg, aLow, aHigh] = m as RegExpExecArray;
    expect([vLow, vHigh, pLow, pHigh, aLow, aHigh]).toEqual([vpip, vpip, pfr, pfr, agg, agg]);
  }
  expect(linesStarting(edges.lines, 'Mixed spot:')).toEqual([]);
  const verdict = edges.lines.indexOf('Style check: passed');
  expect(verdict).toBeGreaterThan(0);
  expect(edges.lines[verdict + 1]).toMatch(/^Bot results: /);

  const rock = printed.get('Rock') as Printed;
  const above = Math.round((rock.vpip + 0.1) * 10) / 10;
  const failing = capture([...argv, '--check-styles'], undefined, {
    ...exact,
    Rock: { ...exact.Rock, vpip: [above, 100] },
  });
  expect(failing.code).toBe(1);
  expect(failing.lines).toContain(
    `Outside band: Rock VPIP ${rock.vpip.toFixed(1)}% (band ${above.toFixed(1)}-100.0%)`,
  );
  expect(failing.lines).toContain('Style check: failed');
}

function mixedSpots(hands: number) {
  const argv = mixedArgv(hands);
  const checked = capture([...argv, '--check-styles']);
  const mixed = linesStarting(checked.lines, 'Mixed spot:');
  expect(mixed.map((line) => line.split(',')[0])).toEqual([
    'Mixed spot: TAG preflop-unopened',
    'Mixed spot: TAG preflop-limpers',
    'Mixed spot: TAG preflop-raise',
    'Mixed spot: TAG preflop-raise-and-calls',
    'Mixed spot: TAG preflop-blind-defence',
  ]);
  for (const line of mixed) {
    expect(line).toMatch(/^Mixed spot: TAG preflop-[a-z-]+, recommended \d+, alternative \d+$/);
  }
  const unopened = /recommended (\d+), alternative (\d+)$/.exec(mixed[0] as string);
  expect(Number(unopened?.[1])).toBeGreaterThan(0);
  expect(Number(unopened?.[2])).toBeGreaterThan(0);

  const neverMixing = capture(
    [...argv, '--check-styles'],
    seamFor('TAG', () => (view) => decideTag(view)),
  );
  expect(neverMixing.code).toBe(1);
  expect(
    neverMixing.lines.some((line) =>
      /^One action only: TAG preflop-unopened, recommended \d+, alternative 0$/.test(line),
    ),
  ).toBe(true);
  expect(neverMixing.lines).toContain('Style check: failed');

  expect(linesStarting(sharedCapture(argv).lines, 'Mixed spot:')).toEqual([]);
}

function maniacAggression(hands: number) {
  const run = sharedCapture(mixedArgv(hands));
  expect(run.code).toBe(0);
  const printed = printedStyles(run.lines);
  for (const style of ['TAG', 'Calling station', 'Maniac', 'Rock'] as const) {
    expect(printed.get(style)?.aggression, style).toEqual(expect.any(Number));
  }
  const maniac = printed.get('Maniac')?.aggression as number;
  expect(maniac).toBeGreaterThan(0);
  expect(maniac).toBeLessThan(100);
}

describe('playtest style stats (--check-styles)', () => {
  it(
    "every playtest run prints each seated style's VPIP, PFR and aggression from the shared style-stat functions",
    () => printsStyleStats(300, 100),
    FAST_TIMEOUT_MS,
  );
  it.runIf(SLOW)(
    "every playtest run prints each seated style's VPIP, PFR and aggression from the shared style-stat functions (original hand counts)",
    () => printsStyleStats(500, 300),
    SLOW_TIMEOUT_MS,
  );

  it('aggression of 2 preflop raises, 3 postflop bets, 1 postflop raise and 4 postflop calls is 50.0%', () => {
    const seat = 2;
    const act = (street: ActionRecord['street'], type: ActionRecord['type']): ActionRecord => ({
      street,
      seat,
      type,
      amount: 8,
      added: 8,
    });
    const actions: ActionRecord[] = [
      act('preflop', 'raise'),
      act('preflop', 'raise'),
      act('flop', 'bet'),
      act('turn', 'bet'),
      act('river', 'bet'),
      act('flop', 'raise'),
      act('flop', 'call'),
      act('turn', 'call'),
      act('river', 'call'),
      act('river', 'call'),
    ];
    const counts = handStyleCounts(
      {
        seats: [{ seat: 1 }, { seat }],
        actions,
        board: [0, 1, 2, 3, 4],
        result: { endedBy: 'showdown', showdown: [], awards: [] },
      },
      seat,
    );
    expect(counts).toMatchObject({ postflopAggressive: 4, postflopCalls: 4 });
    const report = formatStyleReport(new Map([['Maniac', counts]]), new Map(), false);
    expect(report.text).toContain(
      'Style: Maniac, 1 hands, VPIP 100.0%, PFR 100.0%, aggression 50.0%\n',
    );
    expect(report.text).not.toContain('60.0%');
  });

  it(
    "a test style file that moves the Maniac's VPIP below its band fails --check-styles with style, stat, value and band",
    () => testManiacFails(300),
    FAST_TIMEOUT_MS,
  );
  it.runIf(SLOW)(
    "a test style file that moves the Maniac's VPIP below its band fails --check-styles with style, stat, value and band (original hand counts)",
    () => testManiacFails(1000),
    SLOW_TIMEOUT_MS,
  );

  it(
    'band edges are inclusive and every stat prints with its band when all are inside',
    () => bandEdges(300),
    FAST_TIMEOUT_MS,
  );
  it.runIf(SLOW)(
    'band edges are inclusive and every stat prints with its band when all are inside (original hand counts)',
    () => bandEdges(2000),
    SLOW_TIMEOUT_MS,
  );

  it(
    "--check-styles lists each mixed spot's action counts and fails a spot that used one action",
    () => mixedSpots(300),
    FAST_TIMEOUT_MS,
  );
  it.runIf(SLOW)(
    "--check-styles lists each mixed spot's action counts and fails a spot that used one action (original hand counts)",
    () => mixedSpots(1000),
    SLOW_TIMEOUT_MS,
  );

  it(
    "with postflop value betting the Maniac's aggression in a mixed line-up is below 100.0%",
    () => maniacAggression(300),
    FAST_TIMEOUT_MS,
  );
  it.runIf(SLOW)(
    "with postflop value betting the Maniac's aggression in a mixed line-up is below 100.0% (original hand counts)",
    () => maniacAggression(2000),
    SLOW_TIMEOUT_MS,
  );

  it.runIf(SLOW)(
    '100,000 Mixed 6-max hands pass --check-styles on seeds 42, 7 and 1234',
    () => {
      const failures: string[] = [];
      for (const seed of ['42', '7', '1234']) {
        const run = capture([
          '--hands',
          '100000',
          '--lineup',
          'mixed',
          '--size',
          '6',
          '--check-styles',
          '--seed',
          seed,
        ]);
        const block = run.lines.filter((line) =>
          /^(Style|Mixed spot|Outside band|One action only|Style check)[: ]/.test(line),
        );
        console.log(`seed ${seed} (exit ${run.code}):\n${block.join('\n')}`);
        expect(run.lines, `seed ${seed}`).toContain('Invariant violations: 0');
        const styles = linesStarting(run.lines, 'Style: ');
        expect(
          styles.map((line) => CHECKED_LINE.exec(line)?.[1]),
          `seed ${seed}`,
        ).toEqual(['TAG', 'Calling station', 'Maniac', 'Rock']);
        const rock = styles[3] as string;
        expect(rock).toContain('(band 8.0-15.0%), PFR');
        expect(rock).toContain('(band 6.0-12.0%), aggression');
        for (const line of styles) {
          const m = CHECKED_LINE.exec(line) as RegExpExecArray;
          for (const at of [3, 6, 9]) {
            const value = Number(m[at]);
            if (value < Number(m[at + 1]) || value > Number(m[at + 2])) {
              failures.push(`seed ${seed}: ${line}`);
            }
          }
        }
        if (run.code !== 0) {
          failures.push(
            `seed ${seed}: exit ${run.code}`,
            ...linesStarting(run.lines, 'Outside band:'),
          );
        }
        failures.push(...linesStarting(run.lines, 'One action only:'));
        if (!run.lines.includes('Style check: passed')) failures.push(`seed ${seed}: not passed`);
      }
      expect(failures).toEqual([]);
    },
    SLOW_TIMEOUT_MS,
  );
});
