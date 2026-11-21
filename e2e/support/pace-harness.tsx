import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { sharedAdviceClient } from '../../src/ui/advice/advice-client';
import type { SessionSeat } from '../../src/table/session';
import { Table } from '../../src/ui/table/Table';
import PaceAdviceWorker from './pace-advice.worker.ts?worker&inline';

// Test-only 10-max page (TASK-3.13 A-6, D-3): never imported by the app, built by table-harness-bundle.ts.
// Bots decide in the test-only pace worker (no 6-max chart) through the app-wide advice client.
const TEN_SEATS: readonly SessionSeat[] = [
  'Ava',
  'Ben',
  'Cal',
  'Dee',
  'You',
  'Eli',
  'Fay',
  'Gus',
  'Hal',
  'Ivy',
].map((name, index) =>
  name === 'You'
    ? { seat: index + 1, name, kind: 'user', style: null }
    : { seat: index + 1, name, kind: 'bot', style: 'TAG' },
);

sharedAdviceClient(() => new PaceAdviceWorker());
const root = document.getElementById('root');
if (!root) throw new Error('Pace harness needs a #root element');
createRoot(root).render(
  <StrictMode>
    <main>
      <h1>Pace harness</h1>
      <Table config={{ players: 10, seats: TEN_SEATS, button: 6 }} />
    </main>
  </StrictMode>,
);
