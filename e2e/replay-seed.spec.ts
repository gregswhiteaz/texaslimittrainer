import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { build, type Rolldown } from 'vite';
import { formatCard } from '../src/engine/cards';

const ORIGIN = 'http://localhost:4173';
const DECK_ENTRY = fileURLToPath(new URL('../src/engine/deck.ts', import.meta.url));
const GOLDEN_CODE = '0123456789abcdeffedcba9876543210';
const GOLDEN_DECK =
  '6d Qs 8h Ts Ad Qd 4h Jh Tc 6s 2s 7h Js 2h Ks 4c 2d 6c Ah Qh 8d Jd 8c 4d 7d 9s 8s 2c 7s 7c Kc Ac 5c Qc Kh 3s 6h As 9c 3d 9h Td 4s 5s 3h 5d Kd Th Jc 5h 9d 3c';

interface RecordedCall {
  type: string;
  length: number;
  values: number[];
}

declare global {
  interface Window {
    __randomCalls: RecordedCall[];
    TlhDeck: typeof import('../src/engine/deck');
  }
}

let deckBundle = '';

test.beforeAll(async () => {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    build: {
      write: false,
      minify: false,
      lib: { entry: DECK_ENTRY, formats: ['iife'], name: 'TlhDeck' },
    },
  });
  const outputs = (Array.isArray(result) ? result : [result]) as Rolldown.RolldownOutput[];
  const chunk = outputs.flatMap((output) => output.output).find((file) => file.type === 'chunk');
  if (!chunk || chunk.type !== 'chunk') throw new Error('Vite produced no JavaScript chunk');
  deckBundle = chunk.code;
});

test('browser seed comes from crypto.getRandomValues and decks match Node', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));

  await page.addInitScript(() => {
    window.__randomCalls = [];
    const original = crypto.getRandomValues.bind(crypto);
    crypto.getRandomValues = ((array: Uint32Array<ArrayBuffer>) => {
      original(array);
      window.__randomCalls.push({
        type: array.constructor.name,
        length: array.length,
        values: Array.from(array),
      });
      return array;
    }) as typeof crypto.getRandomValues;
  });
  await page.goto('/');
  await page.addScriptTag({ content: deckBundle });

  const { code, calls, hasProcess } = await page.evaluate(() => {
    const before = window.__randomCalls.length;
    const code = window.TlhDeck.newReplayCode();
    return {
      code,
      calls: window.__randomCalls.slice(before),
      hasProcess: typeof process !== 'undefined',
    };
  });
  expect(hasProcess).toBe(false);
  expect(calls).toHaveLength(1);
  const [call] = calls;
  expect(call?.type).toBe('Uint32Array');
  expect(call?.length).toBe(4);
  expect(code).toBe(call?.values.map((word) => word.toString(16).padStart(8, '0')).join(''));

  const deck = await page.evaluate((golden) => window.TlhDeck.shuffledDeck(golden), GOLDEN_CODE);
  expect(deck.map(formatCard).join(' ')).toBe(GOLDEN_DECK);

  expect(requests.length).toBeGreaterThan(0);
  expect(requests.map((url) => new URL(url).origin)).toEqual(requests.map(() => ORIGIN));
});
