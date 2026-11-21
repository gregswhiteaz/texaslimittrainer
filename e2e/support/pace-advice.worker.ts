import type { Action } from '../../src/engine/hand';
import type { PlayerView } from '../../src/engine/player-view';
import { handleAdviceRequest } from '../../src/table/advice-service';
import { installAdviceWorker, type WorkerScope } from '../../src/ui/advice/worker-host';

// Test-only worker (TASK-3.13 fix brief): never imported under src/, so its marker
// tlh-test-pace-advice must never reach dist/. The 6-max chart throws at 10 seats until TASK-7.6, so
// bots here decide without it: the first legal of raise, bet, call, check. Requests still go through
// the shared advice client and the production worker host, so the table's scheduling is unchanged.
const PREFERENCE: readonly Action['type'][] = ['raise', 'bet', 'call', 'check'];

function paceBot(view: PlayerView): Action {
  for (const type of PREFERENCE) {
    const action = view.legalActions.find((a) => a.type === type);
    if (action !== undefined) return action;
  }
  throw new RangeError(`tlh-test-pace-advice: no action for seat ${view.seat}`);
}

installAdviceWorker(self as unknown as WorkerScope, (request) =>
  handleAdviceRequest(request, { decideBot: paceBot }),
);
