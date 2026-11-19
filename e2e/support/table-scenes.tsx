import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import type { TableState } from '../../src/table/session';
import css from '../../src/ui/styles.css?inline';
import { TableView } from '../../src/ui/table/Table';
import { FLOP_BET, SEAT_1_DEALT } from '../../tests/support/table-scenarios';

// Test-only page (D-8): never imported by the app, built and injected by table-harness-bundle.ts.
const SCENES: Partial<Record<string, TableState>> = {
  'flop-bet': FLOP_BET,
  'seat-1': SEAT_1_DEALT,
};
const root = document.getElementById('root');
const table = SCENES[root?.dataset.scene ?? ''];
if (!root || table === undefined)
  throw new Error('Table scenes need #root with a known data-scene');

const style = document.createElement('style');
style.textContent = css;
document.head.append(style);

const noop = (): void => undefined;
createRoot(root).render(
  <StrictMode>
    <main className="table-screen">
      <h1>Table scene</h1>
      <TableView table={table} onAct={noop} onLeave={noop} />
    </main>
  </StrictMode>,
);
