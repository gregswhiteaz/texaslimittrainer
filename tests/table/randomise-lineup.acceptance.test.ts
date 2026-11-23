import { describe, expect, it } from 'vitest';
import { Xoshiro128 } from '../../src/engine/seeded-random';
import {
  BOT_STYLES,
  botsClockwise,
  configForGameType,
  configForLineUp,
  configWithSeatStyles,
  DEFAULT_SESSION_CONFIG,
  randomBotStyles,
  seatSession,
  type BotStyle,
  type SessionConfig,
} from '../../src/table/session';
import type { LineUpPreset } from '../../src/bots/lineup';

const cycling = (words: readonly number[]) => {
  let i = 0;
  return (): number => words[i++ % words.length] as number;
};

const botRows = (config: SessionConfig): string[] =>
  config.seats.filter((s) => s.kind === 'bot').map((s) => `${s.seat} ${s.name} ${s.style}`);

/** The Start game config after `styles` is applied, seated. */
const start = (
  c: SessionConfig,
  preset: LineUpPreset,
  styles: Readonly<Record<number, BotStyle>>,
) =>
  seatSession(
    configForGameType(configWithSeatStyles(c, preset, styles), 'cash', { smallBet: 4, bigBet: 8 }),
  );

describe('Randomise line-up acceptance (TASK-2.9)', () => {
  it('1000 seeded randomisations at 6 players give every seat each of the four styles', () => {
    const c = configForLineUp(DEFAULT_SESSION_CONFIG, 6, 'Mixed');
    const rng = new Xoshiro128(20261122);
    const counts = new Map<number, Map<BotStyle, number>>();
    for (let i = 0; i < 1000; i++) {
      const styles = randomBotStyles(c, () => rng.nextUint32());
      for (const [seat, style] of Object.entries(styles)) {
        const perSeat = counts.get(Number(seat)) ?? new Map<BotStyle, number>();
        perSeat.set(style, (perSeat.get(style) ?? 0) + 1);
        counts.set(Number(seat), perSeat);
      }
    }

    expect([...counts.keys()].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 6]);
    for (const perSeat of counts.values()) {
      const tally = BOT_STYLES.map((style) => perSeat.get(style) ?? 0);
      expect(tally.reduce((a, b) => a + b, 0)).toBe(1000);
      for (const n of tally) {
        expect(n).toBeGreaterThanOrEqual(180);
        expect(n).toBeLessThanOrEqual(320);
      }
    }
  });

  it('start game after a randomised line-up seats the drawn styles and records Custom unless it equals the preset', () => {
    const c = configForLineUp(DEFAULT_SESSION_CONFIG, 6, 'Mixed');
    const styles = randomBotStyles(c, cycling([3, 2, 1, 0, 3]));
    expect(styles).toEqual({ 6: 'Rock', 1: 'Maniac', 2: 'Calling station', 3: 'TAG', 4: 'Rock' });

    const table = start(c, 'Mixed', styles);
    expect(botsClockwise(table.config).map((s) => `${s.seat} ${s.name} ${s.style}`)).toEqual([
      '6 Ava Rock',
      '1 Ben Maniac',
      '2 Cal Calling station',
      '3 Dee TAG',
      '4 Eli Rock',
    ]);
    expect(table.seats).toEqual(table.config.seats);
    expect(table.config.lineUp).toBe('Custom');
    expect(table.config.userSeat).toBe(5);
    expect(table.config.userSeat).toBe(c.userSeat);
    expect(table.button).toBe(c.button);

    const same = randomBotStyles(c, cycling([0, 1, 2, 3, 0]));
    const mixed = start(c, 'Mixed', same);
    expect(mixed.config.lineUp).toBe('Mixed');
    expect(botRows(mixed.config)).toEqual(botRows(c));

    const tough = configForLineUp(DEFAULT_SESSION_CONFIG, 9, 'Tough');
    const rng = new Xoshiro128(7);
    const drawn = randomBotStyles(tough, () => rng.nextUint32());
    const toughStyles = Object.fromEntries(
      tough.seats.filter((s) => s.kind === 'bot').map((s) => [String(s.seat), s.style]),
    );
    expect(drawn).not.toEqual(toughStyles);
    const custom = start(tough, 'Tough', drawn);
    expect(custom.config.lineUp).toBe('Custom');
    for (const s of custom.seats.filter((seat) => seat.kind === 'bot')) {
      expect(s.style).toBe(drawn[s.seat]);
    }
    expect(custom.seats.map((s) => `${s.seat} ${s.name}`)).toEqual(
      tough.seats.map((s) => `${s.seat} ${s.name}`),
    );
    expect(custom.button).toBe(tough.button);
  });
});
