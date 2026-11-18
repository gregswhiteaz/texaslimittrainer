import { formatCard } from '../engine/cards';
import { isReplayCode, type ReplayCode } from '../engine/deck';
import type { ActionRecord, SeatNumber } from '../engine/hand';
import {
  CASH_BUY_IN,
  playHand,
  PLAYTEST_STAKES,
  runPlaytest,
  summarize,
  type PlayedHand,
  type PlaytestOptions,
  type PlaytestSummary,
  type PolicyFactory,
} from './runner';

export interface CliIo {
  readonly out: (text: string) => void;
  readonly err: (text: string) => void;
}
export type ParsedArgs =
  | { readonly kind: 'run'; readonly options: PlaytestOptions }
  | {
      readonly kind: 'replay';
      readonly replayCode: ReplayCode;
      readonly size: number;
      readonly button: SeatNumber;
    }
  | { readonly kind: 'help' }
  | { readonly kind: 'error'; readonly message: string };

export const USAGE =
  'Usage: npm run playtest -- [--hands <1-1000000000>] [--seed <0-9007199254740991>] [--size <3-10>]\n' +
  '       npm run playtest -- --replay-code <32 lowercase hex characters> [--size <3-10>] [--button <seat>]\n' +
  'Defaults: --hands 10000 --seed 42 --size 6 --button 1\n';

const VALUE_OPTIONS = ['--hands', '--seed', '--size', '--replay-code', '--button'] as const;
type ValueOption = (typeof VALUE_OPTIONS)[number];

const error = (message: string): ParsedArgs => ({ kind: 'error', message });
const SIZE_ERROR = 'Error: --size must be a whole number from 3 to 10.';

export function parseArgs(argv: readonly string[]): ParsedArgs {
  const values = new Map<ValueOption, string>();
  let help = false;
  for (let i = 0; i < argv.length; i++) {
    const name = argv[i] as string;
    if (name === '--help') {
      if (help) return error('Error: --help given more than once.');
      help = true;
      continue;
    }
    const option = VALUE_OPTIONS.find((o) => o === name);
    if (option === undefined) return error('Error: unknown option.');
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) {
      return error(`Error: ${option} needs a value.`);
    }
    if (values.has(option)) return error(`Error: ${option} given more than once.`);
    values.set(option, value);
    i++;
  }
  if (help) {
    return values.size > 0
      ? error('Error: --help cannot be combined with other options.')
      : { kind: 'help' };
  }
  /** `fallback` if `option` is absent; its value if plain decimal digits within min..max; else undefined. */
  const whole = (option: ValueOption, fallback: number, min: number, max: number) => {
    const text = values.get(option);
    if (text === undefined) return fallback;
    const value = /^[0-9]+$/.test(text) ? Number(text) : NaN;
    return value >= min && value <= max ? value : undefined;
  };

  const size = whole('--size', 6, 3, 10);
  const replayCode = values.get('--replay-code');
  if (replayCode !== undefined) {
    if (values.has('--hands') || values.has('--seed')) {
      return error('Error: --replay-code cannot be combined with --hands or --seed.');
    }
    if (!isReplayCode(replayCode)) {
      return error(
        'Error: --replay-code must be 32 lowercase hex characters (0-9, a-f), not all zeros.',
      );
    }
    if (size === undefined) return error(SIZE_ERROR);
    const button = whole('--button', 1, 1, size);
    if (button === undefined) {
      return error('Error: --button must be a seat number from 1 to the table size.');
    }
    return { kind: 'replay', replayCode, size, button };
  }
  if (values.has('--button')) return error('Error: --button is only valid with --replay-code.');
  const hands = whole('--hands', 10_000, 1, 1_000_000_000);
  if (hands === undefined) {
    return error('Error: --hands must be a whole number from 1 to 1000000000.');
  }
  const seed = whole('--seed', 42, 0, Number.MAX_SAFE_INTEGER);
  if (seed === undefined) {
    return error('Error: --seed must be a whole number from 0 to 9007199254740991.');
  }
  if (size === undefined) return error(SIZE_ERROR);
  return { kind: 'run', options: { hands, seed, size } };
}

/** `header` (whole lines) followed by the summary lines. */
export function formatReport(header: string, summary: PlaytestSummary): string {
  return (
    header +
    [
      `Hands played: ${summary.handsPlayed}`,
      `Ended by fold: ${summary.foldOuts}`,
      `Ended at showdown: ${summary.showdowns}`,
      `Player actions: ${summary.playerActions}`,
      `Streets capped at 4 bets: ${summary.cappedStreets}`,
      `Largest pot: $${summary.largestPot}`,
      `First replay code: ${summary.firstReplayCode}`,
      `Last replay code: ${summary.lastReplayCode}`,
      `Invariant violations: ${summary.violations}`,
    ]
      .map((line) => `${line}\n`)
      .join('')
  );
}

const STREETS = ['Preflop', 'Flop', 'Turn', 'River'] as const;

function actionText(record: ActionRecord): string {
  const words = {
    'small-blind': `posts small blind $${record.amount}`,
    'big-blind': `posts big blind $${record.amount}`,
    fold: 'folds',
    check: 'checks',
    call: `calls $${record.amount}`,
    bet: `bets $${record.amount}`,
    raise: `raises to $${record.amount}`,
  }[record.type];
  return `seat ${record.seat} ${words}`;
}

export function formatHand(hand: PlayedHand): string {
  const { final, record } = hand;
  const cards = (list: readonly number[]) => list.map(formatCard).join(' ');
  const lines = [
    `Hand ${hand.number}: replay code ${record.replayCode}, button seat ${final.button}`,
  ];
  for (const player of final.players) {
    lines.push(`Seat ${player.seat} ($${player.startingStack}): ${cards(player.holeCards)}`);
  }
  lines.push(`Board: ${final.board.length === 0 ? 'none' : cards(final.board)}`);
  for (const label of STREETS) {
    const onStreet = final.actions.filter((a) => a.street === label.toLowerCase());
    if (onStreet.length > 0) lines.push(`${label}: ${onStreet.map(actionText).join(', ')}`);
  }
  const result = final.result;
  lines.push(
    result === null
      ? 'Result: abandoned (invariant violation)'
      : `Result: ${result.awards
          .flatMap((award) => award.winners)
          .map((w) => `seat ${w.seat} wins $${w.amount}`)
          .join(', ')}`,
  );
  return lines.map((line) => `${line}\n`).join('');
}

function tableLine(size: number): string {
  const { smallBet, bigBet } = PLAYTEST_STAKES;
  return `Table: ${size} players, cash $${smallBet}/$${bigBet}, every stack reset to $${CASH_BUY_IN} before each hand\n`;
}

/** Returns the exit code: 0 no violations, 1 violations, 2 usage error. Writes everything through io.
 *  makePolicy is a test seam (SPEC-12); the entry never passes it. */
export function main(argv: readonly string[], io: CliIo, makePolicy?: PolicyFactory): number {
  const parsed = parseArgs(argv);
  if (parsed.kind === 'error') {
    io.err(`${parsed.message}\n${USAGE}`);
    return 2;
  }
  if (parsed.kind === 'help') {
    io.out(USAGE);
    return 0;
  }
  let header = 'TLH Trainer playtest\n';
  let summary: PlaytestSummary;
  if (parsed.kind === 'run') {
    const { hands, seed, size } = parsed.options;
    header += `Options: --hands ${hands} --seed ${seed} --size ${size}\n${tableLine(size)}`;
    summary = runPlaytest(parsed.options, undefined, makePolicy);
  } else {
    const { replayCode, size, button } = parsed;
    const hand = playHand(replayCode, size, button, 1, makePolicy);
    header += `Options: --replay-code ${replayCode} --size ${size} --button ${button}\n`;
    header += tableLine(size) + formatHand(hand);
    summary = summarize([hand]);
  }
  io.out(formatReport(header, summary));
  return summary.violations > 0 ? 1 : 0;
}
