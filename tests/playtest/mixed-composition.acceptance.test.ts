import { describe, expect, it } from 'vitest';
import { runPlaytest, type PlayedHand } from '../../src/playtest/runner';
import {
  configForLineUp,
  DEFAULT_SESSION_CONFIG,
  nextHand,
  type BotStyle,
} from '../../src/table/session';
import { KINGS_SHOWDOWN, withFinalStacks } from '../support/table-scenarios';

const TEST_TIMEOUT_MS = 120_000;
const HANDS = 2000;

const botStyles = (hand: PlayedHand): string[] =>
  (hand.lineUp ?? [])
    .filter((s) => s.kind === 'bot')
    .map((s) => String(s.style))
    .sort();

describe('Mixed line-up composition (TASK-6.25)', () => {
  it(
    'a busted bot is replaced by a new bot of the same style and the Mixed line-up keeps its styles',
    () => {
      const hands: PlayedHand[] = [];
      const summary = runPlaytest({ hands: HANDS, seed: 42, size: 6, lineUp: 'Mixed' }, (hand) =>
        hands.push(hand),
      );
      expect(summary.violations).toBe(0);
      expect(hands).toHaveLength(HANDS);
      const start = ['Calling station', 'Maniac', 'Rock', 'TAG', 'TAG'];
      let replacements = 0;
      for (const [i, hand] of hands.entries()) {
        expect(botStyles(hand)).toEqual(start);
        const previous = hands[i - 1];
        for (const seat of hand.replaced ?? []) {
          replacements++;
          if (previous === undefined) throw new Error('a replacement before the first hand');
          const before = previous.lineUp?.[seat - 1];
          const after = hand.lineUp?.[seat - 1];
          expect(previous.final.players.find((p) => p.seat === seat)?.stack).toBe(0);
          expect(hand.record.seats.find((s) => s.seat === seat)?.stack).toBe(160);
          expect(after?.kind).toBe('bot');
          expect(after?.style).toBe(before?.style);
          expect(after?.name).not.toBe(before?.name);
        }
      }
      expect(replacements).toBeGreaterThan(0);

      // The app: a bot on $0 at the end of a hand is replaced by a bot of its style, at a Custom table and a preset.
      const styles: Record<number, BotStyle> = { 1: 'Maniac', 2: 'Rock', 3: 'Calling station' };
      const custom = KINGS_SHOWDOWN.seats.map((s) =>
        s.kind === 'bot' ? { ...s, style: styles[s.seat] ?? s.style } : s,
      );
      const mixed = configForLineUp(DEFAULT_SESSION_CONFIG, 6, 'Mixed');
      expect(mixed.userSeat).toBe(KINGS_SHOWDOWN.config.userSeat);
      for (const [lineUp, seats] of [
        ['Custom', custom],
        ['Mixed', mixed.seats],
      ] as const) {
        const table = { ...KINGS_SHOWDOWN, config: { ...KINGS_SHOWDOWN.config, lineUp }, seats };
        const next = nextHand(withFinalStacks([0, 0, 0, 160, 96, 0], table));
        expect(next.seats.map((s) => s.style)).toEqual(seats.map((s) => s.style));
        for (const seat of [1, 2, 3, 6]) {
          expect(next.seats[seat - 1]?.name).not.toBe(seats[seat - 1]?.name);
          expect(next.stacks[seat - 1]?.stack).toBe(160);
        }
      }
    },
    TEST_TIMEOUT_MS,
  );
});
