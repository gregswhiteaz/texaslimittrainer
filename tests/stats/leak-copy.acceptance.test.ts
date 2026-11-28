import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { VALUE_RAISE_THRESHOLD_PCT } from '../../src/advice/postflop';
import { LEAK_CATEGORIES, type LeakCategory } from '../../src/stats/leaks';

// TASK-10.14: postflop leak texts match the advice rules (REQ-047.5, REQ-061.2).

const REVISED = {
  'turn-facing-a-bet-fold.fix':
    'Before you fold to a turn bet, compare your chance to win with the price of the call plus the river bet that usually follows, and call whenever your chance is at least that price.',
  'turn-facing-a-bet-fold.justification':
    'A turn call is priced with the river big bet the hero will likely face, and the call is right when equity is at least that price, or a little less for a draw that wins more bets when it hits (pot-odds-call, implied-odds-call).',
  'turn-facing-a-bet-call.justification':
    'A draw has only one card to come on the turn instead of two, so its equity drops while the price now counts the likely river big bet too, and calls that were fine on the flop can lose on the turn (pot-odds-call, pot-odds-fold).',
  'flop-facing-a-bet-call.fix':
    'Call a flop bet only when your chance to win, counting your outs, is at least the price of the call, and raise instead when you are well ahead of the hands that would call a raise.',
  'flop-not-facing-a-bet-bet.fix':
    'Bet the flop only when most of the hands that would call are worse than yours, and check the rest, because a check costs nothing now and you see the turn for free if no one bets after you.',
} as const;

const RAISE_REVISED = {
  'flop-facing-a-bet-raise.justification':
    'The value-raise rule asks for more than 65% equity against the hands that would call a raise, so a hand below that bar should just call or fold by the pot-odds and implied-odds rules (value-raise, pot-odds-call, implied-odds-call).',
  'turn-facing-a-bet-raise.justification':
    'The value-raise rule needs more than 65% equity against the hands that would call a raise, and the cost of being wrong doubles on the turn (value-raise).',
} as const;

const UNCHANGED = {
  'turn-facing-a-bet-call.fix':
    'The turn bet is twice the size of a flop bet, so call it only with a made hand that is often best or a draw whose outs pay for the price.',
  'flop-facing-a-bet-call.justification':
    'A call is graded against the pot-odds price and against the value-raise rule, so calls go wrong both when the hand is too weak and when it is strong enough to raise.',
  'flop-not-facing-a-bet-bet.justification':
    'A bet earns only from worse hands that pay it; when the hands that call are mostly better, the check-free rule is the better play.',
  'flop-facing-a-bet-raise.fix':
    'Raise a flop bet only when your hand beats most of the hands that will call the raise, and just call with draws and medium hands that need to improve.',
  'turn-facing-a-bet-raise.fix':
    'Raise a turn bet only with a hand that beats most of the hands that will call, because a raise at the big-bet level costs twice as much when you are behind.',
} as const;

const ALL_REVISED: Record<string, string> = { ...REVISED, ...RAISE_REVISED };

const GONE = [
  'has grown enough',
  'raises the required equity',
  'beats the price of the call',
  'to see the turn for free',
  'better than even equity',
];

function field(key: string): string {
  const [id, name] = key.split('.') as [string, 'fix' | 'justification'];
  const category = LEAK_CATEGORIES.find((c: LeakCategory) => c.id === id);
  if (category === undefined) throw new Error(`missing leak category ${id}`);
  return category[name];
}

describe('TASK-10.14 postflop leak copy', () => {
  it('AC#1 the three revised leak entries carry the approved wording', () => {
    for (const [key, text] of Object.entries({ ...REVISED, ...UNCHANGED })) {
      expect(field(key), key).toBe(text);
    }
  });

  it('AC#1 each revised text is one sentence with no characters React escapes', () => {
    for (const key of Object.keys(ALL_REVISED)) {
      const text = field(key);
      expect(text, key).toMatch(/^[A-Z][^.!?]*\.$/);
      expect(text, key).not.toMatch(/['"&<>]/);
    }
  });

  it('AC#1 the inaccurate phrases no longer appear', () => {
    const postflop = LEAK_CATEGORIES.filter((c) => c.street !== 'preflop');
    expect(postflop.length).toBeGreaterThan(0);
    for (const c of postflop) {
      for (const phrase of GONE) {
        expect(c.fix, c.id).not.toContain(phrase);
        expect(c.justification, c.id).not.toContain(phrase);
      }
    }
  });

  it('AC#1 docs/stats/leaks.md shows the revised wording', () => {
    const docs = readFileSync(new URL('../../docs/stats/leaks.md', import.meta.url), 'utf8');
    for (const text of Object.values(ALL_REVISED)) expect(docs).toContain(text);
    for (const phrase of GONE) expect(docs).not.toContain(phrase);
  });

  it('AC#2 the raise justifications state the value-raise bar of more than 65%', () => {
    expect(VALUE_RAISE_THRESHOLD_PCT).toBe(65);
    for (const [key, text] of Object.entries(RAISE_REVISED)) {
      expect(field(key), key).toBe(text);
      expect(text).toContain(
        `more than ${VALUE_RAISE_THRESHOLD_PCT}% equity against the hands that would call a raise`,
      );
    }
    expect(field('flop-facing-a-bet-raise.fix')).toBe(UNCHANGED['flop-facing-a-bet-raise.fix']);
    expect(field('turn-facing-a-bet-raise.fix')).toBe(UNCHANGED['turn-facing-a-bet-raise.fix']);
  });
});
