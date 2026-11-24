import { styleSection, type RangeLabel } from '../../stats/healthy-ranges';
import type { StyleCounts } from '../../stats/style-stats';
import { reportView, type SessionReport } from '../../table/session-report';
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

/** The Session Report of an ended session (A-7): header line, cash KPI tiles, the style section when the
 *  report has style counts, and Back to Home (D-3). */
export function ReportScreen({
  report,
  onHome,
}: {
  readonly report: SessionReport;
  readonly onHome?: () => void;
}): React.JSX.Element {
  const heading = useHeadingFocus(true);
  const { header, tiles } = reportView(report);
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
      {report.style !== undefined && (
        <StyleSection players={report.players} counts={report.style} />
      )}
      <button type="button" className="report-home" onClick={onHome}>
        Back to Home
      </button>
    </main>
  );
}
