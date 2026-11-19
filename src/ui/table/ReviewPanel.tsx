import type { ReviewEntry } from '../../table/review';
import { PlayingCard } from '../cards/PlayingCard';
import { useHeadingFocus } from '../useHeadingFocus';

export interface ReviewPanelProps {
  readonly handNumber: number;
  readonly entries: readonly ReviewEntry[];
  readonly onClose?: () => void;
}

/** The Hand Review panel (REQ-043): one graded entry per user decision, in order. */
export function ReviewPanel({ handNumber, entries, onClose }: ReviewPanelProps): React.JSX.Element {
  const heading = useHeadingFocus(true);
  return (
    <aside className="review-panel" aria-labelledby="review-heading">
      <div className="review-head">
        <h2 id="review-heading" ref={heading}>{`Hand #${handNumber} review`}</h2>
        <button type="button" className="review-close" aria-label="Close review" onClick={onClose}>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </div>
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
              <span data-part="grade" data-grade={entry.grade} className="grade-badge">
                {entry.gradeLabel}
              </span>
            </div>
            <p data-part="moves">
              <strong>You:</strong> <span data-part="you">{entry.userActionText}</span>
              {' · '}
              <strong>Advice:</strong> <span data-part="advice">{entry.adviceText}</span>
            </p>
          </li>
        ))}
      </ol>
    </aside>
  );
}
