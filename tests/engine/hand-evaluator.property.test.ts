import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { cardRank, cardSuit, makeCard } from '../../src/engine/cards';
import { evaluate } from '../../src/engine/hand-evaluator';
import { bestReferenceRank, fiveCardSubsets } from './reference-ranking';

const distinctCards = (size: number) =>
  fc.uniqueArray(fc.integer({ min: 0, max: 51 }), { minLength: size, maxLength: size });

/** A set of distinct cards together with the same cards in a random order. */
const cardsWithShuffle = (size: number) =>
  distinctCards(size).chain((cards) =>
    fc.tuple(fc.constant(cards), fc.shuffledSubarray(cards, { minLength: size, maxLength: size })),
  );

const suitPermutation = fc.shuffledSubarray([0, 1, 2, 3], { minLength: 4, maxLength: 4 });

describe('hand evaluator properties', () => {
  it('AC#3 seven and six cards equal the best five-card subset', () => {
    fc.assert(
      fc.property(cardsWithShuffle(7), ([seven, shuffled]) => {
        const rank = evaluate(seven);
        expect(rank).toBe(bestReferenceRank(seven));
        expect(rank).toBe(Math.max(...fiveCardSubsets(seven).map((hand) => evaluate(hand))));
        expect(evaluate(shuffled)).toBe(rank);
      }),
      { numRuns: 20_000 },
    );
    fc.assert(
      fc.property(cardsWithShuffle(6), ([six, shuffled]) => {
        const rank = evaluate(six);
        expect(rank).toBe(bestReferenceRank(six));
        expect(evaluate(shuffled)).toBe(rank);
      }),
      { numRuns: 5_000 },
    );
  }, 60_000);

  it('AC#5 relabelling suits never changes the rank', () => {
    for (const size of [5, 7]) {
      fc.assert(
        fc.property(distinctCards(size), suitPermutation, (cards, perm) => {
          const relabelled = cards.map((card) =>
            makeCard(cardRank(card), perm[cardSuit(card)] ?? 0),
          );
          expect(evaluate(relabelled)).toBe(evaluate(cards));
        }),
        { numRuns: 5_000 },
      );
    }
  });
});
