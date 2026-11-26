import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { EquityInput, EquityResult, HoleCards } from '../../src/advice/equity';
import { gradeView } from '../../src/advice/grade';
import { comboCount } from '../../src/advice/hand-class';
import { recommendPostflop } from '../../src/advice/postflop';
import {
  classifyCombo,
  defaultRange,
  estimateOpponentRanges,
  narrowRange,
  parseDefaultRanges,
  PREFLOP_LINES,
  RangeValidationError,
  SIX_MAX_RANGES,
  APPLICABLE_LINES,
} from '../../src/advice/ranges';
import { ACTION_RANGE_ADVICE, adviceOptions, recommend } from '../../src/advice/recommend';
import { CALLING_STATION_STYLE, type CallingStationOptions } from '../../src/bots/calling-station';
import { TAG_STYLE } from '../../src/bots/tag';
import { botRandom } from '../../src/engine/bot-random';
import { formatCard, parseCards, type Card } from '../../src/engine/cards';
import {
  applyAction,
  createHand,
  type Action,
  type HandState,
  type SeatNumber,
} from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';
import { handReplayCode } from '../../src/playtest/runner';
import { handleAdviceRequest } from '../../src/table/advice-service';
import { reviewEntries, userReviewEntries } from '../../src/table/review';
import {
  applyUserAction,
  completedHand,
  dealHand,
  DEFAULT_SEATS,
  nextStep,
  seatSession,
  stepBot,
  type BotStyle,
  type CompletedHand,
  type TableState,
} from '../../src/table/session';
import { REVIEW_FOUR } from '../support/table-scenarios';
import { REPO_ROOT } from '../support/sandbox';
import sixMaxRaw from '../../src/advice/ranges/six-max.json' with { type: 'json' };

vi.setConfig({ testTimeout: 30_000 });

const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };
/** Button 1: SB 2, BB 3, UTG 4, HJ 5, CO 6, BTN 1. Hole cards go to deck[i] and deck[i + 6]. */
const SEATS: readonly SeatNumber[] = [1, 2, 3, 4, 5, 6];
const HERO = 3;
const HERO_POSITIONS = [1, 7];
const FLOP_POSITIONS = [13, 14, 15];
const TURN_POSITION = 17;
const ALL_CARDS: readonly Card[] = Array.from({ length: 52 }, (_, i) => i);

type Step = [SeatNumber, Action['type'], number?];
const f = (seat: SeatNumber): Step => [seat, 'fold'];
const k = (seat: SeatNumber): Step => [seat, 'check'];
const c = (seat: SeatNumber, amount: number): Step => [seat, 'call', amount];
const b = (seat: SeatNumber, amount: number): Step => [seat, 'bet', amount];
const r = (seat: SeatNumber, amount: number): Step => [seat, 'raise', amount];

/** A deck with `fixed[position] = card`; the remaining cards fill the other positions in order. */
function deckWith(fixed: ReadonlyMap<number, Card>): Card[] {
  const used = new Set(fixed.values());
  const filler = ALL_CARDS.filter((card) => !used.has(card));
  return Array.from({ length: 52 }, (_, i) => fixed.get(i) ?? (filler.shift() as Card));
}

/** Hero `hero` and flop/turn cards from `board` at their deal positions. */
function spotDeck(hero: string, board: string): Map<number, Card> {
  const positions = [...HERO_POSITIONS, ...FLOP_POSITIONS, TURN_POSITION];
  const cards = parseCards(`${hero} ${board}`);
  return new Map(cards.map((card, i) => [positions[i] as number, card]));
}

function stateAfter(deck: readonly Card[], steps: Step[]): HandState {
  let state = createHand({
    stakes: STAKES_4_8,
    seats: SEATS.map((seat) => ({ seat, stack: 160 })),
    button: 1,
    deck,
  });
  for (const [seat, type, amount] of steps) {
    const action = (amount === undefined ? { seat, type } : { seat, type, amount }) as Action;
    const result = applyAction(state, action);
    if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
    state = result.state;
  }
  return state;
}

const heroView = (deck: readonly Card[], steps: Step[]) =>
  playerView(stateAfter(deck, steps), HERO);

/** An equity function that always reports `equity` for the hero and records its inputs. */
function fixedEquity(equity: number) {
  const calls: EquityInput[] = [];
  const fn = (input: EquityInput): EquityResult => {
    calls.push(input);
    return {
      hero: { win: equity, tie: 0, equity },
      opponents: input.opponents.map(() => ({ win: 0, tie: 0, equity: 0 })),
      method: 'sampled',
      trials: 1,
    };
  };
  return { fn, calls };
}

const combo = (text: string): HoleCards => parseCards(text) as unknown as HoleCards;
const FIXTURE: readonly HoleCards[] = [
  'Kh Kd',
  '8h 7h',
  'Ah Kh',
  '9h 9d',
  '6h 5h',
  'Th 9h',
  'Qh Jh',
  'Ac 2c',
].map(combo);
const FLOP = parseCards('Ks 8d 7c');
const TURN = parseCards('Ks 8d 7c 2d');
const names = (range: readonly HoleCards[]) =>
  new Set(range.map((h) => h.map(formatCard).join('')));
const set = (...combos: string[]) => new Set(combos);

function copyOf(): { ranges: Record<string, unknown>[] } & Record<string, unknown> {
  return JSON.parse(JSON.stringify(sixMaxRaw)) as { ranges: Record<string, unknown>[] } & Record<
    string,
    unknown
  >;
}

function problemsOf(raw: unknown): readonly string[] {
  try {
    parseDefaultRanges(raw);
  } catch (error) {
    expect(error).toBeInstanceOf(RangeValidationError);
    return (error as RangeValidationError).problems;
  }
  throw new Error('validation passed');
}

const entry = (raw: { ranges: Record<string, unknown>[] }, position: string, line: string) =>
  raw.ranges.find((e) => e.position === position && e.line === line) as Record<string, unknown>;

const words = (text: string) => (text.match(/\p{L}+/gu) ?? []).length;

/** A 6-max table session whose seat 4 plays `style`; every seat acts by one scripted policy. */
function scriptedViews(style: BotStyle): PlayerView[] {
  const seats = DEFAULT_SEATS.map((s) => (s.seat === 4 ? { ...s, style } : s));
  let table: TableState = dealHand(seatSession({ seats }), handReplayCode(7505, 3));
  const policy = (view: PlayerView): Action => {
    const pick = (type: Action['type']) => view.legalActions.find((a) => a.type === type);
    const aggressive = view.seat === 4 || (view.seat === 6 && view.street === 'preflop');
    return (
      (aggressive && view.betCount < 3 ? (pick('raise') ?? pick('bet')) : undefined) ??
      pick('call') ??
      pick('check') ??
      (pick('fold') as Action)
    );
  };
  const views: PlayerView[] = [];
  while (nextStep(table) !== 'done') {
    if (nextStep(table) === 'user') {
      const view = playerView(table.hand as HandState, table.config.userSeat);
      if (view.street === 'flop' || view.street === 'turn') views.push(view);
      table = applyUserAction(table, policy(view));
    } else {
      table = stepBot(table, policy);
    }
  }
  return views;
}

/** TASK-7.3 flop spot: hero seat 3 Ah 5h, board Kh 9h 2c, limped pot, seat 2 bets 4. */
const PREFLOP_LIMPED: Step[] = [f(4), f(5), c(6, 4), c(1, 4), c(2, 2), k(3)];
const FLOP_BET: Step[] = [...PREFLOP_LIMPED, b(2, 4)];

describe('TASK-7.5 opponent range model', () => {
  it('AC#1 every 6-max position and line has a justified range and gaps fail validation', () => {
    const applicable = APPLICABLE_LINES['6-max'];
    expect(applicable).toHaveLength(36);
    expect(SIX_MAX_RANGES.ranges.map((x) => [x.position, x.line])).toEqual(
      applicable.map((x) => [x.position, x.line]),
    );
    expect(words(SIX_MAX_RANGES.justification)).toBeGreaterThanOrEqual(50);
    for (const range of SIX_MAX_RANGES.ranges) {
      expect(range.classes.size, `${range.position} ${range.line}`).toBeGreaterThan(0);
      expect(words(range.justification), `${range.position} ${range.line}`).toBeGreaterThanOrEqual(
        15,
      );
    }

    const missing = copyOf();
    missing.ranges = missing.ranges.filter(
      (e) => !(e.position === 'CO' && e.line === 'open-raise'),
    );
    expect(problemsOf(missing)).toEqual(['6-max ranges: missing range CO open-raise']);

    const unjustified = copyOf();
    entry(unjustified, 'BB', 'check').justification = '';
    expect(problemsOf(unjustified)).toEqual([
      '6-max ranges: BB check is missing its plain-English justification (at least 15 words)',
    ]);

    const empty = copyOf();
    entry(empty, 'UTG', 'limp').hands = '';
    expect(problemsOf(empty)).toEqual(['6-max ranges: UTG limp has no hands']);
  });

  it('AC#2 a CO open-raiser who has not acted on the flop is the authored CO open-raise range', () => {
    const deck = deckWith(spotDeck('Ah 5h', 'Kh 9h 2c'));
    const view = heroView(deck, [f(4), f(5), r(6, 8), f(1), f(2), c(3, 4)]);
    expect(view.street).toBe('flop');
    const spy = fixedEquity(0.5);
    recommend(view, { ...ACTION_RANGE_ADVICE, equity: spy.fn });
    // calls[0] is the whole-range run; the calling-range run follows (TASK-7.8).
    expect(spy.calls).toHaveLength(2);
    const opponents = (spy.calls[0] as EquityInput).opponents;
    expect(opponents).toHaveLength(1);

    const classes = defaultRange(SIX_MAX_RANGES, 'CO', 'open-raise').classes;
    const dead = [...view.holeCards, ...view.board];
    const expected: HoleCards[] = [];
    let deadCombos = 0;
    for (let a = 0; a < 52; a++) {
      for (let x = a + 1; x < 52; x++) {
        const hc = [a, x] as const;
        const high = Math.max(a >> 2, x >> 2);
        const low = Math.min(a >> 2, x >> 2);
        const rank = (n: number) => '23456789TJQKA'.charAt(n);
        const name =
          high === low
            ? rank(high) + rank(high)
            : rank(high) + rank(low) + ((a & 3) === (x & 3) ? 's' : 'o');
        if (!classes.has(name)) continue;
        if (dead.includes(a) || dead.includes(x)) deadCombos++;
        else expected.push(hc);
      }
    }
    expect(opponents[0]).toEqual(expected);

    const total = [...classes].reduce((sum, hc) => sum + comboCount(hc), 0);
    expect(deadCombos).toBeGreaterThan(0);
    expect(opponents[0]).toHaveLength(total - deadCombos);

    const estimated = estimateOpponentRanges(view);
    expect(estimated).toHaveLength(1);
    expect(estimated[0]).toMatchObject({ seat: 6, position: 'CO', line: 'open-raise' });
    expect(estimated[0]?.combos).toEqual(estimated[0]?.start);
    expect(estimated[0]?.combos).toEqual(expected);
  });

  it('AC#3 a flop bet removes Air from the fixture', () => {
    expect(FIXTURE.map((h) => classifyCombo(h, FLOP))).toEqual([
      'strong',
      'strong',
      'pair',
      'pair',
      'draw',
      'draw',
      'air',
      'air',
    ]);
    const narrowed = narrowRange(FIXTURE, FLOP, 'bet');
    expect(narrowed).toHaveLength(6);
    expect(names(narrowed)).toEqual(set('KhKd', '8h7h', 'AhKh', '9h9d', '6h5h', 'Th9h'));
  });

  it('AC#4 a flop check removes Strong from the fixture', () => {
    const narrowed = narrowRange(FIXTURE, FLOP, 'check');
    expect(narrowed).toHaveLength(6);
    expect(names(narrowed)).toEqual(set('AhKh', '9h9d', '6h5h', 'Th9h', 'QhJh', 'Ac2c'));
  });

  it('AC#5 a flop call keeps Pair and Draw and a raise keeps Strong and Draw', () => {
    const called = narrowRange(FIXTURE, FLOP, 'call');
    expect(called).toHaveLength(4);
    expect(names(called)).toEqual(set('AhKh', '9h9d', '6h5h', 'Th9h'));
    const raised = narrowRange(FIXTURE, FLOP, 'raise');
    expect(raised).toHaveLength(4);
    expect(names(raised)).toEqual(set('KhKd', '8h7h', '6h5h', 'Th9h'));
  });

  it('AC#6 a flop check then a turn call re-classifies on the turn', () => {
    const narrowed = narrowRange(narrowRange(FIXTURE, FLOP, 'check'), TURN, 'call');
    expect(narrowed).toHaveLength(5);
    expect(names(narrowed)).toEqual(set('AhKh', '9h9d', '6h5h', 'Th9h', 'Ac2c'));
    expect(classifyCombo(combo('Ac 2c'), TURN)).toBe('pair');
    expect(classifyCombo(combo('Qh Jh'), TURN)).toBe('air');
  });

  it('AC#7 identical actions give identical ranges whatever the bot style', () => {
    const maniac = scriptedViews('Maniac');
    const rock = scriptedViews('Rock');
    expect(maniac.map((v) => v.street)).toEqual(['flop', 'turn']);
    expect(maniac).toEqual(rock);
    for (const [i, view] of maniac.entries()) {
      const other = rock[i] as PlayerView;
      const ranges = estimateOpponentRanges(view);
      expect(ranges.length).toBeGreaterThan(0);
      expect(ranges).toEqual(estimateOpponentRanges(other));
      expect(recommend(view, ACTION_RANGE_ADVICE)).toEqual(recommend(other, ACTION_RANGE_ADVICE));
    }

    const dir = join(REPO_ROOT, 'src/advice');
    const offending: string[] = [];
    for (const file of readdirSync(dir, { recursive: true }) as string[]) {
      if (!/\.tsx?$/.test(file)) continue;
      const text = readFileSync(join(dir, file), 'utf8');
      for (const [, spec = ''] of text.matchAll(/from\s+'([^']+)'/g)) {
        if (/(^|\/)(bots|table|ui)(\/|$)/.test(spec)) offending.push(`${file}: ${spec}`);
      }
    }
    expect(offending).toEqual([]);
  });

  it('AC#8 a bot style passed into the advice engine fails the typecheck', () => {
    const deck = deckWith(spotDeck('Ah 5h', 'Kh 9h 2c'));
    const view = heroView(deck, FLOP_BET);
    const spy = fixedEquity(0.5);
    const stationOptions: CallingStationOptions = { style: CALLING_STATION_STYLE };

    // @ts-expect-error a bot style label is not an advice option
    recommend(view, { style: 'Maniac' });
    // @ts-expect-error a bot's options object carries its style
    recommend(view, stationOptions);
    // @ts-expect-error style parameters are not postflop advice options
    recommendPostflop(view, { styleName: 'Rock' });
    // @ts-expect-error a bot's style data is not a grading option
    gradeView(view, 'call', { style: TAG_STYLE });
    // @ts-expect-error range estimation takes the view only
    estimateOpponentRanges(view, 'Maniac');

    expect(recommend(view).basis).toBe('equity');
    expect(recommend(view, ACTION_RANGE_ADVICE).basis).toBe('equity');
    expect(recommend(view, adviceOptions(stationOptions)).basis).toBe('equity');
    expect(gradeView(view, 'call', { equity: spy.fn }).recommendation.basis).toBe('equity');

    const botOptions: CallingStationOptions = {
      ...stationOptions,
      random: botRandom(1),
      equity: spy.fn,
    };
    const picked = adviceOptions(botOptions);
    for (const key of Object.keys(picked)) {
      expect(['equity', 'chart', 'opponentRanges']).toContain(key);
    }
    expect(picked.equity).toBe(spy.fn);
  });

  it('AC#9 user advice and review use action ranges and the docs describe them', () => {
    const deck = deckWith(spotDeck('Ah 5h', 'Kh 9h 2c'));
    const view = heroView(deck, FLOP_BET);
    expect(handleAdviceRequest({ id: 1, kind: 'recommend', view })).toEqual({
      id: 1,
      ok: true,
      value: recommend(view, ACTION_RANGE_ADVICE),
    });
    const spy = fixedEquity(0.5);
    recommendPostflop(view, { ...ACTION_RANGE_ADVICE, equity: spy.fn });
    const opponents = (spy.calls[0] as EquityInput).opponents;
    expect(opponents).toEqual(estimateOpponentRanges(view).map((o) => o.combos));
    expect(opponents).toHaveLength(3);
    for (const range of opponents) expect(range).not.toHaveLength(1081);

    expect(handleAdviceRequest({ id: 2, kind: 'grade', view, userAction: 'call' })).toEqual({
      id: 2,
      ok: true,
      value: gradeView(view, 'call', ACTION_RANGE_ADVICE),
    });

    const hand = completedHand(REVIEW_FOUR) as CompletedHand;
    expect(userReviewEntries(hand)).toEqual(reviewEntries(hand, ACTION_RANGE_ADVICE));

    const rules = readFileSync(join(REPO_ROOT, 'docs/advice/postflop-rules.md'), 'utf8');
    expect(rules).not.toContain('1,081 combinations per opponent');
    expect(rules).toContain('range-model.md');
    const notYet = rules.slice(rules.indexOf('## Not applied yet'));
    expect(notYet).not.toContain('TASK-7.5');
    const model = readFileSync(join(REPO_ROOT, 'docs/advice/range-model.md'), 'utf8');
    expect(model).toContain('Ks 8d 7c');
    for (const line of PREFLOP_LINES) expect(model).toContain(line);
  });
});
