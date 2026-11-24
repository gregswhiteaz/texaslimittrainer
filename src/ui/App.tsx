import { useEffect, useState } from 'react';
import { sharedHandStore } from '../storage/hand-store';
import { DEFAULT_SESSION_CONFIG, type SessionConfig } from '../table/session';
import { restoreSession, type SessionRecord } from '../table/session-record';
import { resumeSummary } from '../table/table-view';
import { GameConfigScreen } from './config/GameConfigScreen';
import { HomeScreen } from './home/HomeScreen';
import { TableScreen } from './table/TableScreen';
import type { ResumedSession } from './table/useTableSession';

/** In-app screens (A-1); changes add no history entries and store nothing (A-2). */
type Screen =
  | { readonly name: 'home'; readonly returned: boolean }
  | { readonly name: 'config' }
  | { readonly name: 'table'; readonly config: SessionConfig }
  | { readonly name: 'table'; readonly resume: ResumedSession };

/** undefined while Home's read is pending (A-4); reset on leaving Home so a return reads it again. */
type Paused = { readonly record: SessionRecord; readonly summary: string } | null | undefined;

export default function App(): React.JSX.Element {
  const [screen, setScreen] = useState<Screen>({ name: 'home', returned: false });
  const [paused, setPaused] = useState<Paused>(undefined);
  const onHome = screen.name === 'home';
  useEffect(() => {
    if (!onHome) return undefined;
    let cancelled = false;
    sharedHandStore()
      .pausedSession()
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
    setScreen({
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
          onStart={(config) => setScreen({ name: 'table', config })}
        />
      );
    case 'table':
      return (
        <TableScreen
          {...('resume' in screen ? { resume: screen.resume } : { config: screen.config })}
          onLeave={() => setScreen({ name: 'home', returned: true })}
        />
      );
  }
}
