import { useCallback, useEffect, useRef, useState } from 'react';
import type { Action } from '../../engine/hand';
import { userActionBar } from '../../table/action-bar';
import { handResultView, type HandResultView } from '../../table/hand-result';
import {
  hintArrived,
  hintCard,
  hintFailed,
  NO_HINT,
  requestHint,
  shownHint,
  toggleHint,
  type HintCardView,
} from '../../table/hint';
import { opensReview, userReviewEntries, type ReviewEntry } from '../../table/review';
import { buyIn, userBusted, type CompletedHand, type TableState } from '../../table/session';
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
import { ReviewPanel } from './ReviewPanel';
import { useTableSession, type TableSessionOptions } from './useTableSession';

export interface ReviewState {
  readonly entries: readonly ReviewEntry[];
  readonly open: boolean;
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

function Seat({ seat }: { readonly seat: SeatView }): React.JSX.Element {
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
        <span data-part="style">{seat.style}</span>
        {' · '}
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
            <button type="button" className="table-home" onClick={onHome}>
              Home
            </button>
          )}
          <button type="button" className="table-leave" onClick={onLeave}>
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
                  <Seat key={seat.seat} seat={seat} />
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
          {review !== null && result !== null && (
            <button type="button" className="deal-next" ref={dealNextRef} onClick={onDealNext}>
              Deal next hand
            </button>
          )}
        </div>
        {review?.open === true && (
          <ReviewPanel
            handNumber={table.handNumber}
            entries={review.entries}
            onClose={onCloseReview}
          />
        )}
      </div>
      {/* Not over a held review (A-3); Deal next hand clears it and the dialog opens. */}
      {table.config.gameType === 'cash' && userBusted(table) && review === null && (
        <BustDialog amount={buyIn(table.config.stake)} onRebuy={onRebuy} onLeave={onLeave} />
      )}
    </>
  );
}

export type TableProps = TableSessionOptions & {
  readonly onLeave?: () => void;
  readonly onHome?: () => void;
};

export function Table({
  onLeave = () => undefined,
  onHome,
  onHandComplete: external,
  holdNextHand = false,
  ...options
}: TableProps): React.JSX.Element {
  const [review, setReview] = useState<ReviewState | null>(null);
  // Read through a ref so onHandComplete stays stable and never restarts the next-hand timer.
  const externalRef = useRef(external);
  useEffect(() => {
    externalRef.current = external;
  }, [external]);
  const onHandComplete = useCallback((hand: CompletedHand) => {
    externalRef.current?.(hand);
    if (opensReview(hand)) setReview({ entries: userReviewEntries(hand), open: true });
  }, []);
  const { table, observedCounts, act, dealNext, rebuy } = useTableSession({
    ...options,
    onHandComplete,
    holdNextHand: holdNextHand || review !== null,
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
      setHint(NO_HINT);
      act(action);
    },
    [act],
  );
  const bar = userActionBar(table);
  const status = shownHint(hint, table.hand, bar?.enabled === true);

  const dealNextButton = useRef<HTMLButtonElement>(null);
  // Deal next hand is already on screen while the review is held, so focus can move before Close unmounts.
  const closeReview = useCallback(() => {
    setReview((r) => r && { ...r, open: false });
    dealNextButton.current?.focus();
  }, []);
  const onDealNext = useCallback(() => {
    setReview(null);
    dealNext();
  }, [dealNext]);

  return (
    <TableView
      table={table}
      onAct={onAct}
      onLeave={onLeave}
      onHome={onHome}
      review={review}
      onDealNext={onDealNext}
      onCloseReview={closeReview}
      dealNextRef={dealNextButton}
      onRebuy={rebuy}
      hint={status === 'none' ? null : { status, card: hint.card }}
      onHint={onHint}
    />
  );
}
