import { describe, expect, it } from 'vitest';
import { decideTag } from '../../src/bots/tag';
import { replayCodeFromWords, type ReplayCode } from '../../src/engine/deck';
import { legalActions, type Action, type HandState } from '../../src/engine/hand';
import { playerView, showdownOf } from '../../src/engine/player-view';
import {
  USER_SEAT,
  applyUserAction,
  buyIn,
  completedHand,
  dealHand,
  nextStep,
  seatSession,
  stakesFor,
  stepBot,
  userActions,
  type TableState,
} from '../../src/table/session';

const CODES: ReplayCode[] = Array.from({ length: 50 }, (_, i) => replayCodeFromWords([i, 1, 2, 3]));

type UserChoice = (table: TableState, decisionIndex: number) => Action;

function checkOrCall(table: TableState): Action {
  const actions = userActions(table);
  const pick = actions.find((a) => a.type === 'check') ?? actions.find((a) => a.type === 'call');
  if (pick === undefined) throw new Error('No check or call offered');
  return pick;
}

const foldFirst: UserChoice = (table, index) => {
  if (index > 0) throw new Error('The user was asked to act again after folding');
  const fold = userActions(table).find((a) => a.type === 'fold');
  if (fold === undefined) throw new Error('No fold offered');
  return fold;
};

interface Played {
  table: TableState;
  steps: ('deal' | 'bot' | 'user')[];
  botSteps: { before: HandState; after: HandState }[];
}

function play(code: ReplayCode, choose: UserChoice): Played {
  let table = seatSession();
  const steps: Played['steps'] = [];
  const botSteps: Played['botSteps'] = [];
  let decisions = 0;
  for (let guard = 0; guard < 500; guard++) {
    const step = nextStep(table);
    if (step === 'done') return { table, steps, botSteps };
    steps.push(step);
    if (step === 'deal') {
      table = dealHand(table, code);
    } else if (step === 'bot') {
      const before = table.hand as HandState;
      table = stepBot(table);
      botSteps.push({ before, after: table.hand as HandState });
    } else {
      table = applyUserAction(table, choose(table, decisions++));
    }
  }
  throw new Error('Hand did not finish');
}

function userPlayer(hand: HandState) {
  const user = hand.players.find((p) => p.seat === USER_SEAT);
  if (user === undefined) throw new Error('User not dealt in');
  return user;
}

function seatedAtUserTurn(): TableState {
  let table = dealHand(seatSession(), CODES[0] as ReplayCode);
  while (nextStep(table) === 'bot') table = stepBot(table);
  return table;
}

describe('table session acceptance', () => {
  it('default session seats the user and five TAG bots at $4/$8 with $160 each', () => {
    const table = seatSession();
    expect(table.stakes).toEqual({ smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 });
    expect(table.seats.map((s) => [s.seat, s.name, s.kind, s.style])).toEqual([
      [1, 'Ava', 'bot', 'TAG'],
      [2, 'Ben', 'bot', 'TAG'],
      [3, 'Cal', 'bot', 'TAG'],
      [4, 'Dee', 'bot', 'TAG'],
      [5, 'You', 'user', null],
      [6, 'Eli', 'bot', 'TAG'],
    ]);
    expect(table.stacks).toEqual([1, 2, 3, 4, 5, 6].map((seat) => ({ seat, stack: 160 })));
    expect(table.hand).toBeNull();
    expect(nextStep(table)).toBe('deal');

    const dealt = dealHand(table, CODES[0] as ReplayCode);
    const hand = dealt.hand as HandState;
    expect(hand.players.map((p) => p.startingStack)).toEqual([160, 160, 160, 160, 160, 160]);
    expect(hand.button).toBe(6);
  });

  it('buy-in is 20 big bets of the configured stake', () => {
    const table = seatSession({ stake: { smallBet: 10, bigBet: 20 } });
    expect(table.stacks.map((s) => s.stack)).toEqual([400, 400, 400, 400, 400, 400]);
    expect(table.stakes).toEqual({ smallBlind: 5, bigBlind: 10, smallBet: 10, bigBet: 20 });
    const hand = dealHand(table, CODES[1] as ReplayCode).hand as HandState;
    expect(hand.players.map((p) => p.startingStack)).toEqual([400, 400, 400, 400, 400, 400]);
    expect(hand.stakes).toEqual({ smallBlind: 5, bigBlind: 10, smallBet: 10, bigBet: 20 });

    const req006 = [
      { stake: { smallBet: 2, bigBet: 4 }, blinds: [1, 2], buyIn: 80 },
      { stake: { smallBet: 4, bigBet: 8 }, blinds: [2, 4], buyIn: 160 },
      { stake: { smallBet: 10, bigBet: 20 }, blinds: [5, 10], buyIn: 400 },
      { stake: { smallBet: 20, bigBet: 40 }, blinds: [10, 20], buyIn: 800 },
    ];
    for (const row of req006) {
      expect(buyIn(row.stake)).toBe(row.buyIn);
      expect(buyIn(row.stake)).toBe(20 * row.stake.bigBet);
      const stakes = stakesFor(row.stake);
      expect([stakes.smallBlind, stakes.bigBlind]).toEqual(row.blinds);
      expect([stakes.smallBet, stakes.bigBet]).toEqual([row.stake.smallBet, row.stake.bigBet]);
    }
  });

  it('check or call at every decision plays to showdown', () => {
    for (const code of CODES) {
      const { table, steps } = play(code, checkOrCall);
      const hand = table.hand as HandState;
      expect(hand.result?.endedBy, code).toBe('showdown');
      expect(hand.board).toHaveLength(5);
      const streets = new Set(table.userDecisions.map((d) => d.view.street));
      expect([...streets].sort(), code).toEqual(['flop', 'preflop', 'river', 'turn']);
      expect(steps[0]).toBe('deal');
      expect(completedHand(table)?.userHoleCards).toEqual([...userPlayer(hand).holeCards]);
    }
  });

  it('after a preflop fold the bots finish the hand without the user', () => {
    for (const code of CODES) {
      const { table, steps } = play(code, foldFirst);
      const dealt = dealHand(seatSession(), code).hand as HandState;
      const hand = table.hand as HandState;
      expect(nextStep(table)).toBe('done');
      expect(steps.filter((s) => s === 'user')).toHaveLength(1);
      const afterFold = steps.slice(steps.indexOf('user') + 1);
      expect(afterFold.every((s) => s === 'bot')).toBe(true);
      expect(userPlayer(hand).folded).toBe(true);
      expect(table.userDecisions).toHaveLength(1);
      expect(table.userDecisions[0]?.action.type).toBe('fold');
      expect(table.userDecisions[0]?.view.street).toBe('preflop');
      expect(userPlayer(hand).holeCards).toEqual(userPlayer(dealt).holeCards);
      expect(completedHand(table)?.userHoleCards).toEqual([...userPlayer(dealt).holeCards]);
    }
  });

  it("bots never act during the user's turn", () => {
    const table = seatedAtUserTurn();
    expect(nextStep(table)).toBe('user');
    const snapshot = structuredClone(table);
    expect(() => stepBot(table)).toThrow(new RangeError('Not a bot turn'));
    expect(table).toEqual(snapshot);
    expect(nextStep(table)).toBe('user');
    expect(nextStep(table)).toBe('user');
    expect(userActions(table)).toEqual(legalActions(table.hand as HandState));

    const botTurn = dealHand(seatSession(), CODES[0] as ReplayCode);
    expect(nextStep(botTurn)).toBe('bot');
    const fold: Action = { seat: USER_SEAT, type: 'fold' };
    expect(() => applyUserAction(botTurn, fold)).toThrow(new RangeError("Not the user's turn"));
  });

  it('every bot action is the TAG decision on its own view', () => {
    for (const code of CODES) {
      const { botSteps } = play(code, checkOrCall);
      expect(botSteps.length).toBeGreaterThan(0);
      for (const { before, after } of botSteps) {
        const seat = before.toAct as number;
        expect(seat).not.toBe(USER_SEAT);
        const expected = decideTag(playerView(before, seat));
        const record = after.actions[after.actions.length - 1];
        expect(after.actions).toHaveLength(before.actions.length + 1);
        expect(record?.seat).toBe(seat);
        expect(record?.type).toBe(expected.type);
        expect(record?.amount).toBe('amount' in expected ? expected.amount : 0);
      }
    }
  });

  it('the completed hand is a plain-data record', () => {
    const cases = [
      play(CODES[2] as ReplayCode, checkOrCall).table,
      play(CODES[3] as ReplayCode, foldFirst).table,
    ];
    for (const [index, table] of cases.entries()) {
      const hand = table.hand as HandState;
      const record = completedHand(table);
      if (record === null) throw new Error('No record');
      expect(record.replayCode).toBe(index === 0 ? CODES[2] : CODES[3]);
      expect(record.stakes).toEqual({ smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 });
      expect(record.button).toBe(6);
      expect(record.seats).toEqual([
        { seat: 1, name: 'Ava', kind: 'bot', style: 'TAG', startingStack: 160 },
        { seat: 2, name: 'Ben', kind: 'bot', style: 'TAG', startingStack: 160 },
        { seat: 3, name: 'Cal', kind: 'bot', style: 'TAG', startingStack: 160 },
        { seat: 4, name: 'Dee', kind: 'bot', style: 'TAG', startingStack: 160 },
        { seat: 5, name: 'You', kind: 'user', style: null, startingStack: 160 },
        { seat: 6, name: 'Eli', kind: 'bot', style: 'TAG', startingStack: 160 },
      ]);
      expect(record.userSeat).toBe(5);
      expect(record.userHoleCards).toEqual([...userPlayer(hand).holeCards]);
      expect(record.actions).toEqual(hand.actions);
      expect(record.board).toEqual(hand.board);
      expect(record.shown).toEqual(showdownOf(hand));
      expect(record.result).toEqual(hand.result);
      expect(JSON.parse(JSON.stringify(record))).toEqual(record);
    }
    expect(cases[0] && completedHand(cases[0])?.shown).not.toBeNull();
    expect(cases[1] && completedHand(cases[1])?.shown).toBeNull();

    // userDecisions: each view equals playerView at the moment of the decision.
    let table = seatSession();
    const views = [];
    while (nextStep(table) !== 'done') {
      expect(completedHand(table)).toBeNull();
      const step = nextStep(table);
      if (step === 'deal') table = dealHand(table, CODES[2] as ReplayCode);
      else if (step === 'bot') table = stepBot(table);
      else {
        views.push(playerView(table.hand as HandState, USER_SEAT));
        table = applyUserAction(table, checkOrCall(table));
      }
    }
    const decisions = completedHand(table)?.userDecisions ?? [];
    expect(decisions.map((d) => d.view)).toEqual(views);
    expect(decisions).toHaveLength(views.length);
  });
});
