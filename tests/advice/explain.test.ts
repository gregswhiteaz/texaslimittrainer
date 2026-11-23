import { describe, expect, it } from 'vitest';
import {
  basisText,
  explainPostflop,
  explainPreflop,
  fillTemplate,
  formatPct,
  handClassName,
} from '../../src/advice/explain';
import {
  CONCEPTS,
  POSTFLOP_TEMPLATES,
  PREFLOP_CONTEXT,
  PREFLOP_SENTENCES,
  RANK_NAMES,
  SEAT_NAMES,
  type ConceptId,
} from '../../src/advice/explanations';
import type { PostflopRecommendation } from '../../src/advice/postflop';
import type { PreflopRecommendation } from '../../src/advice/preflop';
import type { ChartCell, Position, Situation } from '../../src/advice/preflop-chart';
import { RANK_CHARS } from '../../src/engine/cards';

const EQUITY = 'your share of the pot if the hand were played out to the end';
const POT_ODDS = 'the cost of a call as a share of the pot after you call';
const VALUE_BET = 'a bet that worse hands will call';
const IMPLIED = 'the price of a call once you count the bets you expect to win if you hit';
const POSITION = 'where you sit relative to the button, which sets how many players act after you';
const STRENGTH = 'how well two cards hold up against the hands others play';
const INITIATIVE = 'being the last player to bet or raise';

type PostflopInput = Omit<PostflopRecommendation, 'explanation'>;
type PreflopInput = Omit<PreflopRecommendation, 'explanation'>;

const postflop = (fields: Partial<PostflopInput>): PostflopInput => ({
  basis: 'equity',
  street: 'flop',
  action: 'call',
  alternative: null,
  move: { seat: 3, type: 'fold' },
  ruleId: 'pot-odds-call',
  equityPct: 30,
  requiredEquityPct: 16.7,
  callAmount: 4,
  pot: 20,
  opponents: 1,
  equityMethod: 'sampled',
  equityVsCallingRangePct: 30,
  impliedRequiredEquityPct: null,
  outs: [],
  opponentBasis: [],
  ...fields,
});

const NO_ALT: ChartCell = { action: 'fold', borderline: false, alternative: null };

const preflop = (fields: Partial<PreflopInput>): PreflopInput => ({
  basis: 'chart',
  referenceSize: '6-max',
  position: 'UTG',
  situation: 'unopened',
  handClass: 'AA',
  cell: NO_ALT,
  action: 'fold',
  borderline: false,
  alternative: null,
  move: { seat: 3, type: 'fold' },
  ...fields,
});

const sentencesOf = (text: string) => text.split(/(?<=[.!?])\s+/);
const names = (sentence: string, terms: readonly string[]) =>
  new RegExp('\\b(' + terms.join('|') + ')\\b', 'i').test(sentence);

describe('explanation helpers', () => {
  it('formats percents with one decimal', () => {
    expect(formatPct(16.7)).toBe('16.7%');
    expect(formatPct(0)).toBe('0.0%');
    expect(formatPct(50)).toBe('50.0%');
  });

  it('names hand classes', () => {
    expect(handClassName('AA')).toBe('a pair of aces');
    expect(handClassName('66')).toBe('a pair of sixes');
    expect(handClassName('AKs')).toBe('ace-king suited');
    expect(handClassName('T9o')).toBe('ten-nine offsuit');
    expect(handClassName('72o')).toBe('seven-two offsuit');
  });

  it('fills values and definitions, and rejects unknown placeholders', () => {
    expect(fillTemplate('{a} is {def:bluff}', { a: 'X' })).toBe(
      'X is a bet meant to make better hands fold',
    );
    expect(() => fillTemplate('{nope}', {})).toThrow(
      new Error('Unknown template placeholder {nope}'),
    );
    expect(() => fillTemplate('{def:nope}', {})).toThrow(
      new Error('Unknown template placeholder {def:nope}'),
    );
    expect(() => fillTemplate('{toString}', {})).toThrow(
      new Error('Unknown template placeholder {toString}'),
    );
  });
});

describe('opponent basis and the opponent-type lead', () => {
  const OPPONENT_TYPE = 'the playing style an opponent has shown';
  const observed = { seat: 4, observedHands: 40, text: 'based on 40 hands of this opponent' };
  const typical = { seat: 5, observedHands: null, text: 'typical player' };

  it('words the basis', () => {
    expect(basisText(null)).toBe('typical player');
    expect(basisText(40)).toBe('based on 40 hands of this opponent');
  });

  it('adds the lead clause when any range rests on observed stats', () => {
    const plain = explainPostflop(postflop({ opponentBasis: [typical] }), 50);
    expect(explainPostflop(postflop({}), 50)).toBe(plain);
    expect(plain).not.toMatch(/opponent type/);
    const led = explainPostflop(postflop({ opponentBasis: [observed, typical] }), 50);
    expect(led).toBe(
      `Ranges here follow the opponent type, ${OPPONENT_TYPE}, of each player you have watched for 30 or more hands; ` +
        plain.charAt(0).toLowerCase() +
        plain.slice(1),
    );
    expect(sentencesOf(led)).toHaveLength(sentencesOf(plain).length);
  });
});

describe('explanation copy', () => {
  it('postflop: the worked examples', () => {
    expect(
      explainPostflop(
        postflop({
          ruleId: 'implied-odds-call',
          equityPct: 20.5,
          requiredEquityPct: 22.2,
          impliedRequiredEquityPct: 18.2,
          outs: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        }),
        50,
      ),
    ).toBe(
      'You have a draw with 9 outs, the unseen cards that would complete your draw, and your equity, your share of the pot if the hand were played out to the end, is 20.5%. Pot odds, the cost of a call as a share of the pot after you call, ask for 22.2%, more than you have. Implied odds, the price of a call once you count the bets you expect to win if you hit, ask only for 18.2%, so calling earns chips over time.',
    );
    expect(
      explainPostflop(
        postflop({
          ruleId: 'value-bet',
          action: 'bet',
          equityPct: 78.9,
          equityVsCallingRangePct: 72.8,
          requiredEquityPct: 0,
        }),
        50,
      ),
    ).toBe(
      'Your equity, your share of the pot if the hand were played out to the end, is 78.9% against all their hands and 72.8% against the hands that would call a bet. That is above 50.0%, so betting is a value bet, a bet that worse hands will call. Checking would be free, with 0.0% equity required, but betting wins more.',
    );
  });

  it('postflop: value-bet made as a raise', () => {
    expect(
      explainPostflop(
        postflop({
          ruleId: 'value-bet',
          action: 'raise',
          equityPct: 60,
          equityVsCallingRangePct: 55.5,
          requiredEquityPct: 0,
        }),
        50,
      ),
    ).toBe(
      `Your equity, ${EQUITY}, is 60.0% against all their hands and 55.5% against the hands that would call a raise. That is above 50.0%, so raising is a value bet, ${VALUE_BET}. Checking would be free, with 0.0% equity required, but raising wins more.`,
    );
  });

  it('postflop: check-free, value-raise, pot-odds-call', () => {
    expect(
      explainPostflop(
        postflop({
          ruleId: 'check-free',
          action: 'check',
          equityPct: 40.1,
          equityVsCallingRangePct: 33.3,
          requiredEquityPct: 0,
        }),
        50,
      ),
    ).toBe(
      `Your equity, ${EQUITY}, is 40.1% against all their hands and 33.3% against the hands that would call a bet. That is not above 50.0%, so a bet would not be a value bet, ${VALUE_BET}. Checking is free, with 0.0% equity required, so check.`,
    );
    expect(
      explainPostflop(
        postflop({
          ruleId: 'value-raise',
          action: 'raise',
          equityPct: 70,
          equityVsCallingRangePct: 61.2,
          requiredEquityPct: 16.7,
        }),
        50,
      ),
    ).toBe(
      `Your equity, ${EQUITY}, is 70.0% against all their hands and 61.2% against the hands that would call a raise. That is above 50.0%, so raising is a value bet, ${VALUE_BET}. Pot odds, ${POT_ODDS}, ask only for 16.7% to call, but raising wins more.`,
    );
    expect(explainPostflop(postflop({}), 50)).toBe(
      `Your equity, ${EQUITY}, is 30.0%. Pot odds, ${POT_ODDS}, ask for 16.7%, and you have at least that, so calling earns chips over time.`,
    );
  });

  it('postflop: pot-odds-fold with and without an implied price', () => {
    const fold = { ruleId: 'pot-odds-fold', action: 'fold', equityPct: 5 } as const;
    expect(explainPostflop(postflop({ ...fold, requiredEquityPct: 25 }), 50)).toBe(
      `Your equity, ${EQUITY}, is 5.0%. Pot odds, ${POT_ODDS}, ask for 25.0%, more than you have, so folding saves chips over time.`,
    );
    expect(
      explainPostflop(
        postflop({
          ...fold,
          requiredEquityPct: 25,
          impliedRequiredEquityPct: 12.5,
          outs: [0, 1, 2, 3, 4, 5, 6, 7],
        }),
        50,
      ),
    ).toBe(
      `Your equity, ${EQUITY}, is 5.0%. Pot odds, ${POT_ODDS}, ask for 25.0%, more than you have. Even implied odds, ${IMPLIED}, ask for 12.5%, so fold.`,
    );
  });

  it('preflop: the worked example', () => {
    expect(
      explainPreflop(
        preflop({
          action: 'raise',
          cell: { action: 'raise', borderline: false, alternative: null },
        }),
      ),
    ).toBe(
      'No one has entered the pot yet and you sit in an early seat (UTG), so position, where you sit relative to the button, which sets how many players act after you, decides how many hands are worth playing. Raise with a pair of aces: raising takes the initiative, being the last player to bet or raise, so the others must react to you.',
    );
  });

  it('preflop: one context sentence per situation', () => {
    const fold = 'Fold seven-two offsuit: it loses too often against the hands that stay in.';
    const cases: [Situation, Position, string][] = [
      [
        'unopened',
        'CO',
        `No one has entered the pot yet and you sit in the cutoff (CO), so position, ${POSITION}, decides how many hands are worth playing.`,
      ],
      [
        'limpers',
        'BTN',
        `At least one player has limped in (just called the big blind) and you sit on the button (BTN), so position, ${POSITION}, decides how many hands are worth playing.`,
      ],
      [
        'raise',
        'HJ',
        `A player has raised, so your hand strength, ${STRENGTH}, must be higher than when no one has raised.`,
      ],
      [
        'raise-and-calls',
        'MP',
        `A player has raised and others have called, so your hand strength, ${STRENGTH}, must hold up against several players at once.`,
      ],
      [
        're-raise',
        'LJ',
        `The pot has been raised more than once, so your hand strength, ${STRENGTH}, must be very high to continue.`,
      ],
      [
        'blind-defence',
        'BB',
        `Your blind is already in the pot, which improves your pot odds, ${POT_ODDS}, so you can defend with more hands than other seats.`,
      ],
    ];
    for (const [situation, position, context] of cases) {
      expect(explainPreflop(preflop({ situation, position, handClass: '72o' }))).toBe(
        `${context} ${fold}`,
      );
    }
  });

  it('preflop: action, capped call, alternative and borderline sentences', () => {
    const context = `No one has entered the pot yet and you sit in the small blind (SB), so position, ${POSITION}, decides how many hands are worth playing.`;
    const sb = (fields: Partial<PreflopInput>) =>
      explainPreflop(preflop({ position: 'SB', handClass: 'AKs', ...fields }));
    const raiseCell: ChartCell = { action: 'raise', borderline: false, alternative: null };
    expect(sb({ action: 'raise', cell: raiseCell })).toBe(
      `${context} Raise with ace-king suited: raising takes the initiative, ${INITIATIVE}, so the others must react to you.`,
    );
    expect(sb({ action: 'call', cell: { ...raiseCell, action: 'call' } })).toBe(
      `${context} Call with ace-king suited: it is worth playing at this price but not worth raising.`,
    );
    expect(sb({ action: 'call', cell: raiseCell })).toBe(
      `${context} Call with ace-king suited: it is worth a raise, but no more raises are allowed.`,
    );
    expect(sb({ action: 'fold' })).toBe(
      `${context} Fold ace-king suited: it loses too often against the hands that stay in.`,
    );
    expect(sb({ action: 'check' })).toBe(
      `${context} Check with ace-king suited: you see the flop for free.`,
    );
    const alternatives = [
      ['raise', 'Raising'],
      ['call', 'Calling'],
      ['fold', 'Folding'],
      ['check', 'Checking'],
    ] as const;
    for (const [alternative, ing] of alternatives) {
      expect(sb({ action: 'fold', borderline: true, alternative })).toBe(
        `${context} Fold ace-king suited: it loses too often against the hands that stay in. ${ing} is also fine, because this hand is close to the line.`,
      );
    }
    const borderline = sb({ action: 'fold', borderline: true });
    expect(borderline).toBe(
      `${context} Fold ace-king suited: it loses too often against the hands that stay in. This hand is close to the line, so another choice is only a minor error.`,
    );
    expect(sentencesOf(borderline)).toHaveLength(3);
    expect(sentencesOf(sb({ action: 'fold' }))).toHaveLength(2);
  });
});

describe('authored explanation data', () => {
  it('has 10 unique concepts with one-clause definitions that name no other concept', () => {
    expect(CONCEPTS.map((c) => c.name)).toEqual([
      'pot odds',
      'equity',
      'position',
      'hand strength',
      'outs and draws',
      'implied odds',
      'value bet',
      'bluff',
      'opponent type',
      'initiative',
    ]);
    expect(new Set(CONCEPTS.map((c) => c.id)).size).toBe(10);
    for (const concept of CONCEPTS) {
      expect(concept.definition).toMatch(/^[a-z]/);
      expect(concept.definition).not.toMatch(/[.!?]/);
      for (const other of CONCEPTS) {
        if (other !== concept) expect(names(concept.definition, other.terms)).toBe(false);
      }
    }
  });

  it('names every seat and rank', () => {
    const positions: Position[] = ['UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
    expect(Object.keys(SEAT_NAMES).sort()).toEqual([...positions].sort());
    expect(Object.keys(RANK_NAMES).sort()).toEqual([...RANK_CHARS].sort());
  });

  it('every template fills with known placeholders and defines each concept where first named', () => {
    const values = {
      equity: '30.0%',
      required: '16.7%',
      callingEquity: '25.0%',
      impliedRequired: '10.0%',
      threshold: '50.0%',
      outs: '9',
      aggressive: 'bet',
      aggressiveIng: 'betting',
      seat: SEAT_NAMES.UTG,
      hand: handClassName('AKs'),
      alternativeIng: 'Raising',
    };
    const templates = [
      ...Object.values(POSTFLOP_TEMPLATES),
      ...Object.values(PREFLOP_CONTEXT),
      ...Object.values(PREFLOP_SENTENCES),
      ...Object.values(SEAT_NAMES),
      ...Object.values(RANK_NAMES).flatMap((n) => [n.one, n.many]),
    ];
    const ids = new Set<string>(CONCEPTS.map((c) => c.id));
    for (const template of templates) {
      for (const [, name] of template.matchAll(/\{([^{}]+)\}/g)) {
        if (name?.startsWith('def:')) expect(ids.has(name.slice(4) as ConceptId)).toBe(true);
        else expect(Object.keys(values)).toContain(name);
      }
      const text = fillTemplate(template, values);
      for (const concept of CONCEPTS) {
        const first = sentencesOf(text).find((s) => names(s, concept.terms));
        if (first !== undefined) expect(first).toContain(concept.definition);
      }
    }
  });
});
