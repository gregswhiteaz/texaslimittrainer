import { installAdviceWorker, type WorkerScope } from './worker-host';

installAdviceWorker(self as unknown as WorkerScope);
