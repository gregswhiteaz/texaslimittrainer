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
  | { readonly name: 'ending'; readonly sessionId: string }
  | { readonly name: 'report'; readonly report: SessionReport };

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
  const [endPrompt, setEndPrompt] = useState<EndPromptState>(null);
  // D-2: bumped by every Start game and every leave of Game Config; a click-time read acts only if current.
  const startRequest = useRef(0);
  // The shown Table's history key; null while another screen is shown. Set in the handlers that change screen.
  const tableKey = useRef<string | null>(null);
  // The ending screen this App has started ending, so StrictMode's second effect run (same object) does not
  // end it twice, while each Leave table (a new object) does, even for a resumed session id.
  const endingScreen = useRef<Extract<Screen, { name: 'ending' }> | null>(null);
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

  /** Leave table: shows the ending screen, whose effect ends the session once its writes settle, then shows
   *  its report, or Home if it had no completed hand or could not be ended (A-4, A-5). */
  const leave = (sessionId: string): void => {
    if (tableKey.current === null) return;
    closeTable();
    setScreen({ name: 'ending', sessionId });
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
