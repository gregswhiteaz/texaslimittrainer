import {
  handleAdviceRequest,
  type AdviceRequest,
  type AdviceResponse,
} from '../../table/advice-service';

/** The parts of a dedicated worker's global scope (or a MessagePort) the host uses. */
export interface WorkerScope {
  addEventListener(type: 'message', listener: (event: MessageEvent<AdviceRequest>) => void): void;
  postMessage(message: AdviceResponse): void;
}

/** Answers every request on `scope` with `handle`, one at a time in arrival order. */
export function installAdviceWorker(
  scope: WorkerScope,
  handle: (request: AdviceRequest) => AdviceResponse = handleAdviceRequest,
): void {
  scope.addEventListener('message', (event) => scope.postMessage(handle(event.data)));
}
