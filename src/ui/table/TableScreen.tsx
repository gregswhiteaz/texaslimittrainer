import type { SessionConfig } from '../../table/session';
import { useHeadingFocus } from '../useHeadingFocus';
import { Table } from './Table';
import type { ResumedSession } from './useTableSession';

/** Seats `config`, or continues `resume` (D-4). */
export function TableScreen({
  config,
  resume,
  onLeave,
  onHome,
  showOpponentStyles,
}: {
  readonly config?: SessionConfig;
  readonly resume?: ResumedSession;
  readonly onLeave?: (sessionId: string) => void;
  readonly onHome?: () => void;
  /** REQ-050.3: style labels on bot seats (default on). */
  readonly showOpponentStyles?: boolean;
}): React.JSX.Element {
  const heading = useHeadingFocus(true);
  return (
    <main className="table-screen">
      <h1 ref={heading}>TLH Trainer</h1>
      <Table
        config={config}
        resume={resume}
        onLeave={onLeave}
        onHome={onHome}
        showOpponentStyles={showOpponentStyles}
      />
    </main>
  );
}
