import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseCard, type Card } from '../../src/engine/cards';
import {
  applyAction,
  createHand,
  type Action,
  type HandState,
  type SeatConfig,
} from '../../src/engine/hand';
import { describeAction } from '../../src/engine/invariants';
import { formatHand, formatReport, main, parseArgs, USAGE } from '../../src/playtest/cli';
import {
  PLAYTEST_STAKES,
  replayHand,
  runPlaytest,
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
const STACKS_ERROR =
  'Error: --stacks must be one whole number per seat (0 for an empty seat), at least two above 0, totalling at most 9007199254740991.';

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
  [['--game', 'poker'], 'Error: --game must be cash or sng.'],
  [['--replay-code', VALID_CODE, '--game', 'SNG'], 'Error: --game must be cash or sng.'],
  [['--stacks', '1,2'], 'Error: --stacks is only valid with --replay-code.'],
  ...['160,160', '0,0,160', '160,x,160', '9007199254740991,1,0', '160,,160', ' 160,160,160'].map(
    (stacks): [string[], string] => [
      ['--replay-code', VALID_CODE, '--size', '3', '--stacks', stacks],
      STACKS_ERROR,
    ],
  ),
  [
    ['--replay-code', VALID_CODE, '--size', '3', '--button', '2', '--stacks', '160,0,160'],
    'Error: --button must be a seat with chips.',
  ],
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
      'Usage: npm run playtest -- [--hands <1-1000000000>] [--seed <0-9007199254740991>] [--size <2-10>] [--game <cash|sng>] [--lineup <mixed|tough|soft>]\n' +
        '       npm run playtest -- --replay-code <32 lowercase hex characters> [--size <2-10>] [--button <seat>] [--game <cash|sng>] [--stacks <one stack per seat, comma-separated, 0 = empty seat>] [--lineup <mixed|tough|soft>]\n' +
        'Defaults: --hands 10000 --seed 42 --size 6 --button 1 --game cash; --stacks gives every seat $160 (cash) or 1500 (sng)\n' +
        "--lineup: seat 1 plays the user (TAG) and seats 2 and up play the preset's styles; without it every seat plays TAG at 6 seats and random moves at other sizes\n",
    );
    expect(parseArgs([])).toEqual({
      kind: 'run',
      options: { hands: 10000, seed: 42, size: 6, game: 'cash' },
    });
    expect(parseArgs(['--replay-code', VALID_CODE])).toEqual({
      kind: 'replay',
      replayCode: VALID_CODE,
      size: 6,
      button: 1,
      game: 'cash',
      stacks: [160, 160, 160, 160, 160, 160],
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
      options: { hands: 10000, seed: 42, size: 2, game: 'cash' },
    });
    expect(parseArgs(['--replay-code', VALID_CODE, '--size', '2', '--button', '2'])).toEqual({
      kind: 'replay',
      replayCode: VALID_CODE,
      size: 2,
      button: 2,
      game: 'cash',
      stacks: [160, 160],
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

    const atDeal: PlayedHand = {
      ...scripted([]),
      violations: 1,
      dealViolations: [
        { invariant: 'chips', message: 'seat 1 starts with $161 but should start with $160' },
      ],
    };
    const dealReport = formatReport(
      '',
      { ...summary, violations: 1, firstViolation: atDeal },
      'replay',
    );
    expect(dealReport).toContain(
      'First violation: hand 7, at the deal\n' +
        'Violation: chips: seat 1 starts with $161 but should start with $160\n',
    );
    expect(dealReport).not.toContain('player action');
  });

  it('game and stacks options', () => {
    expect(parseArgs(['--game', 'sng', '--hands', '5'])).toEqual({
      kind: 'run',
      options: { hands: 5, seed: 42, size: 6, game: 'sng' },
    });
    expect(parseArgs(['--replay-code', VALID_CODE, '--size', '3', '--game', 'sng'])).toMatchObject({
      game: 'sng',
      stacks: [1500, 1500, 1500],
    });

    const replay = capture([
      '--replay-code',
      VALID_CODE,
      '--size',
      '3',
      '--button',
      '2',
      '--game',
      'sng',
      '--stacks',
      '0,2900,100',
    ]);
    expect(replay.code).toBe(0);
    const lines = replay.out.split('\n');
    expect(lines).toContain(
      `Options: --replay-code ${VALID_CODE} --size 3 --button 2 --game sng --stacks 0,2900,100`,
    );
    expect(lines).toContain(
      'Table: 3 players, sit-and-go 20/40 (blinds 10/20), 1500 chips each, busted seats sit out, a new sit-and-go starts when one player has all the chips',
    );
    expect(lines.some((line) => line.startsWith('Seat 2 ($2900): '))).toBe(true);
    expect(lines.some((line) => line.startsWith('Seat 3 ($100): '))).toBe(true);
    expect(lines.some((line) => line.startsWith('Seat 1 '))).toBe(false);
    expect(replay.out).toContain('seat 2 posts small blind $10, seat 3 posts big blind $20');

    const sngDefault = capture(['--replay-code', VALID_CODE, '--size', '3', '--game', 'sng']);
    expect(sngDefault.out).toContain(
      `Options: --replay-code ${VALID_CODE} --size 3 --button 1 --game sng\n`,
    );
    expect(capture(['--hands', '2', '--game', 'sng']).out).toContain(
      'Options: --hands 2 --seed 42 --size 6 --game sng\n',
    );
    const cashStacks = capture(['--replay-code', VALID_CODE, '--size', '2', '--stacks', '1,160']);
    expect(cashStacks.out).toContain(
      `Options: --replay-code ${VALID_CODE} --size 2 --button 1 --stacks 1,160\n`,
    );
    expect(cashStacks.out).toContain('seat 1 posts small blind $1, seat 2 posts big blind $4');

    // W5: a $1 stack posts $1 of the $2 small blind.
    const short = scripted(
      [],
      [160, 160, 160, 1, 160, 160].map((stack, i) => ({ seat: i + 1, stack })),
    );
    expect(formatHand(short)).toContain('seat 4 posts small blind $1, seat 5 posts big blind $4');

    // Replay line suffixes (A-7).
    const replayLine = (hand: PlayedHand) => {
      const out = formatReport('', {
        ...EMPTY_SUMMARY,
        violations: 1,
        firstViolation: {
          ...hand,
          violations: 1,
          dealViolations: [{ invariant: 'chips', message: 'x' }],
        },
      });
      return out.split('\n').find((line) => line.startsWith('Replay: '));
    };
    const base = scripted([]);
    expect(replayLine(base)).toBe(
      'Replay: npm run playtest -- --replay-code 000000000000002a0000000000000007 --size 6 --button 3',
    );
    const carried = scripted(
      [],
      [1, 2, 3, 4, 6].map((seat) => ({ seat, stack: seat * 100 })),
    );
    expect(replayLine(carried)).toBe(
      'Replay: npm run playtest -- --replay-code 000000000000002a0000000000000007 --size 6 --button 3 --stacks 100,200,300,400,0,600',
    );
    const sng: PlayedHand = {
      ...base,
      record: {
        ...base.record,
        game: 'sng',
        seats: base.record.seats.map((s) => ({ ...s, stack: 1500 })),
      },
    };
    expect(replayLine(sng)).toBe(
      'Replay: npm run playtest -- --replay-code 000000000000002a0000000000000007 --size 6 --button 3 --game sng',
    );
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

  it('--lineup parsing, header lines and replay suffix', () => {
    expect(parseArgs(['--lineup', 'soft'])).toEqual({
      kind: 'run',
      options: { hands: 10000, seed: 42, size: 6, game: 'cash', lineUp: 'Soft' },
    });
    expect(parseArgs(['--replay-code', VALID_CODE, '--lineup', 'mixed'])).toEqual({
      kind: 'replay',
      replayCode: VALID_CODE,
      size: 6,
      button: 1,
      game: 'cash',
      stacks: [160, 160, 160, 160, 160, 160],
      lineUp: 'Mixed',
    });
    const badLineUp = { kind: 'error', message: 'Error: --lineup must be mixed, tough or soft.' };
    for (const value of ['loose', 'Tough', 'custom', '', 'toString', 'MIXED']) {
      expect(parseArgs(['--lineup', value])).toEqual(badLineUp);
    }
    expect(parseArgs(['--lineup', 'soft', '--lineup', 'soft'])).toEqual({
      kind: 'error',
      message: 'Error: --lineup given more than once.',
    });
    expect(parseArgs(['--lineup'])).toEqual({
      kind: 'error',
      message: 'Error: --lineup needs a value.',
    });

    const note =
      'Line-up note: styles play only in hands with 6 seats dealt in; other hands use random moves until advice covers other table sizes.\n';
    const faulty = capture(['--hands', '2', '--seed', '1', '--size', '3', '--lineup', 'tough'], {
      makePolicy: () => (view) => ({ seat: view.seat, type: 'raise', amount: 999 }),
    });
    expect(faulty.code).toBe(1);
    const replayLine = faulty.out.split('\n').find((line) => line.startsWith('Replay: '));
    expect(replayLine).toMatch(
      /^Replay: npm run playtest -- --replay-code [0-9a-f]{32} .* --lineup tough$/,
    );
    expect(faulty.out).toContain(
      'Options: --hands 2 --seed 1 --size 3 --lineup tough\n' +
        'Table: 3 players, cash $4/$8, stacks carry over, a busted seat rebuys for $160\n' +
        'Line-up: tough, seat 1 plays the user, seat 2 Ava (Maniac), seat 3 Ben (TAG)\n' +
        note,
    );

    const small = capture(['--hands', '3', '--size', '3', '--lineup', 'soft']);
    expect(small.code).toBe(0);
    expect(small.out).toContain(
      'Line-up: soft, seat 1 plays the user, seat 2 Ava (Calling station), seat 3 Ben (Rock)\n' +
        note,
    );
    const sng = capture(['--hands', '3', '--game', 'sng', '--lineup', 'soft']);
    expect(sng.out).toContain('Options: --hands 3 --seed 42 --size 6 --game sng --lineup soft\n');
    expect(sng.out).toContain(note);
    const six = capture(['--hands', '3', '--lineup', 'mixed']);
    expect(six.out).not.toContain('Line-up note:');
    expect(capture(['--hands', '3']).out).not.toContain('Line-up');

    const replay = capture(['--replay-code', VALID_CODE, '--size', '3', '--lineup', 'mixed']);
    expect(replay.code).toBe(0);
    expect(replay.out).toContain(
      'Options: --replay-code ' +
        VALID_CODE +
        ' --size 3 --button 1 --lineup mixed\n' +
        'Table: 3 players, cash $4/$8, stacks carry over, a busted seat rebuys for $160\n' +
        'Line-up: mixed, seat 1 plays the user, seat 2 Ava (TAG), seat 3 Ben (Calling station)\n' +
        note +
        'Hand 1: ',
    );
    const replayFaulty = capture(
      ['--replay-code', VALID_CODE, '--size', '3', '--lineup', 'mixed'],
      {
        makePolicy: () => (view) => ({ seat: view.seat, type: 'check' }),
      },
    );
    expect(replayFaulty.code).toBe(1);
    expect(replayFaulty.out).not.toContain('Replay: ');

    // A 6-max line-up hand replays with the line-up's policies (A-5).
    const played: PlayedHand[] = [];
    runPlaytest({ hands: 5, seed: 42, size: 6, lineUp: 'Mixed' }, (hand) => played.push(hand));
    let differing = 0;
    for (const hand of played) {
      const stacks = Array.from(
        { length: 6 },
        (_, i) => hand.record.seats.find((s) => s.seat === i + 1)?.stack ?? 0,
      ).join(',');
      const argv = [
        '--replay-code',
        hand.record.replayCode,
        '--button',
        String(hand.record.button),
        '--stacks',
        stacks,
      ];
      const withLineUp = capture([...argv, '--lineup', 'mixed']);
      expect(withLineUp.code).toBe(0);
      const expected = formatHand({ ...hand, number: 1 });
      expect(withLineUp.out).toContain(expected);
      if (!capture(argv).out.includes(expected)) differing++;
    }
    expect(differing).toBeGreaterThan(0);
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

const EMPTY_SUMMARY: PlaytestSummary = {
  handsPlayed: 1,
  foldOuts: 0,
  showdowns: 0,
  playerActions: 0,
  cappedStreets: 0,
  largestPot: 0,
  firstReplayCode: '000000000000002a0000000000000007',
  lastReplayCode: '000000000000002a0000000000000007',
  violations: 0,
  violationCounts: { chips: 0, 'legal-action': 0, 'bet-cap': 0, 'pot-eligibility': 0, cards: 0 },
  firstViolation: null,
};

function scripted(
  actions: Action[],
  seats: SeatConfig[] = [1, 2, 3, 4, 5, 6].map((seat) => ({ seat, stack: 160 })),
): PlayedHand {
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
      game: 'cash',
      size: 6,
    },
    final: state,
    violations: 0,
    violation: null,
    dealViolations: [],
  };
}
