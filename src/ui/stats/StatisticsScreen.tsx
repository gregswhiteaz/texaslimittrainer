import {
  ALL_TRENDS,
  BB100_GOAL,
  BB100_NOTE,
  BB100_TITLE,
  CHART_NOTE,
  CHART_TITLE,
  G2_CAPTION,
  GAME_TYPE_LABEL,
  GAME_TYPE_OPTIONS,
  LOAD_FAILED_MESSAGE,
  NO_CASH_MESSAGE,
  NO_HANDS_MESSAGE,
  TABLE_SIZE_LABEL,
  TABLE_SIZE_OPTIONS,
  bb100ChartLabel,
  bb100PointLabel,
  chartLabel,
  moreCashHandsMessage,
  moreHandsMessage,
  pointLabel,
  type Bb100Point,
  type GameTypeFilter,
  type StatisticsView,
  type TableSizeFilter,
  type TrendFilter,
  type TrendPoint,
} from '../../stats/trends';
import { useHeadingFocus } from '../useHeadingFocus';

export interface StatisticsScreenProps {
  /** undefined while the read is pending (A-10); null if it failed (D-7). */
  readonly view: StatisticsView | undefined | null;
  readonly onHome: () => void;
  /** The applied filter (TASK-11.4); All / All by default. */
  readonly filter?: TrendFilter;
  readonly onFilterChange?: (filter: TrendFilter) => void;
}

const round = (n: number): number => Math.round(n * 10) / 10;

/** Point i of `count` across the plot: x 10…390, or the middle for a single point (A-9). */
const xOf = (i: number, count: number): number =>
  count === 1 ? 200 : round(10 + (i * 380) / (count - 1));

/** The storyboard's 400×160 plot: baseline y=150, top y=10 (A-9). A non-null G-2 target adds a caption and a
 *  dashed line, kept inside the plot (TASK-11.3 A-4). */
function MajorErrorTrend({
  points,
  target,
}: {
  readonly points: readonly TrendPoint[];
  readonly target: number | null;
}) {
  const yMax = Math.max(1, ...points.map((p) => p.majorPer100), target ?? 0);
  const xy = points.map((p, i) => ({
    point: p,
    x: xOf(i, points.length),
    y: round(150 - (p.majorPer100 / yMax) * 140),
  }));
  const ty = target === null ? null : round(150 - (target / yMax) * 140);
  return (
    <>
      {target !== null && <p className="stats-goal">{G2_CAPTION}</p>}
      <svg
        className="stats-trend"
        viewBox="0 0 400 160"
        role="img"
        aria-label={chartLabel(points, target)}
      >
        <line x1="0" y1="150" x2="400" y2="150" className="stats-baseline" />
        {ty !== null && (
          <line x1="0" y1={ty} x2="400" y2={ty} strokeDasharray="6 5" className="stats-target" />
        )}
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

/** The same plot with 0 kept inside it: hi = max(1, values), lo = min(−1, values), and a dashed break-even
 *  line at 0 (TASK-11.2 A-5). */
function Bb100Trend({ points }: { readonly points: readonly Bb100Point[] }) {
  const hi = Math.max(1, ...points.map((p) => p.bb100));
  const lo = Math.min(-1, ...points.map((p) => p.bb100));
  const yOf = (v: number): number => round(150 - ((v - lo) / (hi - lo)) * 140);
  const xy = points.map((p, i) => ({ point: p, x: xOf(i, points.length), y: yOf(p.bb100) }));
  const zero = yOf(0);
  return (
    <>
      <p className="stats-goal">{BB100_GOAL}</p>
      <svg
        className="stats-trend"
        viewBox="0 0 400 160"
        role="img"
        aria-label={bb100ChartLabel(points)}
      >
        <line
          x1="0"
          y1={zero}
          x2="400"
          y2={zero}
          strokeDasharray="6 5"
          className="stats-break-even"
        />
        <polyline points={xy.map(({ x, y }) => `${x},${y}`).join(' ')} className="stats-line" />
        {xy.map(({ point, x, y }) => (
          <circle
            key={point.firstHand}
            data-bb100-point=""
            cx={x}
            cy={y}
            r="5"
            className="stats-dot"
          >
            <title>{bb100PointLabel(point)}</title>
          </circle>
        ))}
      </svg>
      <p className="stats-note">{BB100_NOTE}</p>
    </>
  );
}

export function StatisticsScreen({
  view,
  onHome,
  filter = ALL_TRENDS,
  onFilterChange,
}: StatisticsScreenProps): React.JSX.Element {
  const heading = useHeadingFocus(true);
  const chart = view?.chart;
  const bb100 = view?.bb100;
  return (
    <main className="screen stats-screen">
      <header className="stats-header">
        <button type="button" className="link-button" onClick={onHome}>
          ← Home
        </button>
        <h1 ref={heading}>Statistics</h1>
        {view && <p className="stats-totals">{view.totals}</p>}
      </header>
      {view && (
        <div className="stats-filters">
          <label>
            {TABLE_SIZE_LABEL}
            <select
              id="stats-table-size"
              value={filter.tableSize}
              onChange={(e) =>
                onFilterChange?.({ ...filter, tableSize: e.target.value as TableSizeFilter })
              }
            >
              {TABLE_SIZE_OPTIONS.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            {GAME_TYPE_LABEL}
            <select
              id="stats-game-type"
              value={filter.gameType}
              onChange={(e) =>
                onFilterChange?.({ ...filter, gameType: e.target.value as GameTypeFilter })
              }
            >
              {GAME_TYPE_OPTIONS.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
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
        {chart?.kind === 'points' && (
          <MajorErrorTrend points={chart.points} target={view?.g2Target ?? null} />
        )}
      </section>
      <section
        className="panel stats-chart"
        aria-labelledby="stats-bb100-title"
        aria-busy={view === undefined ? true : undefined}
      >
        <h2 id="stats-bb100-title">{BB100_TITLE}</h2>
        {bb100?.kind === 'no-cash' && <p className="stats-bb100-message">{NO_CASH_MESSAGE}</p>}
        {bb100?.kind === 'more-cash' && (
          <p className="stats-bb100-message">{moreCashHandsMessage(bb100.needed)}</p>
        )}
        {bb100?.kind === 'points' && <Bb100Trend points={bb100.points} />}
      </section>
    </main>
  );
}
