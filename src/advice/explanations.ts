import type { PostflopRuleId } from './postflop';
import type { PreflopAdvice } from './preflop';
import type { Position, ReferenceSize, Situation } from './preflop-chart';

// Authored explanation text, written for this project (REQ-061.2). See docs/advice/explanations.md.

export type ConceptId =
  | 'pot-odds'
  | 'equity'
  | 'position'
  | 'hand-strength'
  | 'outs-and-draws'
  | 'implied-odds'
  | 'value-bet'
  | 'bluff'
  | 'opponent-type'
  | 'initiative';

export interface Concept {
  readonly id: ConceptId;
  /** As in REQ-037.2. */
  readonly name: string;
  /** Whole-word, case-insensitive matches that count as naming the concept. */
  readonly terms: readonly string[];
  /** One clause, lower-case start, no sentence punctuation, inserted verbatim by {def:<id>}. */
  readonly definition: string;
}

/** The 10 concepts, in REQ-037.2 order. */
export const CONCEPTS: readonly Concept[] = [
  {
    id: 'pot-odds',
    name: 'pot odds',
    terms: ['pot odds'],
    definition: 'the cost of a call as a share of the pot after you call',
  },
  {
    id: 'equity',
    name: 'equity',
    terms: ['equity'],
    definition: 'your share of the pot if the hand were played out to the end',
  },
  {
    id: 'position',
    name: 'position',
    terms: ['position'],
    definition: 'where you sit relative to the button, which sets how many players act after you',
  },
  {
    id: 'hand-strength',
    name: 'hand strength',
    terms: ['hand strength'],
    definition: 'how well two cards hold up against the hands others play',
  },
  {
    id: 'outs-and-draws',
    name: 'outs and draws',
    terms: ['outs', 'draw'],
    definition: 'the unseen cards that would complete your draw',
  },
  {
    id: 'implied-odds',
    name: 'implied odds',
    terms: ['implied odds'],
    definition: 'the price of a call once you count the bets you expect to win if you hit',
  },
  {
    id: 'value-bet',
    name: 'value bet',
    terms: ['value bet'],
    definition: 'a bet that worse hands will call',
  },
  {
    id: 'bluff',
    name: 'bluff',
    terms: ['bluff'],
    definition: 'a bet meant to make better hands fold',
  },
  {
    id: 'opponent-type',
    name: 'opponent type',
    terms: ['opponent type'],
    definition: 'the playing style an opponent has shown',
  },
  {
    id: 'initiative',
    name: 'initiative',
    terms: ['initiative'],
    definition: 'being the last player to bet or raise',
  },
];

/** Replaces {key} from `values` and {def:<ConceptId>} with that concept's definition.
 *  Throws Error(`Unknown template placeholder {<name>}`) for any other placeholder. */
export function fillTemplate(template: string, values: Readonly<Record<string, string>>): string {
  return template.replace(/\{([^{}]+)\}/g, (_, name: string) => {
    const value = name.startsWith('def:')
      ? CONCEPTS.find((c) => c.id === name.slice(4))?.definition
      : Object.hasOwn(values, name)
        ? values[name]
        : undefined;
    if (value === undefined) throw new Error(`Unknown template placeholder {${name}}`);
    return value;
  });
}

/** Observed hands from which an opponent's range follows their stats; ranges.ts re-exports it. */
export const OBSERVED_MIN_HANDS = 30;
/** Basis of an opponent's range: the default range, or one rebuilt from that opponent's observed stats. */
export const TYPICAL_PLAYER_BASIS = 'typical player';
export const OBSERVED_BASIS = 'based on {hands} hands of this opponent';

/** 'typical player' for null, else 'based on N hands of this opponent'. */
export function basisText(observedHands: number | null): string {
  return observedHands === null
    ? TYPICAL_PLAYER_BASIS
    : fillTemplate(OBSERVED_BASIS, { hands: String(observedHands) });
}
/** Lead clause joined to the first sentence when any range rests on observed stats (keeps REQ-037's 3 sentences). */
export const OPPONENT_TYPE_LEAD =
  'Ranges here follow the opponent type, {def:opponent-type}, of each player you have watched for {minHands} or more hands; ';

export type PostflopTemplateKey = PostflopRuleId | 'pot-odds-fold-implied';

export const POSTFLOP_TEMPLATES: Readonly<Record<PostflopTemplateKey, string>> = {
  'value-bet':
    'Your equity, {def:equity}, is {equity} against all their hands and {callingEquity} against the hands that would call a {aggressive}. Your equity against the hands that would call is above {threshold}, so {aggressiveIng} is a value bet, {def:value-bet}. Checking would be free, with {required} equity required, but {aggressiveIng} wins more.',
  'check-free':
    'Your equity, {def:equity}, is {equity} against all their hands and {callingEquity} against the hands that would call a bet. Your equity against the hands that would call is not above {threshold}, so a bet would not be a value bet, {def:value-bet}. Checking is free, with {required} equity required, so check.',
  'value-raise':
    'Your equity, {def:equity}, is {equity} against all their hands and {callingEquity} against the hands that would call a raise. Your equity against the hands that would call is above {threshold}, so raising is a value bet, {def:value-bet}. Pot odds, {def:pot-odds}{riverBet}, ask only for {required} to call, but raising wins more.',
  'pot-odds-call':
    'Your equity, {def:equity}, is {equity}. Pot odds, {def:pot-odds}{riverBet}, ask for {required}, and you have at least that, so calling earns chips over time.',
  'implied-odds-call':
    'You have a draw with {outs} outs, {def:outs-and-draws}, and your equity, {def:equity}, is {equity}. Pot odds, {def:pot-odds}{riverBet}, ask for {required}, more than you have. Implied odds, {def:implied-odds}, ask only for {impliedRequired}, so calling earns chips over time.',
  'pot-odds-fold':
    'Your equity, {def:equity}, is {equity}. Pot odds, {def:pot-odds}{riverBet}, ask for {required}, more than you have, so folding saves chips over time.',
  'pot-odds-fold-implied':
    'Your equity, {def:equity}, is {equity}. Pot odds, {def:pot-odds}{riverBet}, ask for {required}, more than you have. Even implied odds, {def:implied-odds}, ask for {impliedRequired}, so fold.',
};

/** The Q-3 (TASK-7.32) clause filled into {riverBet} when a turn price counts the river big bet; '' otherwise. */
export const POT_ODDS_RIVER_BET_CLAUSE = ', counting the big bet you will likely face on the river';

export const PREFLOP_CONTEXT: Readonly<Record<Situation, string>> = {
  unopened:
    'No one has entered the pot yet and you sit {seat}, so position, {def:position}, decides how many hands are worth playing.',
  limpers:
    'At least one player has limped in (just called the big blind) and you sit {seat}, so position, {def:position}, decides how many hands are worth playing.',
  raise:
    'A player has raised, so your hand strength, {def:hand-strength}, must be higher than when no one has raised.',
  'raise-and-calls':
    'A player has raised and others have called, so your hand strength, {def:hand-strength}, must hold up against several players at once.',
  're-raise':
    'The pot has been raised more than once, so your hand strength, {def:hand-strength}, must be very high to continue.',
  're-raise-not-mine':
    'The pot has been raised more than once and none of the raises is yours, so your hand strength, {def:hand-strength}, must be very high to continue.',
  'blind-defence':
    'Your blind is already in the pot, which improves your pot odds, {def:pot-odds}, so you can defend with more hands than other seats.',
};

export type PreflopSentenceKey =
  'raise' | 'call' | 'call-capped' | 'fold' | 'check' | 'alternative' | 'borderline';

export const PREFLOP_SENTENCES: Readonly<Record<PreflopSentenceKey, string>> = {
  raise:
    'Raise with {hand}: raising takes the initiative, {def:initiative}, so the others must react to you.',
  call: 'Call with {hand}: it is worth playing at this price but not worth raising.',
  'call-capped': 'Call with {hand}: it is worth a raise, but no more raises are allowed.',
  fold: 'Fold {hand}: it loses too often against the hands that stay in.',
  check: 'Check with {hand}: you see the flop for free.',
  alternative: '{alternativeIng} is also fine, because this hand is close to the line.',
  borderline: 'This hand is close to the line, so another choice is only a minor error.',
};

export const ADVICE_ING: Readonly<Record<PreflopAdvice, string>> = {
  raise: 'Raising',
  call: 'Calling',
  fold: 'Folding',
  check: 'Checking',
};

export const SEAT_NAMES: Readonly<Record<Position, string>> = {
  BTN: 'on the button (BTN)',
  SB: 'in the small blind (SB)',
  BB: 'in the big blind (BB)',
  CO: 'in the cutoff (CO)',
  HJ: 'in the hijack (HJ)',
  LJ: 'in the lojack (LJ)',
  MP: 'in a middle seat (MP)',
  UTG: 'in an early seat (UTG)',
  'UTG+1': 'in an early seat (UTG+1)',
};

/** Chart basis line of a preflop hint (TASK-8.1): which chart, its advice, the hand class and the position. */
export const CHART_BASIS = 'From the {chart} chart: {action} {hand} from {position}';

export const CHART_NAMES: Readonly<Record<ReferenceSize, string>> = {
  'heads-up': 'heads-up',
  '6-max': '6-max',
  'full-ring': 'full-ring',
};

export const CHART_POSITIONS: Readonly<Record<Position, string>> = {
  BTN: 'the button',
  SB: 'the small blind',
  BB: 'the big blind',
  CO: 'the cutoff',
  HJ: 'the hijack',
  LJ: 'the lojack',
  MP: 'a middle seat (MP)',
  UTG: 'an early seat (UTG)',
  'UTG+1': 'an early seat (UTG+1)',
};

/** Short situation labels (TASK-8.5 Q-1), written to follow a position: "from the cutoff, facing a raise". */
export const SITUATION_LABELS: Readonly<Record<Situation, string>> = {
  unopened: 'in an unopened pot',
  limpers: 'facing one or more limpers',
  raise: 'facing a raise',
  'raise-and-calls': 'facing a raise and calls',
  're-raise': 'facing a re-raise',
  're-raise-not-mine': 'facing a re-raise when you have not raised',
  'blind-defence': 'defending the blind against a raise',
};

/** Keyed by RANK_CHARS character: singular and plural names. */
export const RANK_NAMES: Readonly<Record<string, { readonly one: string; readonly many: string }>> =
  {
    '2': { one: 'two', many: 'twos' },
    '3': { one: 'three', many: 'threes' },
    '4': { one: 'four', many: 'fours' },
    '5': { one: 'five', many: 'fives' },
    '6': { one: 'six', many: 'sixes' },
    '7': { one: 'seven', many: 'sevens' },
    '8': { one: 'eight', many: 'eights' },
    '9': { one: 'nine', many: 'nines' },
    T: { one: 'ten', many: 'tens' },
    J: { one: 'jack', many: 'jacks' },
    Q: { one: 'queen', many: 'queens' },
    K: { one: 'king', many: 'kings' },
    A: { one: 'ace', many: 'aces' },
  };
