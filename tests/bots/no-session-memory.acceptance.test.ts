import { describe, expect, it } from 'vitest';
import { parseCards } from '../../src/engine/cards';
import type { Card } from '../../src/engine/cards';
import type { Action } from '../../src/engine/hand';
import { rememberShowdown, type EarlierShowdown } from '../../src/engine/player-view';
import { seatLineUp } from '../../src/bots/lineup';
import { seatStylesPolicyFactory } from '../../src/playtest/policy';
import { EARLIER_SHOWDOWN_LIMIT, runPlaytest } from '../../src/playtest/runner';

const HANDS = 200;
const SEED = 20;
const SIZE = 6;
const TEST_TIMEOUT_MS = 60_000;

/** A fixed earlier showdown where every seat 1..6 showed a hand. */
const HOLES = parseCards('As Ad Kh Kc Qs Jd 9h 9c 7s 2d 5h 4c');
const SHOWN_LIST: readonly EarlierShowdown[] = rememberShowdown(
  [],
  {
    shown: Array.from({ length: SIZE }, (_, i) => ({
      seat: i + 1,
      holeCards: [HOLES[2 * i], HOLES[2 * i + 1]] as [Card, Card],
    })),
  },
  EARLIER_SHOWDOWN_LIMIT,
);

describe('TASK-6.20 bots decide from the current hand only (REQ-029.3)', () => {
  it(
    'bot actions ignore earlier showdowns',
    () => {
      const seats = seatLineUp('Mixed', SIZE, 1);
      const factory = seatStylesPolicyFactory(seats);
      const mismatches: { seat: number; real: Action; other: Action }[] = [];
      const styles = new Set<string>();
      let compared = 0;
      let withList = 0;
      const summary = runPlaytest(
        { hands: HANDS, seed: SEED, size: SIZE, lineUp: 'Mixed' },
        undefined,
        {
          makePolicy: (code, seat) => {
            const policy = factory(code, seat);
            const style = seats[seat - 1]?.style ?? null;
            if (style === null) return policy;
            return (view) => {
              const real = policy(view);
              const alt = view.earlierShowdowns.length > 0 ? [] : SHOWN_LIST;
              const other = policy({ ...view, earlierShowdowns: alt });
              compared++;
              if (view.earlierShowdowns.length > 0) withList++;
              styles.add(style);
              if (JSON.stringify(real) !== JSON.stringify(other))
                mismatches.push({ seat, real, other });
              return real;
            };
          },
        },
      );
      expect(summary.violations).toBe(0);
      expect(mismatches).toEqual([]);
      expect(compared).toBeGreaterThanOrEqual(1000);
      expect(withList).toBeGreaterThanOrEqual(200);
      expect([...styles].sort()).toEqual(['Calling station', 'Maniac', 'Rock', 'TAG']);
    },
    TEST_TIMEOUT_MS,
  );
});
