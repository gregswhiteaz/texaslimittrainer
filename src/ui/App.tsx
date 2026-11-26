import { useEffect, useRef, useState } from 'react';
import {
  ALL_TRENDS,
  DEFAULT_GROUPING,
  filterTrendData,
  statisticsView,
  type StatisticsView,
  type TrendData,
  type TrendFilter,
  type TrendGrouping,
} from '../stats/trends';
import { sharedHandStore } from '../storage/hand-store';
import { DEFAULT_SESSION_CONFIG, type SessionConfig } from '../table/session';
import { restoreObserved, restoreSession, type SessionRecord } from '../table/session-record';
import type { SessionReport } from '../table/session-report';
import { DEFAULT_SETTINGS, type Settings } from '../table/settings';
import { resumeSummary } from '../table/table-view';
import { GameConfigScreen } from './config/GameConfigScreen';
import { HomeScreen } from './home/HomeScreen';
import { ReportScreen } from './report/ReportScreen';
import { SettingsScreen } from './settings/SettingsScreen';
import { StatisticsScreen } from './stats/StatisticsScreen';
import { TableScreen } from './table/TableScreen';
import { tableWritesSettled, type ResumedSession } from './table/useTableSession';

/** In-app screens (A-1); only Leave table stores something (it ends the session). Only opening the Table
 *  adds a history entry, so browser Back on the Table pauses to Home (TASK-2.14 D-2); see
 *  docs/ui/navigation.md. */
type Screen =
  | { readonly name: 'home'; readonly returned: boolean }
  | { readonly name: 'config' }
  | { readonly name: 'table'; readonly config: SessionConfig }
  | { readonly name: 'table'; readonly resume: ResumedSession }
  | { readonly name: 'ending'; readonly sessionId: string }
  | { readonly name: 'report'; readonly report: SessionReport }
  // view: undefined while the read is pending, null if it failed (TASK-11.1 A-10, D-7). data: every stored hand
  // once read, and view is computed from its hands matching filter (TASK-11.4 D-4), grouped by grouping
  // (TASK-11.5).
  | {
      readonly name: 'stats';
      readonly view: StatisticsView | undefined | null;
      readonly data?: TrendData;
      readonly filter: TrendFilter;
      readonly grouping: TrendGrouping;
    }
  | { readonly name: 'settings' };

/** undefined while Home's read is pending (A-4); reset on leaving Home so a return reads it again. */
type Paused = { readonly record: SessionRecord; readonly summary: string } | null | undefined;

/** TASK-2.7: the open end-session dialog of Game Config, for the paused session `sessionId`. */
type EndPromptState = {
  readonly config: SessionConfig;
  readonly sessionId: string;
  readonly summary: string;
  readonly handsPlayed: number;
  readonly ending: boolean;
} | null;

/** Opaque per-push key for a Table history entry: 32 hex characters from 16 CSPRNG bytes, so keys differ
 *  across loads of the page even under a faked clock (TASK-2.20 D-2). */
function newTableKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
/** The key of the Table entry this page load pushed last. Module-level so it survives AppRoot's remount of App
 *  (TASK-2.20 A-5). */
let lastTableKey: string | null = null;
const entryKey = (state: unknown): unknown =>
  typeof state === 'object' && state !== null
    ? (state as { tlhTable?: unknown }).tlhTable
    : undefined;

/** `returned`: the first Home focuses its heading, as after Return Home from the error screen (TASK-13.1). */
export default function App({
  returned = false,
}: { readonly returned?: boolean } = {}): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>({ name: 'home', returned });
  const [paused, setPaused] = useState<Paused>(undefined);
  const [endPrompt, setEndPrompt] = useState<EndPromptState>(null);
  // undefined until the launch read settles (TASK-12.2 A-1), DEFAULT_SETTINGS if it fails (A-2).
  const [settings, setSettings] = useState<Settings | undefined>(undefined);
  // D-2: bumped by every Start game and every leave of Game Config; a click-time read acts only if current.
  const startRequest = useRef(0);
  // The shown Table's history key; null while another screen is shown. Set in the handlers that change screen.
  const tableKey = useRef<string | null>(null);
  // The ending screen this App has started ending, so StrictMode's second effect run (same object) does not
  // end it twice, while each Leave table (a new object) does, even for a resumed session id.
  const endingScreen = useRef<Extract<Screen, { name: 'ending' }> | null>(null);
  useEffect(() => {
    let cancelled = false;
    sharedHandStore()
      .readSettings()
      .then(
        (stored) => {
          if (!cancelled) setSettings(stored);
        },
        (error: unknown) => {
          if (cancelled) return;
          console.error('Settings could not be read', error);
          setSettings(DEFAULT_SETTINGS);
        },
      );
    return () => {
      cancelled = true;
    };
  }, []);

  const onHome = screen.name === 'home';
  useEffect(() => {
    if (!onHome) return undefined;
    let cancelled = false;
    tableWritesSettled()
      .then(() => sharedHandStore().pausedSession())
      .then(
        ({ session, rejected }) => {
          if (cancelled) return;
          for (const error of rejected) console.error('Session record could not be read', error);
          setPaused(session && { record: session, summary: resumeSummary(session) });
        },
        (error: unknown) => {
          if (cancelled) return;
          console.error('Paused session could not be read', error);
          setPaused(null);
        },
      );
    return () => {
      cancelled = true;
    };
  }, [onHome]);

  const onStats = screen.name === 'stats';
  useEffect(() => {
    if (!onStats) return undefined;
    let cancelled = false;
    tableWritesSettled()
      .then(() => sharedHandStore().trendData())
      .then(
        (data) => {
          if (!cancelled) {
            setScreen({
              name: 'stats',
              data,
              filter: ALL_TRENDS,
              grouping: DEFAULT_GROUPING,
              view: statisticsView(data),
            });
          }
        },
        (error: unknown) => {
          if (cancelled) return;
          console.error('Statistics could not be read', error);
          setScreen({ name: 'stats', filter: ALL_TRENDS, grouping: DEFAULT_GROUPING, view: null });
        },
      );
    return () => {
      cancelled = true;
    };
  }, [onStats]);

  // Leave table ends the session here, after the Table has unmounted: every passive effect of earlier
  // commits (including the one that queues the last hand's write) has run, so tableWritesSettled() covers
  // every table write and endSession runs after all of them (A-4, A-5).
  const ending = screen.name === 'ending' ? screen : null;
  useEffect(() => {
    if (ending === null || endingScreen.current === ending) return;
    endingScreen.current = ending;
    tableWritesSettled()
      .then(() => sharedHandStore().endSession(ending.sessionId, new Date()))
      .then(
        (report) =>
          setScreen(
            report === null ? { name: 'home', returned: true } : { name: 'report', report },
          ),
        (error: unknown) => {
          console.error('Session could not be ended', error);
          setScreen({ name: 'home', returned: true });
        },
      );
  }, [ending]);

  useEffect(() => {
    const onPopState = (event: PopStateEvent): void => {
      if (tableKey.current === null) {
        // Forward onto this load's stale Table entry: step back off it, so one Back leaves the app (D-3).
        if (lastTableKey !== null && entryKey(event.state) === lastTableKey) history.back();
        return;
      }
      if (entryKey(event.state) === tableKey.current) return;
      tableKey.current = null;
      setPaused(undefined);
      setScreen({ name: 'home', returned: true });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const openTable = (table: Extract<Screen, { name: 'table' }>): void => {
    const key = newTableKey();
    lastTableKey = key;
    history.pushState({ tlhTable: key }, '');
    tableKey.current = key;
    setScreen(table);
  };

  /** Steps back off the Table's history entry and forgets it, so popstate and a second leave are ignored. */
  const closeTable = (): void => {
    if (entryKey(history.state) === tableKey.current) history.back();
    tableKey.current = null;
    setPaused(undefined);
  };

  /** The Home control: pauses to Home, writing nothing (A-1). */
  const goHome = (): void => {
    closeTable();
    setScreen({ name: 'home', returned: true });
  };

  /** Leave table: shows the ending screen, whose effect ends the session once its writes settle, then shows
   *  its report, or Home if it had no completed hand or could not be ended (A-4, A-5). */
  const leave = (sessionId: string): void => {
    if (tableKey.current === null) return;
    closeTable();
    setScreen({ name: 'ending', sessionId });
  };

  const resume = (record: SessionRecord): void => {
    let table;
    let observed;
    try {
      table = restoreSession(record);
      observed = restoreObserved(record);
    } catch (error) {
      console.error('Session could not be resumed', error);
      setPaused(null);
      return;
    }
    setPaused(undefined);
    openTable({
      name: 'table',
      resume: {
        table,
        sessionId: record.sessionId,
        startedAt: new Date(record.startedAt),
        observed,
      },
    });
  };

  /** Start game: reads the paused session at click time (A-3). None → opens the Table; otherwise asks first. */
  const startGame = (config: SessionConfig): void => {
    const request = ++startRequest.current;
    tableWritesSettled()
      .then(() => sharedHandStore().pausedSession())
      .then(
        ({ session }) => {
          if (request !== startRequest.current) return;
          if (session === null) {
            openTable({ name: 'table', config });
            return;
          }
          setEndPrompt({
            config,
            sessionId: session.sessionId,
            summary: resumeSummary(session),
            handsPlayed: session.handsPlayed,
            ending: false,
          });
        },
        (error: unknown) => {
          if (request !== startRequest.current) return;
          console.error('Paused session could not be read', error);
          openTable({ name: 'table', config });
        },
      );
  };

  /** End session and start: ends the paused session (and older unended ones, A-1) before the new Table writes
   *  its start record, then opens it. A failure ending the paused session starts nothing (A-5). */
  const confirmEnd = (): void => {
    if (endPrompt === null || endPrompt.ending) return;
    const prompt = endPrompt;
    setEndPrompt({ ...prompt, ending: true });
    tableWritesSettled()
      .then(() => sharedHandStore().endPausedSessions(prompt.sessionId, new Date()))
      .then(
        ({ rejected }) => {
          for (const error of rejected) console.error('Session could not be ended', error);
          setEndPrompt(null);
          openTable({ name: 'table', config: prompt.config });
        },
        (error: unknown) => {
          console.error('Paused session could not be ended', error);
          setEndPrompt(null);
        },
      );
  };

  const cancelEnd = (): void => {
    if (endPrompt?.ending) return;
    setEndPrompt(null);
  };

  /** Every way into Statistics (Home, the Session report) opens it with the default filters and grouping
   *  (TASK-11.4 D-5, TASK-11.6 D-2). */
  const openStatistics = (): void => {
    setPaused(undefined);
    setScreen({ name: 'stats', view: undefined, filter: ALL_TRENDS, grouping: DEFAULT_GROUPING });
  };

  /** Shows the change at once, then saves it. A failed save is only logged (TASK-12.2 A-3). */
  const changeSettings = (next: Settings): void => {
    setSettings(next);
    sharedHandStore()
      .writeSettings(next)
      .catch((error: unknown) => console.error('Settings could not be saved', error));
  };

  switch (screen.name) {
    case 'home':
      return (
        <HomeScreen
          focusHeading={screen.returned}
          onNewGame={() => {
            setPaused(undefined);
            setScreen({ name: 'config' });
          }}
          paused={paused && { summary: paused.summary }}
          onResume={paused ? () => resume(paused.record) : undefined}
          onStatistics={openStatistics}
          onSettings={() => {
            setPaused(undefined);
            setScreen({ name: 'settings' });
          }}
        />
      );
    case 'config':
      return (
        <GameConfigScreen
          config={DEFAULT_SESSION_CONFIG}
          onCancel={() => {
            startRequest.current++;
            setEndPrompt(null);
            setScreen({ name: 'home', returned: true });
          }}
          onStart={startGame}
          endPrompt={
            endPrompt && {
              summary: endPrompt.summary,
              handsPlayed: endPrompt.handsPlayed,
              ending: endPrompt.ending,
              onConfirm: confirmEnd,
              onCancel: cancelEnd,
            }
          }
        />
      );
    case 'table':
      return (
        <TableScreen
          {...('resume' in screen ? { resume: screen.resume } : { config: screen.config })}
          onLeave={leave}
          onHome={goHome}
          showOpponentStyles={(settings ?? DEFAULT_SETTINGS).showOpponentStyles}
        />
      );
    case 'ending':
      return <main className="screen" aria-busy="true"></main>;
    case 'report':
      return (
        <ReportScreen
          report={screen.report}
          onHome={() => setScreen({ name: 'home', returned: true })}
          onStatistics={openStatistics}
        />
      );
    case 'stats':
      return (
        <StatisticsScreen
          view={screen.view}
          onHome={() => setScreen({ name: 'home', returned: true })}
          filter={screen.filter}
          onFilterChange={(filter) => {
            const { data } = screen;
            if (data === undefined) return;
            setScreen({
              ...screen,
              filter,
              view: statisticsView(filterTrendData(data, filter), data, screen.grouping),
            });
          }}
          grouping={screen.grouping}
          onGroupingChange={(grouping) => {
            const { data } = screen;
            if (data === undefined) return;
            setScreen({
              ...screen,
              grouping,
              view: statisticsView(filterTrendData(data, screen.filter), data, grouping),
            });
          }}
        />
      );
    case 'settings':
      return (
        <SettingsScreen
          onHome={() => setScreen({ name: 'home', returned: true })}
          settings={settings}
          onSettingsChange={changeSettings}
        />
      );
  }
}
