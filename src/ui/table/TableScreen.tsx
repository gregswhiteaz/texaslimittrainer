import type { SessionConfig } from '../../table/session';
import { useHeadingFocus } from '../useHeadingFocus';
import { Table } from './Table';

export function TableScreen({
  config,
  onLeave,
}: {
  readonly config: SessionConfig;
  readonly onLeave?: () => void;
}): React.JSX.Element {
  const heading = useHeadingFocus(true);
  return (
    <main className="table-screen">
      <h1 ref={heading}>TLH Trainer</h1>
      <Table config={config} onLeave={onLeave} />
    </main>
  );
}
