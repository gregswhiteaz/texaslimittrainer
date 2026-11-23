// Offline generator for tests/advice/fixtures/equity-multiway-reference.json (TASK-7.7).
// Multiway and range cases on boards of 0, 3, 4 and 5 cards, each computed exhaustively or with a
// high-sample run. It shares no code with src/advice/equity.ts; ranges are expanded with
// src/advice/ranges.ts (A-3). Run: node tools/equity/generate-multiway-reference.js
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { cardText, enumerateExact, mulberry32 } from './generate-reference.js';

const SHARE_UNITS = 2520;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURE = 'tests/advice/fixtures/equity-multiway-reference.json';
const BOARD_SIZES = [0, 3, 4, 5];
const KNOWN_HAND_CASES = 10;
const RANGE_CASES = 20;
const KNOWN_HAND = /^[2-9TJQKA][cdhs] [2-9TJQKA][cdhs]$/;

export const MULTIWAY_SEED = 20261122;
export const EXHAUSTIVE_LIMIT = 100_000_000;
export const SAMPLE_TRIALS = 2_000_000;
export const RANGE_PALETTE = [
  'TT+ AQs+ AKo',
  'any',
  '77-99 A2s-A5s',
  '22+ A2s+ K9s+ QTs+ JTs ATo+ KJo+',
  'KQs QJs JTs T9s 98s 87s',
  'AA KK AKs',
];

/**
 * @typedef {{ id: string, hero: string, board: string, opponents: string[] }} MultiwayCase
 * @typedef {{ method: 'exhaustive' | 'high-sample', trials: number, win: number[], tie: number[],
 *   shareUnits: number[] }} Reference
 * @typedef {{ parseCards: (text: string) => number[],
 *   parseHandRange: (text: string) => ReadonlySet<string>,
 *   expandRange: (classes: ReadonlySet<string>, dead: readonly number[]) => (readonly number[])[],
 *   unseenCombos: (dead: readonly number[]) => (readonly number[])[] }} RangeLib
 */

/**
 * The first `count` cards of a fresh deck after a partial Fisher-Yates shuffle.
 * @param {() => number} random
 * @param {number} count
 */
function drawCards(random, count) {
  const deck = Array.from({ length: 52 }, (_, i) => i);
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(random() * (52 - i));
    [deck[i], deck[j]] = [deck[j] ?? 0, deck[i] ?? 0];
  }
  return deck.slice(0, count);
}

/** @param {number[]} cards */
function handText(cards) {
  return cards.map(cardText).join(' ');
}

/** @returns {MultiwayCase[]} */
function buildCases() {
  const random = mulberry32(MULTIWAY_SEED);
  /** @type {MultiwayCase[]} */
  const cases = [];
  for (const size of BOARD_SIZES) {
    for (let i = 0; i < KNOWN_HAND_CASES; i++) {
      const players = 3 + (i % 4);
      const cards = drawCards(random, 2 * players + size);
      cases.push({
        id: `mw-b${size}-${String(i + 1).padStart(2, '0')}`,
        hero: handText(cards.slice(0, 2)),
        board: handText(cards.slice(2 * players)),
        opponents: Array.from({ length: players - 1 }, (_, j) =>
          handText(cards.slice(2 + 2 * j, 4 + 2 * j)),
        ),
      });
    }
    for (let i = 0; i < RANGE_CASES; i++) {
      const cards = drawCards(random, 2 + size);
      cases.push({
        id: `rr-b${size}-${String(i + 1).padStart(2, '0')}`,
        hero: handText(cards.slice(0, 2)),
        board: handText(cards.slice(2)),
        opponents: Array.from(
          { length: 1 + (i % 4) },
          (_, j) => RANGE_PALETTE[(i + j) % RANGE_PALETTE.length] ?? '',
        ),
      });
    }
  }
  return cases;
}

/** Every multiway reference case, in fixture order. */
export const MULTIWAY_CASES = buildCases();

/**
 * An opponent's live `[low, high]` combos, ascending.
 * @param {string} text a known hand such as 'Jd Jc', 'any', or range notation
 * @param {readonly number[]} dead hero and board cards
 * @param {RangeLib} lib
 * @returns {number[][]}
 */
export function resolveOpponent(text, dead, lib) {
  if (KNOWN_HAND.test(text)) {
    const [a = 0, b = 0] = lib.parseCards(text);
    return [[Math.min(a, b), Math.max(a, b)]];
  }
  const combos =
    text === 'any' ? lib.unseenCombos(dead) : lib.expandRange(lib.parseHandRange(text), dead);
  return combos.map((combo) => [...combo]);
}

/** @param {number} n @param {number} k */
function choose(n, k) {
  let result = 1;
  for (let i = 0; i < k; i++) result = (result * (n - i)) / (i + 1);
  return result;
}

/**
 * Evaluations an exhaustive run would need (A-4).
 * @param {number[]} combos live combo count per opponent
 * @param {number} boardSize
 */
export function estimateEvaluations(combos, boardSize) {
  const k = combos.length;
  const deals = combos.reduce((product, n) => product * n, 1);
  return deals * choose(52 - 2 - boardSize - 2 * k, 5 - boardSize) * (k + 1);
}

/**
 * Whether one combo per opponent can be dealt with no shared card.
 * @param {number[][][]} ranges
 * @param {number} depth
 * @param {Set<number>} used
 * @returns {boolean}
 */
function dealExists(ranges, depth, used) {
  if (depth === ranges.length) return true;
  for (const [a = 0, b = 0] of ranges[depth] ?? []) {
    if (used.has(a) || used.has(b)) continue;
    used.add(a).add(b);
    const found = dealExists(ranges, depth + 1, used);
    used.delete(a);
    used.delete(b);
    if (found) return true;
  }
  return false;
}

/**
 * Every compatible opponent deal in nested order, then every runout (D-1).
 * @param {(cards: readonly number[]) => number} evaluate
 * @param {number[]} hero
 * @param {number[]} board
 * @param {number[][][]} ranges
 */
function exhaustive(evaluate, hero, board, ranges) {
  const n = ranges.length + 1;
  const totals = {
    trials: 0,
    win: new Array(n).fill(0),
    tie: new Array(n).fill(0),
    shareUnits: new Array(n).fill(0),
  };
  /** @type {number[][]} */
  const deal = [];
  const used = new Set();
  /** @param {number} depth */
  function visit(depth) {
    if (depth === ranges.length) {
      const counts = enumerateExact(evaluate, [hero, ...deal], board);
      totals.trials += counts.trials;
      for (let p = 0; p < n; p++) {
        totals.win[p] += counts.win[p] ?? 0;
        totals.tie[p] += counts.tie[p] ?? 0;
        totals.shareUnits[p] += counts.shareUnits[p] ?? 0;
      }
      return;
    }
    for (const combo of ranges[depth] ?? []) {
      const [a = 0, b = 0] = combo;
      if (used.has(a) || used.has(b)) continue;
      used.add(a).add(b);
      deal.push(combo);
      visit(depth + 1);
      deal.pop();
      used.delete(a);
      used.delete(b);
    }
  }
  visit(0);
  return totals;
}

/**
 * Rejection sampling: uniform combo per opponent, reject the deal on any clash, then a uniform runout.
 * @param {(cards: readonly number[]) => number} evaluate
 * @param {number[]} hero
 * @param {number[]} board
 * @param {number[][][]} ranges
 * @param {number} trials
 * @param {number} seed
 */
function sampled(evaluate, hero, board, ranges, trials, seed) {
  const random = mulberry32(seed);
  const n = ranges.length + 1;
  const need = 5 - board.length;
  const dead = new Uint8Array(52);
  for (const card of [...hero, ...board]) dead[card] = 1;
  // used[card] === stamp marks the cards dealt in the current attempt.
  const used = new Int32Array(52);
  let stamp = 0;
  const hands = Array.from({ length: n }, (_, p) => [
    ...(p === 0 ? hero : [0, 0]),
    ...board,
    ...new Array(need).fill(0),
  ]);
  const ranks = new Array(n).fill(0);
  const counts = {
    trials: 0,
    win: new Array(n).fill(0),
    tie: new Array(n).fill(0),
    shareUnits: new Array(n).fill(0),
  };
  let rejected = 0;
  while (counts.trials < trials) {
    stamp += 1;
    let clash = false;
    for (let j = 0; j < ranges.length; j++) {
      const range = ranges[j] ?? [];
      const [a = 0, b = 0] = range[Math.floor(random() * range.length)] ?? [];
      if (used[a] === stamp || used[b] === stamp) {
        clash = true;
        break;
      }
      used[a] = stamp;
      used[b] = stamp;
      const hand = hands[j + 1] ?? [];
      hand[0] = a;
      hand[1] = b;
    }
    if (clash) {
      rejected += 1;
      if (rejected >= 1000 * trials) throw new Error('too many rejected deals');
      continue;
    }
    for (let r = 0; r < need; r++) {
      let card;
      do card = Math.floor(random() * 52);
      while (dead[card] || used[card] === stamp);
      used[card] = stamp;
      for (const hand of hands) hand[2 + board.length + r] = card;
    }
    let best = -1;
    for (let p = 0; p < n; p++) {
      ranks[p] = evaluate(hands[p] ?? []);
      best = Math.max(best, ranks[p]);
    }
    const winners = ranks.filter((rank) => rank === best).length;
    for (let p = 0; p < n; p++) {
      if (ranks[p] !== best) continue;
      if (winners === 1) counts.win[p] += 1;
      else counts.tie[p] += 1;
      counts.shareUnits[p] += SHARE_UNITS / winners;
    }
    counts.trials += 1;
  }
  return counts;
}

/**
 * Reference counts for hero (index 0) and each opponent in listed order.
 * @param {(cards: readonly number[]) => number} evaluate
 * @param {number[]} hero
 * @param {number[]} board
 * @param {number[][][]} ranges live combos per opponent
 * @param {{ limit: number, trials: number, seed: number }} options
 * @returns {Reference}
 */
export function computeReference(evaluate, hero, board, ranges, options) {
  if (!dealExists(ranges, 0, new Set())) throw new Error('Opponents cannot all be dealt');
  const estimate = estimateEvaluations(
    ranges.map((range) => range.length),
    board.length,
  );
  if (estimate <= options.limit) {
    return { method: 'exhaustive', ...exhaustive(evaluate, hero, board, ranges) };
  }
  return {
    method: 'high-sample',
    ...sampled(evaluate, hero, board, ranges, options.trials, options.seed),
  };
}

/** @param {number} value */
function round6(value) {
  return Math.round(value * 1e6) / 1e6;
}

async function main() {
  const { runnerImport } = await import('vite');
  const config = {
    configFile: /** @type {false} */ (false),
    logLevel: /** @type {const} */ ('silent'),
  };
  /** @param {string} path */
  const load = async (path) => (await runnerImport(resolve(ROOT, path), config)).module;
  const evaluator = await load('src/engine/hand-evaluator.ts');
  const cards = await load('src/engine/cards.ts');
  const ranges = await load('src/advice/ranges.ts');
  const evaluate = /** @type {(cards: readonly number[]) => number} */ (evaluator.evaluate);
  const lib = /** @type {RangeLib} */ ({
    parseCards: cards.parseCards,
    parseHandRange: ranges.parseHandRange,
    expandRange: ranges.expandRange,
    unseenCombos: ranges.unseenCombos,
  });

  const started = Date.now();
  const lines = MULTIWAY_CASES.map((c, caseIndex) => {
    const hero = lib.parseCards(c.hero);
    const board = lib.parseCards(c.board);
    const dead = [...hero, ...board];
    const resolved = c.opponents.map((text) => resolveOpponent(text, dead, lib));
    resolved.forEach((range, j) => {
      if (range.length === 0) throw new Error(`${c.id}: opponent ${j + 1} has no live combo`);
    });
    const seed = (MULTIWAY_SEED + caseIndex + 1) >>> 0;
    /** @type {Reference} */
    let reference;
    try {
      reference = computeReference(evaluate, hero, board, resolved, {
        limit: EXHAUSTIVE_LIMIT,
        trials: SAMPLE_TRIALS,
        seed,
      });
    } catch (error) {
      throw new Error(`${c.id}: ${/** @type {Error} */ (error).message}`, { cause: error });
    }
    const total = SHARE_UNITS * reference.trials;
    process.stdout.write(`${c.id} ${reference.method} ${reference.trials}\n`);
    return JSON.stringify({
      ...c,
      combos: resolved.map((range) => range.length),
      method: reference.method,
      seed: reference.method === 'high-sample' ? seed : null,
      trials: reference.trials,
      win: reference.win,
      tie: reference.tie,
      shareUnits: reference.shareUnits,
      equity: reference.shareUnits.map((units) => round6(units / total)),
    });
  });
  const header = JSON.stringify({
    generator: 'tools/equity/generate-multiway-reference.js',
    shareUnits: SHARE_UNITS,
    seed: MULTIWAY_SEED,
    exhaustiveLimit: EXHAUSTIVE_LIMIT,
    sampleTrials: SAMPLE_TRIALS,
  });
  const text = `${header.slice(0, -1)},"cases":[\n${lines.join(',\n')}\n]}\n`;
  writeFileSync(resolve(ROOT, FIXTURE), text);
  process.stdout.write(`wrote ${MULTIWAY_CASES.length} cases to ${FIXTURE}\n`);
  process.stdout.write(`took ${((Date.now() - started) / 1000).toFixed(1)} s\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
