import { describe, expect, it } from 'vitest';
import { botActionDelayMs, RAPID_BOT_DELAY_MS, seatSession } from '../../src/table/session';

describe('bot pace', () => {
  it('Rapid adds no wait before a bot acts', () => {
    expect(RAPID_BOT_DELAY_MS).toBe(0);
    expect(botActionDelayMs('rapid')).toBe(0);
  });

  it('a new session plays at Rapid, so its bots wait 0 ms', () => {
    const table = seatSession();
    expect(table.config.speed).toBe('rapid');
    expect(botActionDelayMs(table.config.speed)).toBe(0);
  });
});

it('DRILL TASK-1.50: deliberately broken (tests/table/pace.test.ts)', () => {
  expect('drill').toBe('green');
});
