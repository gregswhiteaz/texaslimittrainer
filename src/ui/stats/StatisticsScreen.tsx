import {
  CHART_NOTE,
  CHART_TITLE,
  LOAD_FAILED_MESSAGE,
  NO_HANDS_MESSAGE,
  chartLabel,
  moreHandsMessage,
  pointLabel,
  type StatisticsView,
  type TrendPoint,
} from '../../stats/trends';
import { useHeadingFocus } from '../useHeadingFocus';

export interface StatisticsScreenProps {
  /** undefined while the read is pending (A-10); null if it failed (D-7). */
  readonly view: StatisticsView | undefined | null;
  readonly onHome: () => void;
}

const round = (n: number): number => Math.round(n * 10) / 10;

/** The storyboard's 400×160 plot: baseline y=150, top y=10 (A-9). */
function MajorErrorTrend({ points }: { readonly points: readonly TrendPoint[] }) {
  const yMax = Math.max(1, ...points.map((p) => p.majorPer100));
  const xy = points.map((p, i) => ({
    point: p,
    x: points.length === 1 ? 200 : round(10 + (i * 380) / (points.length - 1)),
    y: round(150 - (p.majorPer100 / yMax) * 140),
  }));
  return (
    <>
      <svg className="stats-trend" viewBox="0 0 400 160" role="img" aria-label={chartLabel(points)}>
        <line x1="0" y1="150" x2="400" y2="150" className="stats-baseline" />
        <polyline points={xy.map(({ x, y }) => `${x},${y}`).join(' ')} className="stats-line" />
        {xy.map(({ point, x, y }) => (
          <circle key={point.firstHand} data-point="" cx={x} cy={y} r="5" className="stats-dot">
            <title>{pointLabel(point)}</title>
          </circle>
        ))}
      </svg>
      <p className="stats-note">{CHART_NOTE}</p>
    </>
  );
}

export function StatisticsScreen({ view, onHome }: StatisticsScreenProps): React.JSX.Element {
  const heading = useHeadingFocus(true);
  const chart = view?.chart;
  return (
    <main className="screen stats-screen">
      <header className="stats-header">
        <button type="button" className="link-button" onClick={onHome}>
          ← Home
        </button>
        <h1 ref={heading}>Statistics</h1>
        {view && <p className="stats-totals">{view.totals}</p>}
      </header>
      <section
        className="panel stats-chart"
        aria-labelledby="stats-major-title"
        aria-busy={view === undefined ? true : undefined}
      >
        <h2 id="stats-major-title">{CHART_TITLE}</h2>
        {view === null && <p className="stats-message">{LOAD_FAILED_MESSAGE}</p>}
        {chart?.kind === 'no-hands' && <p className="stats-message">{NO_HANDS_MESSAGE}</p>}
        {chart?.kind === 'more-hands' && (
          <p className="stats-message">{moreHandsMessage(chart.needed)}</p>
        )}
        {chart?.kind === 'points' && <MajorErrorTrend points={chart.points} />}
      </section>
    </main>
  );
}
