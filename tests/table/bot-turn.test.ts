import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { decideTag } from '../../src/bots/tag';
import { formatCard, type Card } from '../../src/engine/cards';
import { replayCodeFromWords } from '../../src/engine/deck';
import { applyAction, type Action, type HandState } from '../../src/engine/hand';
import { playerView } from '../../src/engine/player-view';
import { AdviceClient, type WorkerLike } from '../../src/ui/advice/advice-client';
import {
  applyBotDecision,
  applyUserAction,
  botTurn,
  dealHand,
  nextStep,
  seatSession,
  stepBot,
  userActions,
  type TableState,
} from '../../src/table/session';

const CODE = replayCodeFromWords([0x9e3779b9, 1, 2, 3]);

/** JSON with every card written as text ("Ah"), so a card can't match part of a number. */
function cardJson(payload: unknown): string {
  return JSON.stringify(payload, (key, value: unknown) =>
    (key === 'holeCards' || key === 'board') && Array.isArray(value)
      ? value.map((card) => formatCard(card as Card))
      : value,
  );
}

/** `hand` with every card the acting seat can't see relabelled by `hidden` (a permutation of those cards). */
function relabelHidden(
  hand: HandState,
  visible: ReadonlySet<Card>,
  hidden: readonly Card[],
): HandState {
  const unseen = hand.deck.filter((card) => !visible.has(card));
  const map = new Map(unseen.map((card, i) => [card, hidden[i] as Card]));
  const swap = (card: Card): Card => map.get(card) ?? card;
  return {
    ...hand,
    deck: hand.deck.map(swap),
    players: hand.players.map((p) => ({
      ...p,
      holeCards: [swap(p.holeCards[0]), swap(p.holeCards[1])] as const,
    })),
  };
}

function toUserTurn(table: TableState): TableState {
  let t = table;
  while (nextStep(t) === 'bot') t = stepBot(t);
  return t;
}

describe('bot turn', () => {
  it("the bot request carries only the acting seat's view and style", () => {
    const table = dealHand(seatSession(), CODE);
    const hand = table.hand as HandState;
    expect(nextStep(table)).toBe('bot');
    const turn = botTurn(table);
    const seat = hand.toAct as number;
    expect(turn.view).toEqual(playerView(hand, seat));
    expect(turn.style).toBe('TAG');

    const payload = { view: turn.view, style: turn.style };
    const json = cardJson(payload);
    const others = hand.players.filter((p) => p.seat !== seat).flatMap((p) => p.holeCards);
    expect(others).toHaveLength(10);
    for (const card of others) expect(json).not.toContain(`"${formatCard(card)}"`);
    for (const card of turn.view.holeCards) expect(json).toContain(`"${formatCard(card)}"`);

    const visible = new Set<Card>([...turn.view.holeCards, ...turn.view.board]);
    const unseen = hand.deck.filter((card) => !visible.has(card));
    const action = decideTag(turn.view);
    fc.assert(
      fc.property(
        fc.shuffledSubarray(unseen, { minLength: unseen.length, maxLength: unseen.length }),
        (hidden) => {
          const permuted = { ...table, hand: relabelHidden(hand, visible, hidden) };
          const other = botTurn(permuted);
          expect({ view: other.view, style: other.style }).toEqual(payload);
          expect(decideTag(other.view)).toEqual(action);
        },
      ),
      { numRuns: 100, seed: 3606 },
    );

    const posted: unknown[] = [];
    const worker: WorkerLike = {
      postMessage: (message: unknown) => posted.push(message),
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      terminate: () => undefined,
    };
    void new AdviceClient(worker).decideBot(turn.view, turn.style);
    expect(posted).toHaveLength(1);
    expect(Object.keys(posted[0] as object).sort()).toEqual(['id', 'kind', 'style', 'view']);
    expect(posted[0]).toEqual({ id: 1, kind: 'bot', view: turn.view, style: 'TAG' });
  });

  it('applyBotDecision applies only to the turn it was asked for', () => {
    const table = dealHand(seatSession(), CODE);
    const turn = botTurn(table);
    const action = decideTag(turn.view);

    const table2 = stepBot(table);
    expect(applyBotDecision(table2, turn, action)).toBe(table2);
    expect(applyBotDecision(table, turn, action)).toEqual(stepBot(table));

    const illegal: Action = { seat: turn.view.seat, type: 'bet', amount: 999 };
    const rejected = applyAction(turn.hand, illegal);
    if (rejected.ok) throw new Error('expected the engine to reject the action');
    expect(() => applyBotDecision(table, turn, illegal)).toThrow(
      new RangeError(rejected.error.message),
    );

    const userTurn = toUserTurn(table);
    expect(() => botTurn(userTurn)).toThrow(new RangeError('Not a bot turn'));
    expect(() => botTurn(seatSession())).toThrow(new RangeError('Not a bot turn'));

    // Later streets too: the split steps reproduce stepBot for every bot action of a played hand.
    let t = table;
    while (nextStep(t) !== 'done') {
      if (nextStep(t) === 'bot') {
        const next = botTurn(t);
        const applied = applyBotDecision(t, next, decideTag(next.view));
        expect(applied).toEqual(stepBot(t));
        t = applied;
      } else {
        const options = userActions(t);
        t = applyUserAction(
          t,
          (options.find((a) => a.type === 'check') ??
            options.find((a) => a.type === 'call')) as Action,
        );
      }
    }
  });
});
