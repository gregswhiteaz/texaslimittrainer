import { expect, it } from 'vitest';
import { seatSession, type SessionSeat } from '../../src/table/session';

const SEATS: readonly SessionSeat[] = [1, 3, 5, 7, 9].map((seat): SessionSeat =>
  seat === 5
    ? { seat, name: 'You', kind: 'user', style: null }
    : { seat, name: `Bot ${seat}`, kind: 'bot', style: 'TAG' },
);

it('stacks follow the configured seat numbers, not DEFAULT_SEATS', () => {
  const table = seatSession({ seats: SEATS, userSeat: 5, button: 9, players: 5 });
  expect(table.stacks).toEqual([1, 3, 5, 7, 9].map((seat) => ({ seat, stack: 160 })));
});
