import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import { formatCard } from '../../src/engine/cards';
import { TableView } from '../../src/ui/table/Table';
import { SEAT_1_DEALT } from '../support/table-scenarios';

const noop = (): void => undefined;

function engineHoleCards(seat: number): string[] {
  const player = SEAT_1_DEALT.hand?.players.find((p) => p.seat === seat);
  if (player === undefined) throw new Error(`No player at seat ${seat}`);
  return player.holeCards.map(formatCard);
}

it("the user's face-up cards are the hole cards of the configured user seat", () => {
  const html = renderToString(<TableView table={SEAT_1_DEALT} onAct={noop} onLeave={noop} />);
  const userItems = [...html.matchAll(/<li([^>]*\sdata-user=""[^>]*)>(.*?)<\/li>/gs)];
  expect(userItems).toHaveLength(1);
  const [, attrs = '', body = ''] = userItems[0] ?? [];
  expect(attrs).toMatch(/\sdata-seat="1"/);

  const group =
    /<div role="group" aria-label="Your cards"[^>]*>(.*?)<\/div>/s.exec(body)?.[1] ?? '';
  const shown = [...group.matchAll(/data-card="([^"]+)"/g)].map(([, code]) => code);
  const seat1 = engineHoleCards(1);
  expect(shown).toEqual(seat1);
  expect(seat1).toHaveLength(2);
  expect(shown).not.toEqual(engineHoleCards(5));
});
