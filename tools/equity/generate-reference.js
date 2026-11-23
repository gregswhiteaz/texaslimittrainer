// Offline generator for tests/advice/fixtures/equity-reference.json (TASK-7.1, D-3).
// Computes every reference case by exhaustive enumeration using only the hand evaluator.
// It deliberately shares no code with src/advice/. Run: node tools/equity/generate-reference.js
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SHARE_UNITS = 2520;
const RANKS = '23456789TJQKA';
const SUITS = 'cdhs';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURE = 'tests/advice/fixtures/equity-reference.json';

/**
 * @typedef {{ trials: number, win: number[], tie: number[], shareUnits: number[] }} ExactCounts
 * @typedef {{ id: string, players: string[], board: string }} ReferenceMatchup
 */

/**
 * Enumerates every runout of the board for fixed player hands, in nested index order.
 * One share unit is 1/2520 of a trial.
 * @param {(cards: readonly number[]) => number} evaluate
 * @param {number[][]} players two cards each
 * @param {number[]} board 0 to 5 cards
 * @returns {ExactCounts}
 */
export function enumerateExact(evaluate, players, board) {
  const used = new Set([...players.flat(), ...board]);
  /** @type {number[]} */
  const deck = [];
  for (let card = 0; card < 52; card++) if (!used.has(card)) deck.push(card);
  const need = 5 - board.length;
  const n = players.length;
  const hands = players.map((hole) => [...hole, ...board, ...new Array(need).fill(0)]);
  const ranks = new Array(n).fill(0);
  const counts = {
    trials: 0,
    win: new Array(n).fill(0),
    tie: new Array(n).fill(0),
    shareUnits: new Array(n).fill(0),
  };

  /** @param {number} depth @param {number} start */
  function visit(depth, start) {
    if (depth === need) {
      let best = -1;
      for (let p = 0; p < n; p++) {
        ranks[p] = evaluate(hands[p] ?? []);
        best = Math.max(best, ranks[p] ?? 0);
      }
      const winners = ranks.filter((rank) => rank === best).length;
      for (let p = 0; p < n; p++) {
        if (ranks[p] !== best) continue;
        if (winners === 1) counts.win[p] += 1;
        else counts.tie[p] += 1;
        counts.shareUnits[p] += SHARE_UNITS / winners;
      }
      counts.trials += 1;
      return;
    }
    for (let i = start; i <= deck.length - (need - depth); i++) {
      for (const hand of hands) hand[2 + board.length + depth] = deck[i] ?? 0;
      visit(depth + 1, i + 1);
    }
  }
  visit(0, 0);
  return counts;
}

/** @param {number} card */
export function cardText(card) {
  return RANKS.charAt(card >> 2) + SUITS.charAt(card & 3);
}

/**
 * mulberry32, a published 32-bit generator. Returns floats in [0, 1).
 * @param {number} seed
 */
export function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Order-free identity of a matchup, from card texts. @param {string[]} players */
function matchupKey(players) {
  return players
    .map((hand) => hand.split(' ').sort().join(' '))
    .sort()
    .join('|');
}

const HAND_PICKED =
  'Ah As/Kd Kc; As Ah/Ks Kd; Ah Ad/Kh Kd; As Ks/Qh Qd; As Ks/Qs Qh; Ah Kd/Qs Qc; Ah Kd/2s 2c; Ah Kd/As Qc; Ks Kh/Ad Kc; Ah As/7d 2c; Ah Kh/7s 2d; Jh Th/As Kd; 8s 7s/Ah Ad; 5d 4d/Ks Kc; 2h 2d/3s 3c; Qs Js/Jh Td; Ah Qh/Ks Kd; Td 9d/9s 8s; Ts Th/Ad Kc; 6c 6d/As Ks'
    .split('; ')
    .map((matchup) => matchup.split('/'));
const RANDOM_CASES = 100;
const RANDOM_SEED = 20261117;

/** @returns {ReferenceMatchup[]} */
function buildMatchups() {
  const headsUp = [...HAND_PICKED];
  const seen = new Set(headsUp.map(matchupKey));
  const random = mulberry32(RANDOM_SEED);
  while (headsUp.length < HAND_PICKED.length + RANDOM_CASES) {
    // Partial Fisher-Yates: the first four cards of a fresh deck.
    const deck = Array.from({ length: 52 }, (_, i) => i);
    for (let i = 0; i < 4; i++) {
      const j = i + Math.floor(random() * (52 - i));
      [deck[i], deck[j]] = [deck[j] ?? 0, deck[i] ?? 0];
    }
    const [a = 0, b = 0, c = 0, d = 0] = deck;
    const players = [`${cardText(a)} ${cardText(b)}`, `${cardText(c)} ${cardText(d)}`];
    const key = matchupKey(players);
    if (seen.has(key)) continue;
    seen.add(key);
    headsUp.push(players);
  }
  return [
    ...headsUp.map((players, i) => ({
      id: `hu-${String(i + 1).padStart(3, '0')}`,
      players,
      board: '',
    })),
    { id: 'mw-001', players: ['Ah As', 'Kd Kc', 'Qh Qc'], board: '' },
  ];
}

/** Every reference case, in fixture order. */
export const REFERENCE_MATCHUPS = buildMatchups();

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
  const { module: evaluator } = await runnerImport(
    resolve(ROOT, 'src/engine/hand-evaluator.ts'),
    config,
  );
  const { module: cards } = await runnerImport(resolve(ROOT, 'src/engine/cards.ts'), config);
  const evaluate = /** @type {(cards: readonly number[]) => number} */ (evaluator.evaluate);
  const parseCards = /** @type {(text: string) => number[]} */ (cards.parseCards);

  const lines = REFERENCE_MATCHUPS.map((matchup) => {
    const counts = enumerateExact(
      evaluate,
      matchup.players.map(parseCards),
      parseCards(matchup.board),
    );
    const total = SHARE_UNITS * counts.trials;
    process.stdout.write(`${matchup.id} ${matchup.players.join(' vs ')}\n`);
    return JSON.stringify({
      id: matchup.id,
      players: matchup.players,
      board: matchup.board,
      method: 'exhaustive',
      trials: counts.trials,
      win: counts.win,
      tie: counts.tie,
      shareUnits: counts.shareUnits,
      equity: counts.shareUnits.map((units) => round6(units / total)),
    });
  });
  const header = JSON.stringify({
    generator: 'tools/equity/generate-reference.js',
    shareUnits: SHARE_UNITS,
  });
  const text = `${header.slice(0, -1)},"cases":[\n${lines.join(',\n')}\n]}\n`;
  writeFileSync(resolve(ROOT, FIXTURE), text);
  process.stdout.write(`wrote ${REFERENCE_MATCHUPS.length} cases to ${FIXTURE}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
