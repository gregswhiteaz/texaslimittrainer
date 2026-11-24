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
}: {
  readonly config?: SessionConfig;
  readonly resume?: ResumedSession;
  readonly onLeave?: () => void;
  readonly onHome?: () => void;
}): React.JSX.Element {
  const heading = useHeadingFocus(true);
  return (
    <main className="table-screen">
      <h1 ref={heading}>TLH Trainer</h1>
      <Table config={config} resume={resume} onLeave={onLeave} onHome={onHome} />
    </main>
  );
}
