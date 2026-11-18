import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Table } from '../../src/ui/table/Table';

// Test-only page (A-10): never imported by the app, built and injected by table-harness-bundle.ts.
const root = document.getElementById('root');
if (!root) throw new Error('Table harness needs a #root element');
createRoot(root).render(
  <StrictMode>
    <main>
      <h1>Table harness</h1>
      <Table config={{ stake: { smallBet: 10, bigBet: 20 } }} />
    </main>
  </StrictMode>,
);
