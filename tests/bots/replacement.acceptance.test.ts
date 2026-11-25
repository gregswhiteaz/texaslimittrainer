import { describe, expect, it } from 'vitest';
import {
  BOT_NAMES,
  nextReplacementName,
  REPLACEMENT_NAMES,
  replacementName,
  type LineUpPreset,
} from '../../src/bots/lineup';
import type { StyleName } from '../../src/bots/style';
import { replayCodeFromWords, type ReplayCode } from '../../src/engine/deck';
import {
  configForLineUp,
  configWithSeatStyle,
  dealHand,
  DEFAULT_SESSION_CONFIG,
  foldUserToLeave,
  nextHand,
  nextStep,
  seatSession,
  stepBot,
  type SessionConfig,
  type TableState,
} from '../../src/table/session';
import { withFinalStacks } from '../support/table-scenarios';

const DRAWS = 10_000;
const CODES = Array.from({ length: DRAWS }, (_, i) => replayCodeFromWords([i + 1, 6, 8, 3]));

/** `config`'s first hand dealt from CODES[0] and played out (the user folds), with every bot ending on $0. */
function everyBotBusted(config: SessionConfig): TableState {
  let table = foldUserToLeave(dealHand(seatSession(config), CODES[0] as ReplayCode));
  while (nextStep(table) === 'bot') table = stepBot(table);
  const stacks = config.seats.map((s) => (s.kind === 'bot' ? 0 : 160));
  return withFinalStacks(stacks, table);
}

/** The style of each new bot after nextHand, over the 10,000 codes as the finished hand's replay code. */
function tally(config: SessionConfig): Map<StyleName, number> {
  const busted = everyBotBusted(config);
  const counts = new Map<StyleName, number>();
  for (const code of CODES) {
    const next = nextHand({ ...busted, replayCode: code });
    for (const seat of next.seats) {
      if (seat.kind !== 'bot') continue;
      const style = seat.style as StyleName;
      counts.set(style, (counts.get(style) ?? 0) + 1);
    }
    expect(next.seats.map((s) => s.style)).toEqual(config.seats.map((s) => s.style));
  }
  return counts;
}

/** The kept styles in TAG, Calling station, Maniac, Rock order, each kept at least once. */
function drawn(counts: Map<StyleName, number>): StyleName[] {
  const order: StyleName[] = ['TAG', 'Calling station', 'Maniac', 'Rock'];
  for (const count of counts.values()) expect(count).toBeGreaterThan(0);
  return order.filter((style) => counts.has(style));
}

const ALL: StyleName[] = ['TAG', 'Calling station', 'Maniac', 'Rock'];
const preset = (lineUp: LineUpPreset, size: number): SessionConfig =>
  configForLineUp(DEFAULT_SESSION_CONFIG, size, lineUp);
/** The distinct bot styles seated by `config`, in TAG, Calling station, Maniac, Rock order. */
const seated = (config: SessionConfig): StyleName[] =>
  ALL.filter((style) => config.seats.some((s) => s.style === style));

describe('replacement bot styles and names', () => {
  it("10,000 replacements at 6 players keep each preset's styles", () => {
    const expected: [LineUpPreset, StyleName[]][] = [
      ['Mixed', ALL],
      ['Tough', ['TAG', 'Maniac']],
      ['Soft', ['Calling station', 'Rock']],
    ];
    for (const [lineUp, styles] of expected) {
      const counts = tally(preset(lineUp, 6));
      expect(drawn(counts), lineUp).toEqual(styles);
      expect([...counts.values()].reduce((a, b) => a + b, 0)).toBe(DRAWS * 5);
      expect(seated(preset(lineUp, 6))).toEqual(styles);
    }
  });

  it('a session recorded as Custom keeps each bot style, all four included', () => {
    for (const size of [6, 2]) {
      const base = preset('Mixed', size);
      const bot = base.seats.find((s) => s.kind === 'bot')?.seat as number;
      const configs = ALL.map((style) => configWithSeatStyle(base, 'Mixed', bot, style));
      const counts = new Map<StyleName, number>();
      for (const config of configs) {
        for (const [style, count] of tally(config))
          counts.set(style, (counts.get(style) ?? 0) + count);
      }
      expect(drawn(counts), `size ${size}`).toEqual(ALL);
      expect(
        configs
          .flatMap(seated)
          .filter((s, i, a) => a.indexOf(s) === i)
          .sort(),
      ).toEqual([...ALL].sort());
    }
  });

  it('Mixed at 3 players keeps TAG and Calling station and heads-up Tough keeps TAG', () => {
    expect(drawn(tally(preset('Mixed', 3)))).toEqual(['TAG', 'Calling station']);
    expect(drawn(tally(preset('Tough', 2)))).toEqual(['TAG']);
    expect(seated(preset('Mixed', 3))).toEqual(['TAG', 'Calling station']);
    expect(seated(preset('Tough', 2))).toEqual(['TAG']);
  });

  it('replacement names follow Jay to Zed, then numbered rounds, and skip names at the table', () => {
    expect(REPLACEMENT_NAMES).toHaveLength(17);
    expect(REPLACEMENT_NAMES.some((name) => BOT_NAMES.includes(name))).toBe(false);
    expect(new Set(REPLACEMENT_NAMES.map((name) => name[0])).size).toBe(17);
    expect([0, 1, 16, 17, 18, 34].map(replacementName)).toEqual([
      'Jay',
      'Kit',
      'Zed',
      'Jay 2',
      'Kit 2',
      'Jay 3',
    ]);
    expect(nextReplacementName(0, ['Ava', 'You'])).toEqual({ name: 'Jay', next: 1 });
    expect(nextReplacementName(0, ['Jay', 'Ben'])).toEqual({ name: 'Kit', next: 2 });
    expect(nextReplacementName(16, ['Zed'])).toEqual({ name: 'Jay 2', next: 18 });
  });
});
