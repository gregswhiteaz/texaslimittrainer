import { useEffect, useRef, useState } from 'react';
import { sharedHandStore } from '../storage/hand-store';
import { DEFAULT_SESSION_CONFIG, type SessionConfig } from '../table/session';
import { restoreSession, type SessionRecord } from '../table/session-record';
import type { SessionReport } from '../table/session-report';
import { resumeSummary } from '../table/table-view';
import { GameConfigScreen } from './config/GameConfigScreen';
import { HomeScreen } from './home/HomeScreen';
import { ReportScreen } from './report/ReportScreen';
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
  | { readonly name: 'ending' }
  | { readonly name: 'report'; readonly report: SessionReport };

/** undefined while Home's read is pending (A-4); reset on leaving Home so a return reads it again. */
type Paused = { readonly record: SessionRecord; readonly summary: string } | null | undefined;

/** Opaque per-push keys for the Table's history entries: unique across loads of the page (D-2). */
let tableEntries = 0;
const newTableKey = (): string => `${performance.timeOrigin}:${++tableEntries}`;
const entryKey = (state: unknown): unknown =>
  typeof state === 'object' && state !== null
    ? (state as { tlhTable?: unknown }).tlhTable
    : undefined;

export default function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>({ name: 'home', returned: false });
  const [paused, setPaused] = useState<Paused>(undefined);
  // The shown Table's history key; null while another screen is shown. Set in the handlers that change screen.
  const tableKey = useRef<string | null>(null);
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

  useEffect(() => {
    const onPopState = (event: PopStateEvent): void => {
      if (tableKey.current === null || entryKey(event.state) === tableKey.current) return;
      tableKey.current = null;
      setPaused(undefined);
      setScreen({ name: 'home', returned: true });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const openTable = (table: Extract<Screen, { name: 'table' }>): void => {
    const key = newTableKey();
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

  /** Leave table: ends the session once its writes settle, then shows its report, or Home if it had no
   *  completed hand or could not be ended (A-4, A-5). */
  const leave = (sessionId: string): void => {
    if (tableKey.current === null) return;
    closeTable();
    setScreen({ name: 'ending' });
    tableWritesSettled()
      .then(() => sharedHandStore().endSession(sessionId, new Date()))
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
  };

  const resume = (record: SessionRecord): void => {
    let table;
    try {
      table = restoreSession(record);
    } catch (error) {
      console.error('Session could not be resumed', error);
      setPaused(null);
      return;
    }
    setPaused(undefined);
    openTable({
      name: 'table',
      resume: { table, sessionId: record.sessionId, startedAt: new Date(record.startedAt) },
    });
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
        />
      );
    case 'config':
      return (
        <GameConfigScreen
          config={DEFAULT_SESSION_CONFIG}
          onCancel={() => setScreen({ name: 'home', returned: true })}
          onStart={(config) => openTable({ name: 'table', config })}
        />
      );
    case 'table':
      return (
        <TableScreen
          {...('resume' in screen ? { resume: screen.resume } : { config: screen.config })}
          onLeave={leave}
          onHome={goHome}
        />
      );
    case 'ending':
      return <main className="screen" aria-busy="true"></main>;
    case 'report':
      return (
        <ReportScreen
          report={screen.report}
          onHome={() => setScreen({ name: 'home', returned: true })}
        />
      );
  }
}
