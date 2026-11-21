import type { Card } from '../engine/cards';
import type { ActionRecord, SeatNumber, Street } from '../engine/hand';
import { playerView, type PlayerView } from '../engine/player-view';
import type { BotStyle, GameType, SessionConfig, TableState } from './session';

export interface SeatView {
  readonly seat: SeatNumber;
  readonly name: string;
  readonly isUser: boolean;
  /** Null for the user. */
  readonly style: BotStyle | null;
  /** Chips behind. */
  readonly stack: number;
  /** streetContribution; 0 before the deal. */
  readonly streetAmount: number;
  /** Action-line text; null = no line. */
  readonly action: string | null;
  /** Bot only: hand dealt and not folded. */
  readonly holdsCards: boolean;
  readonly isButton: boolean;
  readonly toAct: boolean;
  /** User only (A-2). */
  readonly position: string | null;
  /** User only, after the deal. */
  readonly holeCards: readonly [Card, Card] | null;
  /** Null for the user (bottom centre); else percentages inside the table ring. */
  readonly slot: { readonly left: number; readonly top: number } | null;
}
export interface PotLineView {
  /** Index into PlayerView.pots (0 = main pot). */
  readonly pot: number;
  /** "Main pot" | "Side pot" | "Side pot 1", "Side pot 2", … (Q-1). */
  readonly label: string;
  readonly amount: number;
  /** `${label} $${amount}`, e.g. "Main pot $60". */
  readonly text: string;
}
export interface TableViewModel {
  /** "Cash · 6 players · $4/$8 · Hand #1" */
  readonly header: string;
  /** Bots ascending by seat, then the user. */
  readonly seats: readonly SeatView[];
  readonly board: readonly Card[];
  /** 5 - board.length */
  readonly placeholders: number;
  /** A-4 */
  readonly pot: number;
  /** REQ-021.5: one line per pot while side pots exist; [] = show the single `pot` total. */
  readonly pots: readonly PotLineView[];
  readonly street: Street | null;
  readonly actionCount: number;
  readonly handOver: boolean;
}

const GAME_LABEL: Record<GameType, string> = { cash: 'Cash' };

export function headerText(config: SessionConfig, handNumber: number): string {
  const { stake } = config;
  return `${GAME_LABEL[config.gameType]} · ${config.players} players · $${stake.smallBet}/$${stake.bigBet} · Hand #${handNumber}`;
}

/** Past-tense text of one action record (D-3/Q-2). */
export function lastActionText(record: ActionRecord): string {
  switch (record.type) {
    case 'small-blind':
      return `Small blind $${record.amount}`;
    case 'big-blind':
      return `Big blind $${record.amount}`;
    case 'fold':
      return 'Folded';
    case 'check':
      return 'Checked';
    case 'call':
      return `Called $${record.amount}`;
    case 'bet':
      return `Bet $${record.amount}`;
    case 'raise':
      return `Raised to $${record.amount}`;
  }
}

function indexAt(seat: SeatNumber, seats: readonly SeatNumber[]): number {
  const index = seats.indexOf(seat);
  if (index < 0) throw new RangeError(`Seat ${seat} is not at the table`);
  return index;
}

/** Position name of `seat` (A-2); `seats` ascending. */
export function positionName(
  seat: SeatNumber,
  seats: readonly SeatNumber[],
  button: SeatNumber,
): string {
  indexAt(seat, seats);
  const b = indexAt(button, seats);
  // Clockwise from the small blind; the button is last.
  const order = [...seats.slice(b + 1), ...seats.slice(0, b + 1)];
  const n = order.length;
  const names = new Map<SeatNumber, string>();
  const name = (index: number, text: string): void => {
    const s = order[index];
    if (s !== undefined && !names.has(s)) names.set(s, text);
  };
  name(n - 1, 'Button');
  name(0, 'Small blind');
  name(1, 'Big blind');
  name(n - 2, 'Cutoff');
  name(n - 3, 'Hijack');
  let early = 0;
  for (let i = 2; i < n; i++) {
    name(i, early === 0 ? 'Under the gun' : `Under the gun +${early}`);
    early++;
  }
  return names.get(seat) as string;
}

/** 0 = the user; k = k-th seat clockwise after the user in ascending seat order. */
export function seatSlot(
  seat: SeatNumber,
  seats: readonly SeatNumber[],
  userSeat: SeatNumber,
): number {
  const n = seats.length;
  return (indexAt(seat, seats) - indexAt(userSeat, seats) + n) % n;
}

const round1 = (value: number): number => Math.round(value * 10) / 10;

/** Centre of slot `slot` of `count` on an ellipse; slot 0 is the bottom, then clockwise on screen. */
export function slotPosition(slot: number, count: number): { left: number; top: number } {
  const angle = ((90 + (slot * 360) / count) * Math.PI) / 180;
  return { left: round1(50 + 40 * Math.cos(angle)), top: round1(50 + 42 * Math.sin(angle)) };
}

/** Collected pots plus this street's bets (A-4). */
export function potTotal(view: PlayerView | null): number {
  if (view === null) return 0;
  const pots = view.pots.reduce((sum, pot) => sum + pot.amount, 0);
  return view.players.reduce((sum, p) => sum + p.streetContribution, pots);
}

/** Pot labels for `count` pots: index 0 "Main pot"; one side pot "Side pot"; several "Side pot k". */
export function potLabel(index: number, count: number): string {
  if (index === 0) return 'Main pot';
  return count === 2 ? 'Side pot' : `Side pot ${index}`;
}

/** [] unless view has ≥ 2 pots and the hand is not over (A-1, A-2); street bets go to the last line (D-3). */
export function potLines(view: PlayerView | null, handOver: boolean): PotLineView[] {
  if (view === null || handOver || view.pots.length < 2) return [];
  const bets = view.players.reduce((sum, p) => sum + p.streetContribution, 0);
  const last = view.pots.length - 1;
  return view.pots.map((pot, k): PotLineView => {
    const label = potLabel(k, view.pots.length);
    const amount = pot.amount + (k === last ? bets : 0);
    return { pot: k, label, amount, text: `${label} $${amount}` };
  });
}

function actionLine(view: PlayerView, seat: SeatNumber, handOver: boolean): string | null {
  if (view.players.find((p) => p.seat === seat)?.folded === true) return 'Folded';
  const line = view.street === 'showdown' ? 'river' : view.street;
  const last = view.actions.filter((a) => a.seat === seat && a.street === line).at(-1);
  if (last !== undefined) return lastActionText(last);
  if (handOver || view.toAct === seat) return null;
  return 'Waiting';
}

/** The table as the user may see it. Reads the hand only through the user's PlayerView (D-1). */
export function tableView(table: TableState): TableViewModel {
  const { config } = table;
  const view = table.hand === null ? null : playerView(table.hand, config.userSeat);
  const handOver = view !== null && view.toAct === null;
  const button = view?.button ?? table.button;
  const seatNumbers = (view?.players ?? config.seats).map((p) => p.seat);
  const ordered = [
    ...table.seats.filter((s) => s.kind === 'bot'),
    ...table.seats.filter((s) => s.kind === 'user'),
  ];
  const stackBefore = (seat: SeatNumber): number => {
    const entry = table.stacks.find((p) => p.seat === seat);
    if (entry === undefined) throw new RangeError(`Seat ${seat} has no stack`);
    return entry.stack;
  };

  const seats = ordered.map((s): SeatView => {
    const isUser = s.kind === 'user';
    const player = view?.players.find((p) => p.seat === s.seat);
    return {
      seat: s.seat,
      name: s.name,
      isUser,
      style: isUser ? null : s.style,
      stack: player === undefined ? stackBefore(s.seat) : player.stack,
      streetAmount: player?.streetContribution ?? 0,
      action: view === null ? null : actionLine(view, s.seat, handOver),
      holdsCards: !isUser && player !== undefined && !player.folded,
      isButton: s.seat === button,
      toAct: view !== null && view.toAct === s.seat,
      position: isUser ? positionName(s.seat, seatNumbers, button) : null,
      holeCards: isUser && view !== null ? view.holeCards : null,
      slot: isUser
        ? null
        : slotPosition(seatSlot(s.seat, seatNumbers, config.userSeat), seatNumbers.length),
    };
  });

  const board = view?.board ?? [];
  return {
    header: headerText(config, table.handNumber),
    seats,
    board,
    placeholders: 5 - board.length,
    pot: potTotal(view),
    pots: potLines(view, handOver),
    street: view?.street ?? null,
    actionCount: view?.actions.length ?? 0,
    handOver,
  };
}
