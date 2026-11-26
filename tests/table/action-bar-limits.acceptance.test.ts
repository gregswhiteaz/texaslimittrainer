import { describe, expect, it, vi } from 'vitest';
import { replayCodeFromWords, shuffledDeck } from '../../src/engine/deck';
import {
  applyAction,
  createHand,
  legalActions,
  minimumStack,
  STREET_BET_CAP,
  type Action,
  type HandState,
  type SeatNumber,
} from '../../src/engine/hand';
import { playerView, type SeatPolicy } from '../../src/engine/player-view';
import { fnv1a32, Xoshiro128 } from '../../src/engine/seeded-random';
import { randomMovePolicy, seatGenerator } from '../../src/playtest/policy';
import { actionBar, actionLabel, type AmountUnit } from '../../src/table/action-bar';
import { stakesFor, type Stake } from '../../src/table/session';

vi.setConfig({ testTimeout: 30_000 });

const STATES = 100_000;
const UNLIMITED = 1_000_000_000;
/** Cash $2/$4 and $4/$8, then sit-and-go L1, L3 and L10 in chips (REQ-008.2). */
const STAKES: readonly { stake: Stake; unit: AmountUnit }[] = [
  { stake: { smallBet: 2, bigBet: 4 }, unit: 'dollars' },
  { stake: { smallBet: 4, bigBet: 8 }, unit: 'dollars' },
  { stake: { smallBet: 20, bigBet: 40 }, unit: 'chips' },
  { stake: { smallBet: 40, bigBet: 80 }, unit: 'chips' },
  { stake: { smallBet: 600, bigBet: 1200 }, unit: 'chips' },
];

/** Short (1..2 big bets), up to the capped-hand cost, or the 20-big-bet buy-in, chosen per seat (A-4). */
function seatStack(rng: Xoshiro128, stake: Stake): number {
  switch (rng.nextInt(3)) {
    case 0:
      return 1 + rng.nextInt(2 * stake.bigBet);
    case 1:
      return 1 + rng.nextInt(minimumStack(stakesFor(stake)));
    default:
      return 20 * stake.bigBet;
  }
}

/** D-5 oracle: an action is short iff its amount is below the same action's amount with chips to spare. */
function oracleLabels(hand: HandState, unit: AmountUnit): string[] {
  const seat = hand.toAct;
  const rich: HandState = {
    ...hand,
    players: hand.players.map((p) => (p.seat === seat ? { ...p, stack: UNLIMITED } : p)),
  };
  const full = legalActions(rich);
  return legalActions(hand).map((action) => {
    const same = full.find((a) => a.type === action.type);
    if (same === undefined) throw new Error(`No ${action.type} with an unlimited stack`);
    const amount = 'amount' in action ? action.amount : 0;
    const fullAmount = 'amount' in same ? same.amount : 0;
    const money = unit === 'chips' ? String(amount) : `$${amount}`;
    const allIn = amount < fullAmount ? 'all-in ' : '';
    switch (action.type) {
      case 'fold':
        return 'Fold';
      case 'check':
        return 'Check';
      case 'call':
        return `Call ${allIn}${money}`;
      case 'bet':
        return `Bet ${allIn}${money}`;
      case 'raise':
        return `Raise ${allIn}to ${money}`;
    }
  });
}

describe('Action bar on capped streets and short stacks (seeded states)', () => {
  it("the bar equals the engine's legal set in 100,000 capped and short-stack states", () => {
    const sizes = new Set<number>();
    const labels = new Set<string>();
    let capped = 0;
    let notReopened = 0;
    let decisions = 0;

    for (let i = 0; decisions < STATES; i++) {
      const code = replayCodeFromWords([i, 0x3a7e, 7, 7]);
      const count = 2 + (i % 9);
      const seats: SeatNumber[] = Array.from({ length: count }, (_, k) => k + 1);
      const { stake, unit } = STAKES[i % STAKES.length] as (typeof STAKES)[number];
      const stackRng = new Xoshiro128(fnv1a32(`${code}/stacks`));
      const policies = new Map<number, SeatPolicy>(
        seats.map((seat) => [seat, randomMovePolicy(seatGenerator(code, seat))]),
      );
      let hand: HandState = createHand({
        stakes: stakesFor(stake),
        seats: seats.map((seat) => ({ seat, stack: seatStack(stackRng, stake) })),
        button: seats[i % count] as SeatNumber,
        deck: shuffledDeck(code),
      });

      while (hand.toAct !== null && decisions < STATES) {
        const seat = hand.toAct;
        const view = playerView(hand, seat);
        const bar = actionBar(view, unit);
        const legal = legalActions(hand);
        expect(bar.enabled).toBe(true);
        expect(bar.buttons.map((b) => b.action)).toEqual(legal);
        const expected = oracleLabels(hand, unit);
        expect(bar.buttons.map((b) => b.label)).toEqual(expected);
        for (const label of expected) labels.add(label);

        sizes.add(count);
        const player = hand.players.find((p) => p.seat === seat);
        const owes = hand.currentBet > (player?.streetContribution ?? 0);
        const raises = legal.some((a) => a.type === 'raise');
        if (owes && !raises && hand.betCount === STREET_BET_CAP) capped++;
        if (owes && !raises && hand.betCount < STREET_BET_CAP && player?.hasActed === true) {
          notReopened++;
        }

        decisions++;
        const applied = applyAction(hand, (policies.get(seat) as SeatPolicy)(view));
        if (!applied.ok) throw new Error(applied.error.message);
        hand = applied.state;
      }
    }

    const all = [...labels];
    expect(decisions).toBe(STATES);
    expect([...sizes].sort((a, b) => a - b)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(capped).toBeGreaterThan(0);
    expect(notReopened).toBeGreaterThan(0);
    for (const prefix of ['Call all-in ', 'Bet all-in ', 'Raise all-in to ']) {
      expect(all.some((label) => label.startsWith(prefix))).toBe(true);
    }
    expect(all.some((label) => /\d/.test(label) && !label.includes('$'))).toBe(true);
    expect(all.some((label) => label.includes('$'))).toBe(true);
  });

  it('actionLabel names all-in and chip amounts', () => {
    const act = (type: 'call' | 'bet' | 'raise', amount: number): Action => ({
      seat: 5,
      type,
      amount,
    });
    expect(actionLabel(act('call', 3), { allIn: true })).toBe('Call all-in $3');
    expect(actionLabel(act('bet', 3), { allIn: true })).toBe('Bet all-in $3');
    expect(actionLabel(act('raise', 6), { allIn: true })).toBe('Raise all-in to $6');

    expect(actionLabel(act('call', 40), { unit: 'chips' })).toBe('Call 40');
    expect(actionLabel(act('raise', 80), { unit: 'chips' })).toBe('Raise to 80');
    expect(actionLabel(act('bet', 40), { unit: 'chips' })).toBe('Bet 40');

    const chipsAllIn = { allIn: true, unit: 'chips' } as const;
    expect(actionLabel(act('call', 30), chipsAllIn)).toBe('Call all-in 30');
    expect(actionLabel(act('bet', 30), chipsAllIn)).toBe('Bet all-in 30');
    expect(actionLabel(act('raise', 70), chipsAllIn)).toBe('Raise all-in to 70');

    for (const unit of ['dollars', 'chips'] as const) {
      expect(actionLabel({ seat: 5, type: 'fold' }, { unit })).toBe('Fold');
      expect(actionLabel({ seat: 5, type: 'check' }, { unit })).toBe('Check');
    }
    expect(actionLabel(act('call', 4))).toBe('Call $4');
  });
});
