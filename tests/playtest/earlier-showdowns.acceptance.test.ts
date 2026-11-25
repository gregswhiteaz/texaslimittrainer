import { describe, expect, it } from 'vitest';
import type { SeatNumber } from '../../src/engine/hand';
import { showdownOf, type EarlierShowdown, type PlayerView } from '../../src/engine/player-view';
import { runPlaytest, type PlayedHand, type PolicyFactory } from '../../src/playtest/runner';

/** Seed 5, 3 seats, Tough, cash: every seat raises or calls, so every hand shows down and bots bust and are
 *  replaced. Records every decision's earlierShowdowns, grouped by hand. `inspect` sees each view first. */
function run(inspect?: (view: PlayerView) => void) {
  const perHand: (readonly EarlierShowdown[])[][] = [];
  const played: PlayedHand[] = [];
  let current: (readonly EarlierShowdown[])[] = [];
  const raiseOrCall: PolicyFactory = () => (view) => {
    inspect?.(view);
    current.push(view.earlierShowdowns);
    const legal = view.legalActions;
    const action =
      legal.find((a) => a.type === 'raise' || a.type === 'bet') ??
      legal.find((a) => a.type === 'call' || a.type === 'check');
    if (action === undefined) throw new Error('no legal action');
    return action;
  };
  const summary = runPlaytest(
    { hands: 12, seed: 5, size: 3, game: 'cash', lineUp: 'Tough' },
    (hand) => {
      played.push(hand);
      perHand.push(current);
      current = [];
    },
    { makePolicy: raiseOrCall },
  );
  return { summary, perHand, played };
}

/** The list hand `k` (1-based) should see: earlier showdowns, each seat keeping only its current player's hands. */
function model(played: readonly PlayedHand[], k: number): EarlierShowdown[] {
  const arrival = (seat: SeatNumber) => {
    let since = 1;
    for (let j = 1; j <= k; j++) if (played[j - 1]?.replaced?.includes(seat)) since = j;
    return since;
  };
  const list: EarlierShowdown[] = [];
  for (let j = 1; j < k; j++) {
    const entry = showdownOf((played[j - 1] as PlayedHand).final);
    if (entry === null) continue;
    const shown = entry.shown.filter((s) => j >= arrival(s.seat));
    if (shown.length > 0) list.push({ shown });
  }
  return list;
}

function frozenThroughout(list: readonly EarlierShowdown[]): boolean {
  return (
    Object.isFrozen(list) &&
    list.every(
      (entry) =>
        Object.isFrozen(entry) &&
        Object.isFrozen(entry.shown) &&
        entry.shown.every((s) => Object.isFrozen(s) && Object.isFrozen(s.holeCards)),
    )
  );
}

describe('Earlier showdowns follow the player, not the seat', () => {
  it("a replaced bot never sees the previous seat holder's showdowns", () => {
    const { summary, perHand, played } = run();
    expect(summary.violations).toBe(0);
    expect(played).toHaveLength(12);
    expect(played.some((hand) => (hand.replaced ?? []).length > 0)).toBe(true);

    perHand.forEach((decisions, i) => {
      expect(decisions.length).toBeGreaterThan(0);
      const expected = model(played, i + 1);
      for (const seen of decisions) expect(seen).toEqual(expected);
    });

    let forgotten = 0;
    played.forEach((hand, i) => {
      for (const seat of hand.replaced ?? []) {
        const before = perHand[i - 1]?.[0] ?? [];
        forgotten += before.flatMap((e) => e.shown).filter((s) => s.seat === seat).length;
        for (const seen of perHand[i] ?? []) {
          expect(seen.flatMap((e) => e.shown).some((s) => s.seat === seat)).toBe(false);
        }
      }
    });
    expect(forgotten).toBeGreaterThan(0);
  });

  it('every earlier showdown a policy receives is frozen', () => {
    let nonEmpty = 0;
    let typeErrors = 0;
    const attempt = (change: () => void) => {
      try {
        change();
      } catch (error) {
        if (error instanceof TypeError) typeErrors++;
        else throw error;
      }
    };
    const { summary, perHand, played } = run((view) => {
      const list = view.earlierShowdowns;
      if (list.length === 0) return;
      nonEmpty++;
      expect(frozenThroughout(list)).toBe(true);
      const entry = list[0] as EarlierShowdown;
      const shown = entry.shown[0] as EarlierShowdown['shown'][number];
      attempt(() => (list as EarlierShowdown[]).push({ shown: [] }));
      attempt(() => ((entry as { shown: unknown }).shown = []));
      attempt(() => (entry.shown as EarlierShowdown['shown'][number][]).push(shown));
      attempt(() => ((shown as { seat: SeatNumber }).seat = 9));
      attempt(() => ((shown.holeCards as unknown as number[])[0] = 0));
    });
    expect(summary.violations).toBe(0);
    expect(nonEmpty).toBeGreaterThan(0);
    expect(typeErrors).toBe(nonEmpty * 5);
    perHand.forEach((decisions, i) => {
      const expected = model(played, i + 1);
      for (const seen of decisions) expect(seen).toEqual(expected);
    });
  });
});
