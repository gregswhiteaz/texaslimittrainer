import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import type { AdviceRequest, AdviceResponse } from '../../src/table/advice-service';
import { sharedAdviceClient } from '../../src/ui/advice/advice-client';
import { Table } from '../../src/ui/table/Table';
import SlowAdviceWorker from './slow-advice.worker.ts?worker&inline';

// Test-only page: the default table with an instrumented slow worker; window.__tlhAdvice comes from the
// instrumentAdvice init script (table-harness-bundle.ts).
const root = document.getElementById('root');
if (!root) throw new Error('Advice harness needs a #root element');
const slowMs = root.dataset.slowMs ?? '0';
const record = window.__tlhAdvice;

/** The slow worker, recording each bot request's window from postMessage to its response (A-5). */
function createAdviceWorker(): Worker {
  const worker = new SlowAdviceWorker({ name: slowMs });
  worker.addEventListener('message', (event: MessageEvent<AdviceResponse>) => {
    const response = event.data;
    const pending = record.windows.find((w) => w.id === response.id && w.end === null);
    if (pending === undefined) return;
    pending.end = performance.now();
    pending.reply = response.ok ? response.value : null;
    record.computing = false;
  });
  const post = worker.postMessage.bind(worker);
  worker.postMessage = ((request: AdviceRequest) => {
    if (request.kind === 'bot') {
      record.windows.push({
        id: request.id,
        seat: request.view.seat,
        street: request.view.street,
        start: performance.now(),
        end: null,
        reply: null,
      });
      record.computing = true;
    }
    post(request);
  }) as Worker['postMessage'];
  return worker;
}

// The app-wide worker is created here, before the table mounts, so the table uses the slow worker.
sharedAdviceClient(createAdviceWorker);

createRoot(root).render(
  <StrictMode>
    <main>
      <h1>Advice harness</h1>
      <Table
        createAdviceWorker={createAdviceWorker}
        onHandComplete={(hand) => record.hands.push(hand)}
      />
    </main>
  </StrictMode>,
);
