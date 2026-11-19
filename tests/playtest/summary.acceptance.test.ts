import { describe, expect, it } from 'vitest';
import type { PotAward } from '../../src/engine/hand';
import { main } from '../../src/playtest/cli';
import {
  handReplayCode,
  playHand,
  runPlaytest,
  summarize,
  type PlayedHand,
} from '../../src/playtest/runner';

const base = playHand(handReplayCode(42, 1), 4, 1);

function withAwards(number: number, awards: PotAward[]): PlayedHand {
  const result = base.final.result;
  if (result === null) throw new Error('fixture hand did not complete');
  return { ...base, number, final: { ...base.final, result: { ...result, awards } } };
}

describe('playtest Largest pot', () => {
  it('Largest pot is the largest per-hand sum of award amounts', () => {
    const a = withAwards(1, [
      { pot: 0, amount: 100, winners: [{ seat: 1, amount: 100 }] },
      { pot: 1, amount: 40, winners: [{ seat: 2, amount: 40 }] },
    ]);
    const b = withAwards(2, [{ pot: 0, amount: 60, winners: [{ seat: 3, amount: 60 }] }]);
    const c = withAwards(3, [{ pot: 0, amount: 20, winners: [{ seat: 1, amount: 20 }] }]);

    expect(summarize([a, b]).largestPot).toBe(140);
    expect(summarize([b, a, c]).largestPot).toBe(140);
  });

  it("the report's Largest pot matches the played hands", () => {
    const played: PlayedHand[] = [];
    runPlaytest({ hands: 20, seed: 42, size: 4 }, (hand) => played.push(hand));
    const pots = played.map((hand) =>
      hand.final.result === null
        ? 0
        : hand.final.players.reduce((sum, player) => sum + player.totalContribution, 0),
    );
    const expected = Math.max(...pots);
    expect(played).toHaveLength(20);
    expect(expected).toBeGreaterThan(0);
    expect(pots[pots.length - 1]).toBeLessThan(expected);

    let out = '';
    const code = main(['--hands', '20', '--seed', '42', '--size', '4'], {
      out: (text) => (out += text),
      err: () => undefined,
    });
    expect(code).toBe(0);
    expect(out).toContain(`Largest pot: $${expected}\n`);
  });
});
