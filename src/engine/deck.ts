import { echoValue, type Card } from './cards';
import { mixState128, Xoshiro128 } from './seeded-random';

/** 32 lowercase hex characters: the hand's 128-bit seed, word 0 first. Never all zeros. */
export type ReplayCode = string;

const REPLAY_CODE_PATTERN = /^[0-9a-f]{32}$/;
const ZERO_CODE = '0'.repeat(32);

function encodeWords(words: ArrayLike<number>): ReplayCode {
  return Array.from(words, (word) => word.toString(16).padStart(8, '0')).join('');
}

/** A new code from globalThis.crypto.getRandomValues(new Uint32Array(4)); redraws on all-zero words. */
export function newReplayCode(): ReplayCode {
  const words = new Uint32Array(4);
  do {
    globalThis.crypto.getRandomValues(words);
  } while (words.every((word) => word === 0));
  return encodeWords(words);
}

/** Encodes four unsigned 32-bit words. For seeded runs (TASK-1.6). Throws RangeError on bad input. */
export function replayCodeFromWords(words: readonly number[]): ReplayCode {
  if (
    words.length !== 4 ||
    !words.every((word) => Number.isInteger(word) && word >= 0 && word <= 0xffffffff) ||
    words.every((word) => word === 0)
  ) {
    throw new RangeError('Invalid replay code words');
  }
  return encodeWords(words);
}

/** True iff text is a string matching exactly /^[0-9a-f]{32}$/ and not all zeros (no coercion). */
export function isReplayCode(text: unknown): boolean {
  return typeof text === 'string' && REPLAY_CODE_PATTERN.test(text) && text !== ZERO_CODE;
}

/** A new array of the 52 cards in deal order (index 0 is dealt first). Throws RangeError on an invalid code. */
export function shuffledDeck(code: ReplayCode): Card[] {
  if (!isReplayCode(code)) {
    throw new RangeError(`Invalid replay code: "${echoValue(code)}"`);
  }
  const word = (k: number) => parseInt(code.slice(8 * k, 8 * k + 8), 16);
  const rng = Xoshiro128.fromState(...mixState128([word(0), word(1), word(2), word(3)]));
  const deck: Card[] = Array.from({ length: 52 }, (_, card) => card);
  for (let i = 51; i > 0; i--) {
    const j = rng.nextIntUnbiased(i + 1);
    const card = deck[i] as Card;
    deck[i] = deck[j] as Card;
    deck[j] = card;
  }
  return deck;
}
