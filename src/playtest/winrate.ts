import { GAMES, type GameType, type PlayedHand } from './runner';

/** Welford's online accumulator of one bot's per-hand chip results (A-5). Mutable. */
export interface Tally {
  hands: number;
  mean: number;
  /** Sum of squared deviations from the mean. */
  m2: number;
}

export const newTally = (): Tally => ({ hands: 0, mean: 0, m2: 0 });

export function addResult(tally: Tally, result: number): void {
  tally.hands += 1;
  const d = result - tally.mean;
  tally.mean += d / tally.hands;
  tally.m2 += d * (result - tally.mean);
}

export interface WinRate {
  readonly hands: number;
  readonly bbPer100: number;
  /** 95% interval bounds in BB/100; null with fewer than 2 hands. */
  readonly lower: number | null;
  readonly upper: number | null;
}

/** BB/100 and its 95% interval (mean ± 1.96 × sample SD / √n). Throws RangeError on 0 hands. */
export function winRateOfTally({ hands, mean, m2 }: Tally, bigBet: number): WinRate {
  if (hands === 0) throw new RangeError('No hands to rate');
  const scale = (chips: number) => (chips / bigBet) * 100;
  if (hands < 2) return { hands, bbPer100: scale(mean), lower: null, upper: null };
  const half = (1.96 * Math.sqrt(m2 / (hands - 1))) / Math.sqrt(hands);
  return { hands, bbPer100: scale(mean), lower: scale(mean - half), upper: scale(mean + half) };
}

export function winRate(results: readonly number[], bigBet: number): WinRate {
  const tally = newTally();
  for (const result of results) addResult(tally, result);
  return winRateOfTally(tally, bigBet);
}

export interface BotRow {
  readonly seat: number;
  readonly name: string;
  readonly style: string;
  readonly rate: WinRate;
}

interface Bot {
  readonly seat: number;
  readonly name: string;
  readonly style: string;
  readonly tally: Tally;
}

/** Per-bot results of a run, fed one PlayedHand at a time. A bot is (seat, name, style) (A-2). */
export class BotResults {
  private readonly bots = new Map<string, Bot>();
  private readonly bigBet: number;

  constructor(game: GameType) {
    this.bigBet = GAMES[game].stakes.bigBet;
  }

  /** Counts each dealt-in seat's chip result; abandoned or violating hands count for no bot (A-1). */
  add(hand: PlayedHand): void {
    if (hand.violations > 0 || hand.final.result === null) return;
    for (const p of hand.final.players) {
      const lineUpSeat = hand.lineUp?.[p.seat - 1];
      const [name, style] =
        lineUpSeat === undefined
          ? [`Seat ${p.seat}`, 'TAG']
          : lineUpSeat.kind === 'user'
            ? ['User', 'TAG']
            : [String(lineUpSeat.name), String(lineUpSeat.style)];
      const key = `${p.seat}\u0000${name}\u0000${style}`;
      let bot = this.bots.get(key);
      if (bot === undefined) {
        bot = { seat: p.seat, name, style, tally: newTally() };
        this.bots.set(key, bot);
      }
      addResult(bot.tally, p.stack - p.startingStack);
    }
  }

  /** One row per bot with at least one counted hand, by seat, then first hand (stable sort of insertion order). */
  rows(): BotRow[] {
    return [...this.bots.values()]
      .sort((a, b) => a.seat - b.seat)
      .map(({ seat, name, style, tally }) => ({
        seat,
        name,
        style,
        rate: winRateOfTally(tally, this.bigBet),
      }));
  }
}

/** `toFixed(2)`, with `-0.00` shown as `0.00` (A-6). */
function fixed(value: number): string {
  const text = value.toFixed(2);
  return text === '-0.00' ? '0.00' : text;
}

/** The `Bot results` line and one `Bot:` line per row (whole lines); '' when there are no rows. */
export function formatBotResults(rows: readonly BotRow[], game: GameType): string {
  if (rows.length === 0) return '';
  const { bigBet } = GAMES[game].stakes;
  const unit = game === 'cash' ? `$${bigBet}` : `${bigBet} chips`;
  const lines = [
    `Bot results: BB/100 = big bets won per 100 hands (big bet ${unit}), with 95% confidence interval`,
    ...rows.map(({ seat, name, style, rate }) => {
      const ci =
        rate.lower === null || rate.upper === null
          ? 'n/a'
          : `${fixed(rate.lower)} to ${fixed(rate.upper)}`;
      return `Bot: ${name}, ${style}, seat ${seat}, ${rate.hands} hands, ${fixed(rate.bbPer100)} BB/100, 95% CI ${ci}`;
    }),
  ];
  return lines.map((line) => `${line}\n`).join('');
}
