import type { ReviewSummary, ShownOpponent, StoredReviewEntry } from '../../table/review';
import { PlayingCard } from '../cards/PlayingCard';
import { useHeadingFocus } from '../useHeadingFocus';

export interface ReviewPanelProps {
  readonly handNumber: number;
  readonly entries: readonly StoredReviewEntry[];
  readonly onClose?: () => void;
  /** The header's result, cards, position and replay line (TASK-9.4); none without it. */
  readonly summary?: ReviewSummary | null;
  /** Opponents who showed at showdown (TASK-9.5); no list when empty. */
  readonly shown?: readonly ShownOpponent[];
}

/** The Hand Review panel (REQ-043): one graded entry per user decision, in order, read from the stored
 *  decisions; stored text is rendered as text only. */
export function ReviewPanel({
  handNumber,
  entries,
  onClose,
  summary = null,
  shown = [],
}: ReviewPanelProps): React.JSX.Element {
  const heading = useHeadingFocus(true);
  return (
    <aside className="review-panel" aria-labelledby="review-heading">
      <div className="review-head">
        <div className="review-title">
          <h2 id="review-heading" ref={heading}>{`Hand #${handNumber} review`}</h2>
          {summary !== null && (
            <>
              <div className="review-summary" data-part="summary">
                <span data-part="result">{summary.resultText}</span>
                {' · '}
                <span role="group" aria-label="Your hole cards" className="table-cards">
                  {summary.holeCards.map((card) => (
                    <PlayingCard key={card} card={card} />
                  ))}
                </span>
                {' · '}
                <span data-part="position">{summary.position}</span>
              </div>
              <p className="review-replay" data-part="replay">
                {`Hand #${summary.handNumber} · Replay code `}
                <span data-part="replay-code">{summary.replayCode}</span>
              </p>
            </>
          )}
        </div>
        <button type="button" className="review-close" aria-label="Close review" onClick={onClose}>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </div>
      {shown.length > 0 && (
        <ul aria-label="Shown at showdown" className="review-shown">
          {shown.map((o) => (
            <li key={o.seat} data-review-shown={o.seat}>
              <span data-part="review-shown-name">{`${o.name} showed`}</span>
              <span role="group" aria-label={`${o.name}'s shown cards`} className="table-cards">
                <PlayingCard card={o.holeCards[0]} />
                <PlayingCard card={o.holeCards[1]} />
              </span>
              <span aria-hidden="true"> · </span>
              <span data-part="review-shown-hand">{o.handName}</span>
            </li>
          ))}
        </ul>
      )}
      <ol aria-label="Decisions" className="review-entries">
        {entries.map((entry, i) => (
          <li key={i} data-entry={i + 1} data-street={entry.street} className="review-entry">
            <div className="review-entry-top">
              <span data-part="street">{entry.streetLabel}</span>
              {entry.board.length > 0 && (
                <div role="group" aria-label="Community cards" className="table-cards">
                  {entry.board.map((card) => (
                    <PlayingCard key={card} card={card} />
                  ))}
                </div>
              )}
              <span className="review-verdict">
                <span data-part="grade" data-grade={entry.grade} className="grade-badge">
                  {entry.gradeLabel}
                </span>
                {entry.decision.hinted && (
                  <span data-part="hinted" className="hinted-tag">
                    hinted
                  </span>
                )}
              </span>
            </div>
            <p data-part="moves">
              <strong>You:</strong> <span data-part="you">{entry.userActionText}</span>
              {' · '}
              <strong>Advice:</strong> <span data-part="advice">{entry.adviceText}</span>
            </p>
            {entry.chartBasis !== null && <p data-part="chart">{entry.chartBasis}</p>}
            {entry.equity !== null && entry.requiredEquity !== null && (
              <p className="review-numbers">
                <span data-part="equity">{`Equity ${entry.equity}`}</span>
                <span data-part="required">{`Required equity ${entry.requiredEquity}`}</span>
              </p>
            )}
            <p data-part="explanation">{entry.explanation}</p>
            {entry.opponents.length > 0 && (
              <ul aria-label="Opponent ranges" className="review-opponents">
                {entry.opponents.map((o) => (
                  <li key={o.seat} data-opponent={o.seat}>{`${o.name}: ${o.basis}`}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </aside>
  );
}
