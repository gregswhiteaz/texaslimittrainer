import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AdviceWorker from '../../src/ui/advice/advice.worker.ts?worker&inline';
import { sharedAdviceClient } from '../../src/ui/advice/advice-client';
import { Table } from '../../src/ui/table/Table';

// Test-only page (A-10): never imported by the app, built and injected by table-harness-bundle.ts.
// The real advice worker is inlined, since the harness page has no worker asset to load (D-4).
const createAdviceWorker = (): Worker => new AdviceWorker();
// Started before the table mounts, as main.tsx does for the app.
sharedAdviceClient(createAdviceWorker);
const root = document.getElementById('root');
if (!root) throw new Error('Table harness needs a #root element');
createRoot(root).render(
  <StrictMode>
    <main>
      <h1>Table harness</h1>
      <Table
        config={{ stake: { smallBet: 10, bigBet: 20 } }}
        createAdviceWorker={createAdviceWorker}
      />
    </main>
  </StrictMode>,
);
