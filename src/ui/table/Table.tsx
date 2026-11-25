import { useCallback, useEffect, useRef, useState } from 'react';
import type { Action } from '../../engine/hand';
import { userActionBar } from '../../table/action-bar';
import { handResultView, type HandResultView } from '../../table/hand-result';
import {
  hintArrived,
  hintCard,
  hintFailed,
  hintedAt,
  NO_HINT,
  requestHint,
  shownHint,
  toggleHint,
  type HintCardView,
} from '../../table/hint';
import type { HandRecordDecision } from '../../table/hand-record';
import {
  afterHandReview,
  reviewBadge as summaryBadge,
  reviewSummary,
  shownOpponents,
  storedReviewEntries,
  type ReviewBadge,
  type ReviewSummary,
  type ShownOpponent,
  type StoredReviewEntry,
} from '../../table/review';
import {
  buyIn,
  completedHand,
  handInProgress,
  userBusted,
  type CompletedHand,
  type TableState,
} from '../../table/session';
import { tableView, type SeatView } from '../../table/table-view';
import { playerView } from '../../engine/player-view';
import {
  sharedAdviceClient,
  createAdviceWorker as createProductionWorker,
} from '../advice/advice-client';
import { CardBack, PlayingCard } from '../cards/PlayingCard';
import { ActionBar } from './ActionBar';
import { BustDialog } from './BustDialog';
import { HintCard, type HintStatus } from './HintCard';
import { LeaveDialog } from './LeaveDialog';
import { ReviewPanel } from './ReviewPanel';
import { useTableSession, type TableSessionOptions } from './useTableSession';

export interface ReviewState {
  /** null while the hand's grades are still being worked out (A-2): no panel is shown yet. */
  readonly entries: readonly StoredReviewEntry[] | null;
  readonly open: boolean;
}

/** The review held for `hand`, the hand just played. */
export interface HeldReview extends ReviewState {
  readonly hand: CompletedHand;
}

/** `review` with `entries` iff it is still held for `hand`; else unchanged (a late result is ignored). */
export function reviewGraded(
  review: HeldReview | null,
  hand: CompletedHand,
  entries: readonly StoredReviewEntry[],
): HeldReview | null {
  return review?.hand === hand ? { ...review, entries } : review;
}

export interface TableViewProps {
  readonly table: TableState;
  readonly onAct: (action: Action) => void;
  readonly onLeave: () => void;
  /** Pauses to Home (REQ-004.9). The Home button is rendered only when given (A-6). */
  readonly onHome?: () => void;
  /** Non-null while a reviewed hand is held (A-3). Optional: earlier callers render as before. */
  readonly review?: ReviewState | null;
  readonly onDealNext?: () => void;
  readonly onCloseReview?: () => void;
  readonly dealNextRef?: React.Ref<HTMLButtonElement>;
  /** Rebuy in the bust dialog (REQ-007.2). */
  readonly onRebuy?: () => void;
  /** The hint shown above the action row; null or absent while closed (TASK-8.1). */
  readonly hint?: { readonly status: HintStatus; readonly card: HintCardView | null } | null;
  /** Hint / Hide hint. */
  readonly onHint?: () => void;
  /** The grade summary badge (auto-open off, TASK-9.7); shown only after the result with no held review. */
  readonly reviewBadge?: ReviewBadge | null;
  /** Opens the review from the badge. */
  readonly onOpenReview?: () => void;
  /** Non-null while the Leave-now dialog is open (TASK-10.2). */
  readonly leavePrompt?: { readonly onConfirm: () => void; readonly onCancel: () => void } | null;
  /** A-4: header Home and Leave table disabled; no bust dialog, review panel, badge or Deal next. */
  readonly leaving?: boolean;
  readonly leaveRef?: React.Ref<HTMLButtonElement>;
  /** REQ-050.3: style labels on bot seats (default on). */
  readonly showOpponentStyles?: boolean;
}

function SeatMarkers({ seat }: { readonly seat: SeatView }): React.JSX.Element {
  return (
    <>
      {seat.streetAmount > 0 && (
        <span data-part="street">{`This street $${seat.streetAmount}`}</span>
      )}
      {seat.action !== null && <span data-part="action">{seat.action}</span>}
      {seat.toAct && <span data-part="to-act">To act</span>}
      {seat.isButton && (
        <span data-part="dealer" className="dealer-button">
          <span aria-hidden="true">D</span>
          <span className="visually-hidden">Dealer button</span>
        </span>
      )}
    </>
  );
}

function Seat({
  seat,
  showStyle,
}: {
  readonly seat: SeatView;
  readonly showStyle: boolean;
}): React.JSX.Element {
  const className = `seat${seat.isUser ? ' seat-user' : ''}${seat.toAct ? ' seat-to-act' : ''}`;
  const style =
    seat.slot === null ? undefined : { left: `${seat.slot.left}%`, top: `${seat.slot.top}%` };
  if (seat.isUser) {
    return (
      <li data-seat={seat.seat} data-user="" className={className}>
        <span data-part="name">{seat.name}</span>
        <span aria-hidden="true"> · </span>
        <span data-part="position">{seat.position}</span>
        <span className="seat-line">
          Stack <span data-part="stack">{`$${seat.stack}`}</span>
        </span>
        <SeatMarkers seat={seat} />
        {seat.holeCards !== null && (
          <div role="group" aria-label="Your cards" className="table-cards">
            <PlayingCard card={seat.holeCards[0]} />
            <PlayingCard card={seat.holeCards[1]} />
          </div>
        )}
      </li>
    );
  }
  return (
    <li data-seat={seat.seat} className={className} style={style}>
      <span data-part="name">{seat.name}</span>
      <span className="seat-line">
        {showStyle && (
          <>
            <span data-part="style">{seat.style}</span>
            {' · '}
          </>
        )}
        <span data-part="stack">{`$${seat.stack}`}</span>
      </span>
      <SeatMarkers seat={seat} />
      {seat.holdsCards && <CardBack size="small" />}
    </li>
  );
}

function HandResult({ result }: { readonly result: HandResultView }): React.JSX.Element {
  return (
    <div role="status" className="hand-result">
      <p className="hand-result-title">Hand over</p>
      {result.pots !== undefined && (
        <ul aria-label="Pot winners">
          {result.pots.map((p) => (
            <li key={p.pot} data-pot={p.pot}>
              <span data-part="pot">{`${p.label} $${p.amount}`}</span>
              <span aria-hidden="true"> · </span>
              <span data-part="pot-winners">{p.winners.map((w) => w.text).join(', ')}</span>
            </li>
          ))}
        </ul>
      )}
      <ul aria-label="Winners">
        {result.winners.map((winner) => (
          <li key={winner.seat} data-seat={winner.seat}>
            <span data-part="winner">{winner.text}</span>
            {winner.handName !== null && (
              <>
                <span aria-hidden="true"> · </span>
                <span data-part="hand-name">{winner.handName}</span>
              </>
            )}
            {winner.holeCards !== null && (
              <div
                role="group"
                aria-label={winner.isUser ? 'Your shown cards' : `${winner.name}'s cards`}
                className="table-cards"
              >
                <PlayingCard card={winner.holeCards[0]} />
                <PlayingCard card={winner.holeCards[1]} />
              </div>
            )}
          </li>
        ))}
      </ul>
      {result.shown.length > 0 && (
        <ul aria-label="Shown hands">
          {result.shown.map((hand) => (
            <li key={hand.seat} data-shown-seat={hand.seat}>
              <span data-part="shown">{hand.text}</span>
              <span aria-hidden="true"> · </span>
              <span data-part="hand-name">{hand.handName}</span>
              <div
                role="group"
                aria-label={hand.isUser ? 'Your shown cards' : `${hand.name}'s cards`}
                className="table-cards"
              >
                <PlayingCard card={hand.holeCards[0]} />
                <PlayingCard card={hand.holeCards[1]} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The review header's summary (TASK-9.4) and the opponents shown at showdown (TASK-9.5) of the table's
 *  finished hand; no summary and no shown hands before the hand has a result. */
function reviewHeader(table: TableState): {
  summary: ReviewSummary | null;
  shown: readonly ShownOpponent[];
} {
  const hand = completedHand(table);
  return hand === null
    ? { summary: null, shown: [] }
    : { summary: reviewSummary(hand, table.handNumber), shown: shownOpponents(hand) };
}

/** Presentational table (D-7): everything shown comes from tableView. */
export function TableView({
  table,
  onAct,
  onLeave,
  onHome,
  review = null,
  onDealNext,
  onCloseReview,
  dealNextRef,
  onRebuy,
  hint = null,
  onHint,
  reviewBadge = null,
  onOpenReview,
  leavePrompt = null,
  leaving = false,
  leaveRef,
  showOpponentStyles = true,
}: TableViewProps): React.JSX.Element {
  const model = tableView(table);
  const bar = userActionBar(table);
  const result = handResultView(table);
  return (
    <>
      <header className="table-header">
        <p className="table-header-line">{model.header}</p>
        <div className="table-header-actions">
          {onHome && (
            <button type="button" className="table-home" disabled={leaving} onClick={onHome}>
              Home
            </button>
          )}
          <button
            ref={leaveRef}
            type="button"
            className="table-leave"
            disabled={leaving}
            onClick={onLeave}
          >
            Leave table
          </button>
        </div>
      </header>
      <div className="table-layout">
        <div className="table-main">
          <section
            aria-label="Table"
            className="table"
            data-street={model.street ?? ''}
            data-action-count={model.actionCount}
          >
            <div className="table-ring">
              <div className="table-felt">
                <div role="group" aria-label="Board" className="table-cards table-board">
                  {model.board.map((card) => (
                    <PlayingCard key={card} card={card} />
                  ))}
                  {Array.from({ length: model.placeholders }, (_, i) => (
                    <span key={i} className="board-slot" aria-hidden="true" />
                  ))}
                </div>
                {model.pots.length === 0 ? (
                  <p className="table-pot">{`Pot $${model.pot}`}</p>
                ) : (
                  <ul aria-label="Pots" className="table-pots">
                    {model.pots.map((line) => (
                      <li key={line.pot} data-pot={line.pot}>
                        {line.text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <ul aria-label="Seats" className="table-seats">
                {model.seats.map((seat) => (
                  <Seat key={seat.seat} seat={seat} showStyle={showOpponentStyles} />
                ))}
              </ul>
            </div>
            {hint !== null && <HintCard status={hint.status} card={hint.card} />}
            {bar !== null && (
              <div className="action-row">
                <ActionBar model={bar} onAct={onAct} />
                <button
                  type="button"
                  className="hint-toggle"
                  aria-expanded={hint !== null}
                  aria-controls="hint-card"
                  disabled={!bar.enabled}
                  onClick={onHint}
                >
                  {hint === null ? 'Hint' : 'Hide hint'}
                </button>
              </div>
            )}
            {result !== null && <HandResult result={result} />}
          </section>
          {!leaving && review !== null && result !== null && (
            <button type="button" className="deal-next" ref={dealNextRef} onClick={onDealNext}>
              {userBusted(table) ? 'Continue' : 'Deal next hand'}
            </button>
          )}
          {!leaving && reviewBadge !== null && review === null && result !== null && (
            <button
              type="button"
              className="review-badge"
              data-worst={reviewBadge.worst}
              aria-label={reviewBadge.label}
              onClick={onOpenReview}
            >
              {reviewBadge.text}
            </button>
          )}
        </div>
        {!leaving && review?.open === true && review.entries !== null && (
          <ReviewPanel
            handNumber={table.handNumber}
            entries={review.entries}
            onClose={onCloseReview}
            {...reviewHeader(table)}
          />
        )}
      </div>
      {/* Not over a held review (A-3); Continue clears it and the dialog opens (TASK-9.2). */}
      {!leaving && table.config.gameType === 'cash' && userBusted(table) && review === null && (
        <BustDialog amount={buyIn(table.config.stake)} onRebuy={onRebuy} onLeave={onLeave} />
      )}
      {leavePrompt !== null && (
        <LeaveDialog onConfirm={leavePrompt.onConfirm} onCancel={leavePrompt.onCancel} />
      )}
    </>
  );
}

export type TableProps = TableSessionOptions & {
  /** Leave table (header and bust dialog), with the session's id. */
  readonly onLeave?: (sessionId: string) => void;
  readonly onHome?: () => void;
  /** Open the review by itself after a reviewed hand (REQ-050.2, default on); off shows a badge instead. */
  readonly autoOpenReview?: boolean;
  /** REQ-050.3: style labels on bot seats (default on). */
  readonly showOpponentStyles?: boolean;
};

/** The badge's hand and its stored entries (null until graded). */
interface BadgeState {
  readonly hand: CompletedHand;
  readonly entries: readonly StoredReviewEntry[] | null;
}

export function Table({
  onLeave = () => undefined,
  onHome,
  onHandComplete: external,
  holdNextHand = false,
  autoOpenReview = true,
  showOpponentStyles = true,
  ...options
}: TableProps): React.JSX.Element {
  const [review, setReview] = useState<HeldReview | null>(null);
  const [badge, setBadge] = useState<BadgeState | null>(null);
  // Read through refs so onHandComplete stays stable and never restarts the next-hand timer.
  const externalRef = useRef(external);
  const autoOpenRef = useRef(autoOpenReview);
  useEffect(() => {
    externalRef.current = external;
    autoOpenRef.current = autoOpenReview;
  }, [external, autoOpenReview]);
  const onHandComplete = useCallback((hand: CompletedHand) => {
    externalRef.current?.(hand);
    const mode = afterHandReview(hand, autoOpenRef.current);
    if (mode === 'panel') setReview({ hand, entries: null, open: true });
    setBadge(mode === 'badge' ? { hand, entries: null } : null);
  }, []);
  const onHandGraded = useCallback(
    (hand: CompletedHand, decisions: readonly HandRecordDecision[]) => {
      const entries = storedReviewEntries(hand, decisions);
      setReview((r) => reviewGraded(r, hand, entries));
      setBadge((b) => (b?.hand === hand ? { ...b, entries } : b));
    },
    [],
  );
  const [prompting, setPrompting] = useState(false);
  const { table, sessionId, observedCounts, act, dealNext, rebuy, leaving, leave } =
    useTableSession({
      ...options,
      onHandComplete,
      onHandGraded,
      holdNextHand: holdNextHand || review !== null,
      paused: prompting,
      onLeft: () => onLeave(sessionId),
    });

  const [hint, setHint] = useState(NO_HINT);
  const { createAdviceWorker = createProductionWorker } = options;
  const onHint = useCallback(() => {
    const decision = table.hand;
    if (decision === null) return;
    const toggled = toggleHint(hint, decision);
    setHint(toggled.state);
    if (!toggled.request) return;
    const view = playerView(decision, table.config.userSeat);
    // Never throws synchronously: a failure creating the worker rejects like any advice failure (A-6).
    Promise.resolve()
      .then(() => requestHint(sharedAdviceClient(createAdviceWorker), table, observedCounts()))
      .then(
        (rec) => setHint((s) => hintArrived(s, decision, hintCard(rec, view, table))),
        (error: unknown) => {
          console.error('Hint could not be worked out', error);
          setHint((s) => hintFailed(s, decision));
        },
      );
  }, [hint, table, observedCounts, createAdviceWorker]);
  const onAct = useCallback(
    (action: Action) => {
      const hinted = hintedAt(hint, table.hand);
      setHint(NO_HINT);
      act(action, hinted);
    },
    [act, hint, table.hand],
  );
  const bar = userActionBar(table);
  const status = shownHint(hint, table.hand, bar?.enabled === true);

  const dealNextButton = useRef<HTMLButtonElement>(null);
  // Deal next hand (Continue on a bust) is already on screen while the review is held, so focus can move
  // before Close unmounts.
  const closeReview = useCallback(() => {
    setReview((r) => r && { ...r, open: false });
    dealNextButton.current?.focus();
  }, []);
  const onDealNext = useCallback(() => {
    setReview(null);
    setBadge(null);
    dealNext();
  }, [dealNext]);
  // The badge never outlives its hand (A-6): cleared while rendering the next hand number.
  const [badgeHandNumber, setBadgeHandNumber] = useState(table.handNumber);
  if (badgeHandNumber !== table.handNumber) {
    setBadgeHandNumber(table.handNumber);
    setBadge(null);
  }
  const openReview = useCallback(() => {
    if (badge === null || badge.entries === null) return;
    setReview({ hand: badge.hand, entries: badge.entries, open: true });
    setBadge(null);
  }, [badge]);

  const leaveButton = useRef<HTMLButtonElement>(null);
  // A-1, A-7: a hand in progress (as last rendered) asks first; between hands Leave table leaves at once.
  const onLeaveClick = (): void => {
    if (leaving) return;
    if (handInProgress(table)) setPrompting(true);
    else onLeave(sessionId);
  };
  const leavePrompt = prompting
    ? {
        onConfirm: () => {
          setPrompting(false);
          leave();
        },
        onCancel: () => {
          setPrompting(false);
          // WebKit does not focus a clicked button, so focus is set here (A-3).
          leaveButton.current?.focus();
        },
      }
    : null;

  return (
    <TableView
      table={table}
      onAct={onAct}
      onLeave={onLeaveClick}
      onHome={onHome}
      review={review}
      onDealNext={onDealNext}
      onCloseReview={closeReview}
      dealNextRef={dealNextButton}
      onRebuy={rebuy}
      hint={status === 'none' ? null : { status, card: hint.card }}
      onHint={onHint}
      reviewBadge={badge?.entries ? summaryBadge(badge.entries.map((e) => e.grade)) : null}
      onOpenReview={openReview}
      leavePrompt={leavePrompt}
      leaving={leaving}
      leaveRef={leaveButton}
      showOpponentStyles={showOpponentStyles}
    />
  );
}
