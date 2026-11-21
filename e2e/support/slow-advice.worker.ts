import { handleAdviceRequest } from '../../src/table/advice-service';
import { installAdviceWorker, type WorkerScope } from '../../src/ui/advice/worker-host';

// Test-only worker (D-5): never imported under src/, so its marker must never reach dist/ (SPEC-10).
const slowMs = Number(self.name);
if (!Number.isFinite(slowMs)) {
  throw new RangeError(
    `tlh-test-slow-advice: worker name must be a number of ms, got ${self.name}`,
  );
}

installAdviceWorker(self as unknown as WorkerScope, (request) => {
  const start = performance.now();
  const response = handleAdviceRequest(request);
  if (request.kind === 'bot') {
    // Busy-waits so the worker thread is really occupied, like a long equity run.
    while (performance.now() - start < slowMs) {
      /* spin */
    }
  }
  return response;
});
