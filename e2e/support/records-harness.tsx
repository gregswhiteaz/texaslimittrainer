import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import AdviceWorker from '../../src/ui/advice/advice.worker.ts?worker&inline';
import { sharedAdviceClient } from '../../src/ui/advice/advice-client';
import { openHandStore } from '../../src/storage/hand-store';
import type { ObservedOpponent } from '../../src/advice/ranges';
import type { HandStore } from '../../src/table/hand-record';
import type { CompletedHand } from '../../src/table/session';
import { Table } from '../../src/ui/table/Table';

// Test-only page (TASK-3.9 A-4): never imported by the app, built and injected by table-harness-bundle.ts.
// #root's data-store picks the hand store: "real", "delay" (each add waits data-delay-ms on a page timer, so
// under the paused clock, then calls the real add) or "fail" (each add rejects with QuotaExceededError).
// data-churn="1" re-renders the Table with a new onHandComplete every 100 ms. data-auto-open="0" renders the
// Table with auto-open off (TASK-9.7).

export interface RecordsHarnessLog {
  /** 'result' | 'header:<n>' | 'saved:<n>' | 'unhandled', with performance.now(). */
  events: { event: string; at: number }[];
  /** replayCode of each onHandComplete call, in order. */
  calls: string[];
  /** Per onHandComplete call, each user decision's stored observed snapshot (null if it has none). */
  observed: (readonly ObservedOpponent[] | null)[][];
  /** Parent renders. */
  renders: number;
}

declare global {
  interface Window {
    __records: RecordsHarnessLog;
  }
}

const log: RecordsHarnessLog = { events: [], calls: [], observed: [], renders: 0 };
window.__records = log;
const note = (event: string): void => {
  log.events.push({ event, at: performance.now() });
};
window.addEventListener('unhandledrejection', () => note('unhandled'));

const root = document.getElementById('root');
if (!root) throw new Error('Records harness needs a #root element');
const mode = root.dataset.store ?? 'real';
const delayMs = Number(root.dataset.delayMs ?? '2000');
const churn = root.dataset.churn === '1';
const autoOpen = root.dataset.autoOpen !== '0';

const real = openHandStore();
const handStore: HandStore =
  mode === 'real'
    ? real
    : {
        add: (record, session) =>
          mode === 'fail'
            ? Promise.reject(new DOMException('full', 'QuotaExceededError'))
            : new Promise<void>((resolve) => setTimeout(resolve, delayMs))
                .then(() => real.add(record, session))
                .then(() => note(`saved:${record.handNumber}`)),
        putSession: (session) => real.putSession(session),
        getSession: (sessionId) => real.getSession(sessionId),
        pausedSession: () => real.pausedSession(),
        get: (sessionId, handNumber) => real.get(sessionId, handNumber),
        count: () => real.count(),
      };

let resultShown = false;
let headerText: string | null = null;
new MutationObserver(() => {
  const shown = document.querySelector('[role="status"]') !== null;
  if (shown && !resultShown) note('result');
  resultShown = shown;
  const text = document.querySelector('.table-header-line')?.textContent ?? null;
  if (text !== null && text !== headerText) note(`header:${/Hand #(\d+)$/.exec(text)?.[1] ?? '?'}`);
  headerText = text;
}).observe(document, { subtree: true, childList: true, characterData: true });

function Harness(): React.JSX.Element {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!churn) return undefined;
    const timer = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(timer);
  }, []);
  log.renders += 1;
  // A new function on every render.
  const onHandComplete = (hand: CompletedHand): void => {
    log.calls.push(hand.replayCode);
    log.observed.push(hand.userDecisions.map((d) => d.observed ?? null));
  };
  return <Table handStore={handStore} onHandComplete={onHandComplete} autoOpenReview={autoOpen} />;
}

sharedAdviceClient(() => new AdviceWorker());
createRoot(root).render(
  <StrictMode>
    <main>
      <h1>Records harness</h1>
      <Harness />
    </main>
  </StrictMode>,
);
