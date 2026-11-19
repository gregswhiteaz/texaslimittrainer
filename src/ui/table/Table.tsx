import { useCallback, useEffect, useRef, useState } from 'react';
import type { Action } from '../../engine/hand';
import { userActionBar } from '../../table/action-bar';
import { handResultView, type HandResultView } from '../../table/hand-result';
import { opensReview, reviewEntries, type ReviewEntry } from '../../table/review';
import type { CompletedHand, TableState } from '../../table/session';
import { tableView, type SeatView } from '../../table/table-view';
import { CardBack, PlayingCard } from '../cards/PlayingCard';
import { ActionBar } from './ActionBar';
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
  /** Non-null while a reviewed hand is held (A-3). Optional: earlier callers render as before. */
  readonly review?: ReviewState | null;
  readonly onDealNext?: () => void;
  readonly onCloseReview?: () => void;
  readonly dealNextRef?: React.Ref<HTMLButtonElement>;
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
    </div>
  );
}

/** Presentational table (D-7): everything shown comes from tableView. */
export function TableView({
  table,
  onAct,
  onLeave,
  review = null,
  onDealNext,
  onCloseReview,
  dealNextRef,
}: TableViewProps): React.JSX.Element {
  const model = tableView(table);
  const bar = userActionBar(table);
  const result = handResultView(table);
  return (
    <>
      <header className="table-header">
        <p className="table-header-line">{model.header}</p>
        <button type="button" className="table-leave" onClick={onLeave}>
          Leave table
        </button>
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
                <p className="table-pot">{`Pot $${model.pot}`}</p>
              </div>
              <ul aria-label="Seats" className="table-seats">
                {model.seats.map((seat) => (
                  <Seat key={seat.seat} seat={seat} />
                ))}
              </ul>
            </div>
            {bar !== null && <ActionBar model={bar} onAct={onAct} />}
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
    </>
  );
}

export type TableProps = TableSessionOptions & { readonly onLeave?: () => void };

export function Table({
  onLeave = () => undefined,
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
    if (opensReview(hand)) setReview({ entries: reviewEntries(hand), open: true });
  }, []);
  const { table, act, dealNext } = useTableSession({
    ...options,
    onHandComplete,
    holdNextHand: holdNextHand || review !== null,
  });

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
      onAct={act}
      onLeave={onLeave}
      review={review}
      onDealNext={onDealNext}
      onCloseReview={closeReview}
      dealNextRef={dealNextButton}
    />
  );
}
