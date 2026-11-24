import { reportView, type SessionReport } from '../../table/session-report';
import { useHeadingFocus } from '../useHeadingFocus';

/** The Session Report of an ended session (A-7): header line, cash KPI tiles and Back to Home (D-3). */
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
      <button type="button" className="report-home" onClick={onHome}>
        Back to Home
      </button>
    </main>
  );
}
