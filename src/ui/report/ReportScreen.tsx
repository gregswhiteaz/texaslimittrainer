import { styleSection, type RangeLabel } from '../../stats/healthy-ranges';
import { sessionLeaks, type CategoryCount } from '../../stats/leaks';
import type { StyleCounts } from '../../stats/style-stats';
import { hintTile, rateTiles, reportView, type SessionReport } from '../../table/session-report';
import { useHeadingFocus } from '../useHeadingFocus';

const LABEL_KEYS: Readonly<Record<RangeLabel, string>> = {
  'in range': 'in-range',
  'too high': 'too-high',
  'too low': 'too-low',
  'not enough data': 'no-data',
};

/** The user's five style stats against the healthy ranges for the session's reference size (TASK-10.3). */
function StyleSection({
  players,
  counts,
}: {
  readonly players: number;
  readonly counts: StyleCounts;
}): React.JSX.Element {
  const { title, rows } = styleSection(players, counts);
  return (
    <section className="report-style" aria-labelledby="report-style-title">
      <h2 id="report-style-title">{title}</h2>
      <ul className="report-style-rows">
        {rows.map(({ key, name, value, range, label }) => (
          <li key={key} className="report-style-row" data-stat={key}>
            <span className="report-style-name">{name}</span>{' '}
            <span className="report-style-value">You {value}</span> ·{' '}
            <span className="report-style-range">healthy {range}</span> ·{' '}
            <strong className="report-style-label" data-label={LABEL_KEYS[label]}>
              {label}
            </strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The top 3 leaks among the stored counts, most costly first (TASK-10.8), or the no-leaks sentence. */
function LeaksSection({
  counts,
}: {
  readonly counts: readonly CategoryCount[];
}): React.JSX.Element {
  const leaks = sessionLeaks(counts);
  return (
    <section className="report-leaks" aria-labelledby="report-leaks-title">
      <h2 id="report-leaks-title">Biggest leaks this session</h2>
      {leaks.length === 0 ? (
        <p className="report-leaks-none">
          No leaks found this session (a leak needs 8+ spots with 40%+ errors).
        </p>
      ) : (
        <ul className="report-leak-list">
          {leaks.map(({ category, title, evidence, fix }) => (
            <li key={category} className="report-leak" data-category={category}>
              <strong className="report-leak-title">{title}</strong>
              <span className="report-leak-evidence">{evidence}</span>
              <span className="report-leak-fix">{fix}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** The Session Report of an ended session (A-7): header line, cash KPI tiles, the hands played and error-rate
 *  tiles and the hint-usage tile when the report has them, the style section when it has style counts, the leaks section when it
 *  has leak counts, and Back to Home (D-3). */
export function ReportScreen({
  report,
  onHome,
}: {
  readonly report: SessionReport;
  readonly onHome?: () => void;
}): React.JSX.Element {
  const heading = useHeadingFocus(true);
  const { header, tiles } = reportView(report);
  const rates = rateTiles(report);
  const hint = hintTile(report);
  return (
    <main className="screen report-screen">
      <header className="report-header">
        <h1 ref={heading}>Session report</h1>
        <p className="report-header-line">{header}</p>
      </header>
      {tiles.length > 0 && (
        <dl className="report-kpis" aria-label="Result">
          {tiles.map(({ key, label, value }) => (
            <div key={key} className="report-kpi" data-kpi={key}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {rates.length > 0 && (
        <dl className="report-kpis report-rates" aria-label="Volume and errors">
          {rates.map(({ key, label, value }) => (
            <div key={key} className="report-rate" data-rate={key}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
          {hint !== null && (
            <div className="report-hints" data-hints="hinted">
              <dt>{hint.label}</dt>
              <dd>{hint.value}</dd>
            </div>
          )}
        </dl>
      )}
      {report.style !== undefined && (
        <StyleSection players={report.players} counts={report.style} />
      )}
      {report.leakCounts !== undefined && <LeaksSection counts={report.leakCounts} />}
      <button type="button" className="report-home" onClick={onHome}>
        Back to Home
      </button>
    </main>
  );
}
