import { formatCard } from '../engine/cards';
import { isReplayCode, type ReplayCode } from '../engine/deck';
import type { ActionRecord, SeatNumber } from '../engine/hand';
import { describeAction, INVARIANTS } from '../engine/invariants';
import {
  GAMES,
  playHand,
  runPlaytest,
  summarize,
  toAction,
  type GameType,
  type HandRecord,
  type PlayedHand,
  type PlaytestOptions,
  type PlaytestSeams,
  type PlaytestSummary,
} from './runner';

export interface CliIo {
  readonly out: (text: string) => void;
  readonly err: (text: string) => void;
}
export type ParsedArgs =
  | { readonly kind: 'run'; readonly options: PlaytestOptions & { readonly game: GameType } }
  | {
      readonly kind: 'replay';
      readonly replayCode: ReplayCode;
      readonly size: number;
      readonly button: SeatNumber;
      readonly game: GameType;
      /** One per seat 1..size; 0 = empty seat. */
      readonly stacks: readonly number[];
    }
  | { readonly kind: 'help' }
  | { readonly kind: 'error'; readonly message: string };

export const USAGE =
  'Usage: npm run playtest -- [--hands <1-1000000000>] [--seed <0-9007199254740991>] [--size <2-10>] [--game <cash|sng>]\n' +
  '       npm run playtest -- --replay-code <32 lowercase hex characters> [--size <2-10>] [--button <seat>] [--game <cash|sng>] [--stacks <one stack per seat, comma-separated, 0 = empty seat>]\n' +
  'Defaults: --hands 10000 --seed 42 --size 6 --button 1 --game cash; --stacks gives every seat $160 (cash) or 1500 (sng)\n';

const VALUE_OPTIONS = [
  '--hands',
  '--seed',
  '--size',
  '--replay-code',
  '--button',
  '--game',
  '--stacks',
] as const;
type ValueOption = (typeof VALUE_OPTIONS)[number];

const error = (message: string): ParsedArgs => ({ kind: 'error', message });
const SIZE_ERROR = 'Error: --size must be a whole number from 2 to 10.';
const STACKS_ERROR =
  'Error: --stacks must be one whole number per seat (0 for an empty seat), at least two above 0, totalling at most 9007199254740991.';

/** The stacks in `text` if valid for `size` seats (strict digits and commas, bounded), else undefined. */
function parseStacks(text: string, size: number): number[] | undefined {
  if (!/^[0-9]+(,[0-9]+)*$/.test(text)) return undefined;
  const stacks = text.split(',').map(Number);
  const total = stacks.reduce((sum, stack) => sum + stack, 0);
  const ok =
    stacks.length === size &&
    stacks.every((stack) => stack <= Number.MAX_SAFE_INTEGER) &&
    stacks.filter((stack) => stack > 0).length >= 2 &&
    total <= Number.MAX_SAFE_INTEGER;
  return ok ? stacks : undefined;
}

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

  const game = values.get('--game') ?? 'cash';
  if (game !== 'cash' && game !== 'sng') return error('Error: --game must be cash or sng.');
  const size = whole('--size', 6, 2, 10);
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
    const stacksText = values.get('--stacks');
    const stacks =
      stacksText === undefined
        ? Array.from({ length: size }, () => GAMES[game].startingStack)
        : parseStacks(stacksText, size);
    if (stacks === undefined) return error(STACKS_ERROR);
    if (stacks[button - 1] === 0) return error('Error: --button must be a seat with chips.');
    return { kind: 'replay', replayCode, size, button, game, stacks };
  }
  if (values.has('--button')) return error('Error: --button is only valid with --replay-code.');
  if (values.has('--stacks')) return error('Error: --stacks is only valid with --replay-code.');
  const hands = whole('--hands', 10_000, 1, 1_000_000_000);
  if (hands === undefined) {
    return error('Error: --hands must be a whole number from 1 to 1000000000.');
  }
  const seed = whole('--seed', 42, 0, Number.MAX_SAFE_INTEGER);
  if (seed === undefined) {
    return error('Error: --seed must be a whole number from 0 to 9007199254740991.');
  }
  if (size === undefined) return error(SIZE_ERROR);
  return { kind: 'run', options: { hands, seed, size, game } };
}

/** `header` (whole lines) followed by the summary lines, then the violation block when there are
 *  violations. Replay mode has already printed the hand, so its block has no Replay line or hand. */
export function formatReport(
  header: string,
  summary: PlaytestSummary,
  mode: 'run' | 'replay' = 'run',
): string {
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
      .join('') +
    (summary.firstViolation !== null
      ? violationBlock(summary.firstViolation, summary.violationCounts, mode)
      : '')
  );
}

/** ` --game sng` for sng, then ` --stacks a,b,…` if any seat differs from the game's starting stack (A-7). */
function gameSuffix(game: GameType, stacks: readonly number[]): string {
  const changed = stacks.some((stack) => stack !== GAMES[game].startingStack);
  return (game === 'sng' ? ' --game sng' : '') + (changed ? ` --stacks ${stacks.join(',')}` : '');
}

/** One stack per seat 1..size: each dealt-in seat's starting stack, 0 for the others. */
function recordStacks({ seats, size }: HandRecord): number[] {
  return Array.from({ length: size }, (_, i) => seats.find((s) => s.seat === i + 1)?.stack ?? 0);
}

function violationBlock(
  hand: PlayedHand,
  counts: PlaytestSummary['violationCounts'],
  mode: 'run' | 'replay',
): string {
  const { violation, record, dealViolations } = hand;
  const ids = [
    ...INVARIANTS,
    ...Object.keys(counts).filter((id) => !INVARIANTS.some((i) => i === id)),
  ];
  const where =
    violation === null
      ? 'at the deal'
      : `player action ${violation.actionNumber} (${describeAction(violation.action)})`;
  const lines = [
    `Violations by invariant: ${ids.map((id) => `${id} ${counts[id] ?? 0}`).join(', ')}`,
    `First violation: hand ${hand.number}, ${where}`,
    ...[...dealViolations, ...(violation?.violations ?? [])].map(
      (v) => `Violation: ${v.invariant}: ${v.message}`,
    ),
  ];
  if (mode === 'replay') return lines.map((line) => `${line}\n`).join('');
  lines.push(
    `Replay: npm run playtest -- --replay-code ${record.replayCode} --size ${record.size} --button ${record.button}` +
      gameSuffix(record.game, recordStacks(record)),
  );
  return lines.map((line) => `${line}\n`).join('') + formatHand(hand);
}

const STREETS = ['Preflop', 'Flop', 'Turn', 'River'] as const;

function actionText(record: ActionRecord): string {
  if (record.type === 'small-blind')
    return `seat ${record.seat} posts small blind $${record.added}`;
  if (record.type === 'big-blind') return `seat ${record.seat} posts big blind $${record.added}`;
  return describeAction(toAction(record));
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

function tableLine(size: number, game: GameType): string {
  const { stakes, startingStack } = GAMES[game];
  const { smallBlind, bigBlind, smallBet, bigBet } = stakes;
  if (game === 'cash') {
    return `Table: ${size} players, cash $${smallBet}/$${bigBet}, stacks carry over, a busted seat rebuys for $${startingStack}\n`;
  }
  return `Table: ${size} players, sit-and-go ${smallBet}/${bigBet} (blinds ${smallBlind}/${bigBlind}), ${startingStack} chips each, busted seats sit out, a new sit-and-go starts when one player has all the chips\n`;
}

/** Returns the exit code: 0 no violations, 1 violations, 2 usage error. Writes everything through io.
 *  seams are test seams; the entry never passes them. */
export function main(argv: readonly string[], io: CliIo, seams: PlaytestSeams = {}): number {
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
    const { hands, seed, size, game } = parsed.options;
    const sng = game === 'sng' ? ' --game sng' : '';
    header += `Options: --hands ${hands} --seed ${seed} --size ${size}${sng}\n${tableLine(size, game)}`;
    summary = runPlaytest(parsed.options, undefined, seams);
  } else {
    const { replayCode, size, button, game, stacks } = parsed;
    const hand = playHand(replayCode, size, button, 1, seams, { game, stacks });
    header += `Options: --replay-code ${replayCode} --size ${size} --button ${button}${gameSuffix(game, stacks)}\n`;
    header += tableLine(size, game) + formatHand(hand);
    summary = summarize([hand]);
  }
  io.out(formatReport(header, summary, parsed.kind));
  return summary.violations > 0 ? 1 : 0;
}
