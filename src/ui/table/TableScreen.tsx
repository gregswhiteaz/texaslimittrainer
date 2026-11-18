import type { SessionConfig } from '../../table/session';
import { useHeadingFocus } from '../useHeadingFocus';
import { Table } from './Table';

export function TableScreen({ config }: { readonly config: SessionConfig }): React.JSX.Element {
  const heading = useHeadingFocus(true);
  return (
    <main>
      <h1 ref={heading}>TLH Trainer</h1>
      <Table config={config} />
    </main>
  );
}
