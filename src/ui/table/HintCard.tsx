import type { HintCardView } from '../../table/hint';

export type HintStatus = 'loading' | 'ready' | 'error';

export interface HintCardProps {
  readonly status: HintStatus;
  /** Non-null when status is 'ready'. */
  readonly card: HintCardView | null;
}

/** The hint card between the table and the action row (A-10); text only, React-escaped. */
export function HintCard({ status, card }: HintCardProps): React.JSX.Element {
  return (
    <section
      id="hint-card"
      aria-label="Hint"
      aria-live="polite"
      aria-busy={status === 'loading'}
      className="hint-card"
    >
      <h2 className="hint-card-title">Hint</h2>
      {status === 'loading' && <p data-part="hint-status">Working out the hint…</p>}
      {status === 'error' && (
        <p data-part="hint-status">The hint could not be worked out. Select Hint to try again.</p>
      )}
      {status === 'ready' && card !== null && (
        <>
          <p data-part="hint-action">{`Recommended: ${card.action}`}</p>
          {card.chartBasis !== null && <p data-part="hint-chart">{card.chartBasis}</p>}
          {card.equity !== null && card.requiredEquity !== null && (
            <p className="hint-numbers">
              <span data-part="hint-equity">{`Equity ${card.equity}`}</span>
              <span data-part="hint-required">{`Required equity ${card.requiredEquity}`}</span>
            </p>
          )}
          <p data-part="hint-explanation">{card.explanation}</p>
          <ul aria-label="Opponent ranges">
            {card.opponents.map((o) => (
              <li key={o.seat} data-seat={o.seat}>{`${o.name}: ${o.basis}`}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
