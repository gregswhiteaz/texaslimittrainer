import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseCard, type Card } from '../../src/engine/cards';
import { applyAction, createHand, type Action, type HandState } from '../../src/engine/hand';
import { describeAction } from '../../src/engine/invariants';
import { formatHand, formatReport, main, parseArgs, USAGE } from '../../src/playtest/cli';
import {
  PLAYTEST_STAKES,
  replayHand,
  toAction,
  type PlayedHand,
  type PlaytestSummary,
  type PlaytestSeams,
  type PolicyFactory,
  type ViolatingHand,
} from '../../src/playtest/runner';

function capture(argv: string[], seams?: PlaytestSeams) {
  let out = '';
  let err = '';
  const code = main(argv, { out: (t) => (out += t), err: (t) => (err += t) }, seams);
  return { code, out, err };
}

const VALID_CODE = '000000000000002a0000000000000004';

const ERROR_CASES: [string[], string][] = [
  [['--hands', '0'], 'Error: --hands must be a whole number from 1 to 1000000000.'],
  [['--hands', '1e3'], 'Error: --hands must be a whole number from 1 to 1000000000.'],
  [['--hands', '1000000001'], 'Error: --hands must be a whole number from 1 to 1000000000.'],
  [['--seed', '-1'], 'Error: --seed must be a whole number from 0 to 9007199254740991.'],
  [
    ['--seed', '9007199254740992'],
    'Error: --seed must be a whole number from 0 to 9007199254740991.',
  ],
  [['--size', '1'], 'Error: --size must be a whole number from 2 to 10.'],
  [['--size', '11'], 'Error: --size must be a whole number from 2 to 10.'],
  [
    ['--replay-code', VALID_CODE, '--size', '1'],
    'Error: --size must be a whole number from 2 to 10.',
  ],
  [['--bogus'], 'Error: unknown option.'],
  [['--hands=5'], 'Error: unknown option.'],
  [['--hands', '5', '--hands', '6'], 'Error: --hands given more than once.'],
  [['--help', '--help'], 'Error: --help given more than once.'],
  [['--button', '2'], 'Error: --button is only valid with --replay-code.'],
  [
    ['--replay-code', VALID_CODE, '--seed', '1'],
    'Error: --replay-code cannot be combined with --hands or --seed.',
  ],
  [
    ['--replay-code', VALID_CODE, '--size', '4', '--button', '5'],
    'Error: --button must be a seat number from 1 to the table size.',
  ],
  [['--help', '--hands', '5'], 'Error: --help cannot be combined with other options.'],
  [['--hands'], 'Error: --hands needs a value.'],
  [['--seed', '--size', '4'], 'Error: --seed needs a value.'],
];

describe('playtest CLI', () => {
  it('rejects every invalid argument with its fixed message', () => {
    for (const [argv, message] of ERROR_CASES) {
      expect(parseArgs(argv)).toEqual({ kind: 'error', message });
      const result = capture(argv);
      expect(result).toEqual({ code: 2, out: '', err: `${message}\n${USAGE}` });
    }

    expect(capture(['--help'])).toEqual({ code: 0, out: USAGE, err: '' });
    expect(USAGE).toBe(
      'Usage: npm run playtest -- [--hands <1-1000000000>] [--seed <0-9007199254740991>] [--size <2-10>]\n' +
        '       npm run playtest -- --replay-code <32 lowercase hex characters> [--size <2-10>] [--button <seat>]\n' +
        'Defaults: --hands 10000 --seed 42 --size 6 --button 1\n',
    );
    expect(parseArgs([])).toEqual({ kind: 'run', options: { hands: 10000, seed: 42, size: 6 } });
    expect(parseArgs(['--replay-code', VALID_CODE])).toEqual({
      kind: 'replay',
      replayCode: VALID_CODE,
      size: 6,
      button: 1,
    });
    expect(capture([])).toEqual(capture(['--hands', '10000', '--seed', '42', '--size', '6']));
    expect(capture(['--hands', '007', '--seed', '0042']).out).toContain(
      'Options: --hands 7 --seed 42 --size 6\n',
    );

    const largest = capture(['--hands', '1', '--seed', '9007199254740991']);
    expect(largest.code).toBe(0);
    expect(largest.out).toContain('Options: --hands 1 --seed 9007199254740991 --size 6\n');
    expect(largest.out).toContain('First replay code: 001fffffffffffff0000000000000001\n');
    expect(largest.out).toContain('Last replay code: 001fffffffffffff0000000000000001\n');
  });

  it('parseArgs accepts --size 2 and rejects sizes outside 2 to 10', () => {
    expect(parseArgs(['--size', '2'])).toEqual({
      kind: 'run',
      options: { hands: 10000, seed: 42, size: 2 },
    });
    expect(parseArgs(['--replay-code', VALID_CODE, '--size', '2', '--button', '2'])).toEqual({
      kind: 'replay',
      replayCode: VALID_CODE,
      size: 2,
      button: 2,
    });
    expect(parseArgs(['--replay-code', VALID_CODE, '--size', '2', '--button', '3'])).toEqual({
      kind: 'error',
      message: 'Error: --button must be a seat number from 1 to the table size.',
    });
    const sizeError = {
      kind: 'error',
      message: 'Error: --size must be a whole number from 2 to 10.',
    };
    for (const argv of [
      ['--size', '0'],
      ['--size', '1'],
      ['--size', '11'],
      ['--replay-code', VALID_CODE, '--size', '1'],
    ]) {
      expect(parseArgs(argv)).toEqual(sizeError);
    }
    const usageLines = USAGE.split('\n');
    expect(usageLines[0]).toContain('[--size <2-10>]');
    expect(usageLines[1]).toContain('[--size <2-10>]');
  });

  it('returns exit code 1 when the run has violations', () => {
    const rejected: PolicyFactory = () => (view) => ({ seat: view.seat, type: 'check' });
    const run = capture(['--hands', '2', '--seed', '1', '--size', '3'], {
      makePolicy: () => (view) => ({ seat: view.seat, type: 'raise', amount: 999 }),
    });
    expect(run.code).toBe(1);
    expect(run.out).toContain('Invariant violations: 2\n');

    // The first seat to act owes the big blind, so the engine rejects a check.
    const replay = capture(['--replay-code', VALID_CODE, '--size', '3', '--button', '3'], {
      makePolicy: rejected,
    });
    expect(replay.code).toBe(1);
    expect(replay.out).toContain('Result: abandoned (invariant violation)\n');
    expect(replay.out).toContain('Invariant violations: 1\n');
  });

  it('formats the report and a hand exactly', () => {
    const summary: PlaytestSummary = {
      handsPlayed: 10000,
      foldOuts: 7000,
      showdowns: 3000,
      playerActions: 160000,
      cappedStreets: 7700,
      largestPot: 404,
      firstReplayCode: '000000000000002a0000000000000001',
      lastReplayCode: '000000000000002a0000000000002710',
      violations: 0,
      violationCounts: {
        chips: 0,
        'legal-action': 0,
        'bet-cap': 0,
        'pot-eligibility': 0,
        cards: 0,
      },
      firstViolation: null,
    };
    expect(formatReport('Header\n', summary)).toBe(
      'Header\n' +
        'Hands played: 10000\n' +
        'Ended by fold: 7000\n' +
        'Ended at showdown: 3000\n' +
        'Player actions: 160000\n' +
        'Streets capped at 4 bets: 7700\n' +
        'Largest pot: $404\n' +
        'First replay code: 000000000000002a0000000000000001\n' +
        'Last replay code: 000000000000002a0000000000002710\n' +
        'Invariant violations: 0\n',
    );

    const split = scripted([
      { seat: 6, type: 'fold' },
      { seat: 1, type: 'fold' },
      { seat: 2, type: 'call', amount: 4 },
      { seat: 3, type: 'raise', amount: 8 },
      { seat: 4, type: 'fold' },
      { seat: 5, type: 'call', amount: 4 },
      { seat: 2, type: 'call', amount: 4 },
      { seat: 5, type: 'bet', amount: 4 },
      { seat: 2, type: 'call', amount: 4 },
      { seat: 3, type: 'fold' },
      { seat: 5, type: 'check' },
      { seat: 2, type: 'check' },
      { seat: 5, type: 'check' },
      { seat: 2, type: 'check' },
    ]);
    expect(formatHand(split)).toBe(
      'Hand 7: replay code 000000000000002a0000000000000007, button seat 3\n' +
        'Seat 1 ($160): 2s 4d\n' +
        'Seat 2 ($160): 3c 4h\n' +
        'Seat 3 ($160): 3d 4s\n' +
        'Seat 4 ($160): 2c 3h\n' +
        'Seat 5 ($160): 2d 3s\n' +
        'Seat 6 ($160): 2h 4c\n' +
        'Board: Ts Js Qs Ks As\n' +
        'Preflop: seat 4 posts small blind $2, seat 5 posts big blind $4, seat 6 folds, seat 1 folds, ' +
        'seat 2 calls $4, seat 3 raises to $8, seat 4 folds, seat 5 calls $4, seat 2 calls $4\n' +
        'Flop: seat 5 bets $4, seat 2 calls $4, seat 3 folds\n' +
        'Turn: seat 5 checks, seat 2 checks\n' +
        'River: seat 5 checks, seat 2 checks\n' +
        'Result: seat 5 wins $17, seat 2 wins $17\n',
    );

    const foldOut = scripted([
      { seat: 6, type: 'fold' },
      { seat: 1, type: 'fold' },
      { seat: 2, type: 'fold' },
      { seat: 3, type: 'fold' },
      { seat: 4, type: 'fold' },
    ]);
    expect(formatHand(foldOut).split('\n').slice(7)).toEqual([
      'Board: none',
      'Preflop: seat 4 posts small blind $2, seat 5 posts big blind $4, seat 6 folds, seat 1 folds, ' +
        'seat 2 folds, seat 3 folds, seat 4 folds',
      'Result: seat 5 wins $4',
      '',
    ]);

    const illegal = { ...split.record, actions: [{ seat: 1, type: 'check' } as Action] };
    expect(() => replayHand(illegal)).toThrow(new Error('Replay diverged at action 0'));
  });

  it('appends the violation block only when there are violations', () => {
    const hand = scripted([{ seat: 6, type: 'fold' }]);
    const firstViolation: ViolatingHand = {
      ...hand,
      violations: 2,
      violation: {
        actionNumber: 2,
        action: { seat: 1, type: 'check' },
        violations: [
          { invariant: 'legal-action', message: 'seat 1 checks is not in the legal set' },
          { invariant: 'cards', message: 'Ah dealt twice' },
        ],
      },
    };
    const summary: PlaytestSummary = {
      handsPlayed: 9,
      foldOuts: 6,
      showdowns: 2,
      playerActions: 120,
      cappedStreets: 3,
      largestPot: 96,
      firstReplayCode: '000000000000002a0000000000000001',
      lastReplayCode: '000000000000002a0000000000000009',
      violations: 2,
      violationCounts: {
        chips: 0,
        'legal-action': 1,
        'bet-cap': 0,
        'pot-eligibility': 0,
        cards: 1,
      },
      firstViolation,
    };
    const report =
      'Header\n' +
      'Hands played: 9\n' +
      'Ended by fold: 6\n' +
      'Ended at showdown: 2\n' +
      'Player actions: 120\n' +
      'Streets capped at 4 bets: 3\n' +
      'Largest pot: $96\n' +
      'First replay code: 000000000000002a0000000000000001\n' +
      'Last replay code: 000000000000002a0000000000000009\n' +
      'Invariant violations: 2\n' +
      'Violations by invariant: chips 0, legal-action 1, bet-cap 0, pot-eligibility 0, cards 1\n' +
      'First violation: hand 7, player action 2 (seat 1 checks)\n' +
      'Violation: legal-action: seat 1 checks is not in the legal set\n' +
      'Violation: cards: Ah dealt twice\n';
    expect(formatReport('Header\n', summary, 'replay')).toBe(report);
    expect(formatReport('Header\n', summary)).toBe(
      report +
        'Replay: npm run playtest -- --replay-code 000000000000002a0000000000000007 --size 6 --button 3\n' +
        'Hand 7: replay code 000000000000002a0000000000000007, button seat 3\n' +
        'Seat 1 ($160): 2s 4d\n' +
        'Seat 2 ($160): 3c 4h\n' +
        'Seat 3 ($160): 3d 4s\n' +
        'Seat 4 ($160): 2c 3h\n' +
        'Seat 5 ($160): 2d 3s\n' +
        'Seat 6 ($160): 2h 4c\n' +
        'Board: none\n' +
        'Preflop: seat 4 posts small blind $2, seat 5 posts big blind $4, seat 6 folds\n' +
        'Result: abandoned (invariant violation)\n',
    );

    const custom = { ...summary, violationCounts: { ...summary.violationCounts, 'test-probe': 1 } };
    expect(formatReport('', custom, 'replay')).toContain(
      'Violations by invariant: chips 0, legal-action 1, bet-cap 0, pot-eligibility 0, cards 1, test-probe 1\n',
    );
    const clean: PlaytestSummary = { ...summary, violations: 0, firstViolation: null };
    expect(formatReport('Header\n', clean)).toBe(
      report
        .slice(0, report.indexOf('Violations by'))
        .replace('Invariant violations: 2\n', 'Invariant violations: 0\n'),
    );

    const source = readFileSync(new URL('../../src/playtest/cli.ts', import.meta.url), 'utf8');
    const block = source.slice(
      source.indexOf('function violationBlock('),
      source.indexOf('\n}\n', source.indexOf('function violationBlock(')),
    );
    expect(block).toContain('hand: ViolatingHand');
    expect(block).not.toContain('=== null');
  });

  it('prints player actions with describeAction wording', () => {
    const hand = scripted([
      { seat: 6, type: 'fold' },
      { seat: 1, type: 'call', amount: 4 },
      { seat: 2, type: 'raise', amount: 8 },
      { seat: 3, type: 'fold' },
      { seat: 4, type: 'call', amount: 6 },
      { seat: 5, type: 'call', amount: 4 },
      { seat: 1, type: 'call', amount: 4 },
      { seat: 4, type: 'check' },
      { seat: 5, type: 'bet', amount: 4 },
    ]);
    const kinds = new Set(hand.final.actions.map((a) => a.type));
    for (const type of ['fold', 'check', 'call', 'bet', 'raise']) expect(kinds).toContain(type);
    const printed = formatHand(hand)
      .split('\n')
      .filter((line) => /^(Preflop|Flop|Turn|River): /.test(line))
      .flatMap((line) => line.slice(line.indexOf(': ') + 2).split(', '))
      .filter((text) => !text.includes(' posts '));
    const players = hand.final.actions.filter(
      (a) => a.type !== 'small-blind' && a.type !== 'big-blind',
    );
    expect(printed).toEqual(players.map((record) => describeAction(toAction(record))));

    const source = readFileSync(new URL('../../src/playtest/cli.ts', import.meta.url), 'utf8');
    for (const literal of ["'folds'", "'checks'", 'calls $', 'bets $', 'raises to $']) {
      expect(source).not.toContain(literal);
    }
  });
});

/** 2c..5h in order with a royal flush in spades on the board (6 seats, button 3). */
function royalDeck(): Card[] {
  const royal = ['Ts', 'Js', 'Qs', 'Ks', 'As'].map(parseCard);
  const rest = Array.from({ length: 52 }, (_, c) => c).filter((c) => !royal.includes(c));
  const [t, j, q, k, a] = royal as [Card, Card, Card, Card, Card];
  return [
    ...rest.slice(0, 13),
    t,
    j,
    q,
    rest[13] as Card,
    k,
    rest[14] as Card,
    a,
    ...rest.slice(15),
  ];
}

function scripted(actions: Action[]): PlayedHand {
  const seats = [1, 2, 3, 4, 5, 6].map((seat) => ({ seat, stack: 160 }));
  let state: HandState = createHand({
    stakes: PLAYTEST_STAKES,
    seats,
    button: 3,
    deck: royalDeck(),
  });
  for (const action of actions) {
    const applied = applyAction(state, action);
    if (!applied.ok) throw new Error(applied.error.message);
    state = applied.state;
  }
  return {
    number: 7,
    record: {
      replayCode: '000000000000002a0000000000000007',
      stakes: PLAYTEST_STAKES,
      seats,
      button: 3,
      actions,
    },
    final: state,
    violations: 0,
    violation: null,
  };
}
