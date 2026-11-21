import type { ActionType, GradeResult } from '../../advice/grade';
import type { Recommendation } from '../../advice/recommend';
import type { Action } from '../../engine/hand';
import type { PlayerView } from '../../engine/player-view';
import type { AdviceRequest, AdviceResponse, AdviceValue } from '../../table/advice-service';
import type { BotStyle } from '../../table/session';

export type WorkerLike = Pick<
  Worker,
  'postMessage' | 'addEventListener' | 'removeEventListener' | 'terminate'
>;

type Payload =
  | { readonly kind: 'bot'; readonly view: PlayerView; readonly style: BotStyle }
  | { readonly kind: 'recommend'; readonly view: PlayerView }
  | { readonly kind: 'grade'; readonly view: PlayerView; readonly userAction: ActionType };

interface Pending {
  readonly resolve: (value: AdviceValue) => void;
  readonly reject: (error: Error) => void;
}

/** Promise API over an advice worker: ids from 1, replies matched by id, failures reject loudly (D-7). */
export class AdviceClient {
  readonly #worker: WorkerLike;
  readonly #pending = new Map<number, Pending>();
  #nextId = 1;
  /** Set once the worker failed or the client was disposed; every later call rejects with it. */
  #failure: Error | null = null;
  #disposed = false;

  readonly #onMessage = (event: MessageEvent<AdviceResponse>): void => {
    const response = event.data;
    const pending = this.#pending.get(response.id);
    if (pending === undefined) return;
    this.#pending.delete(response.id);
    if (response.ok) {
      pending.resolve(response.value);
    } else {
      const error = new Error(response.error.message);
      error.name = response.error.name;
      pending.reject(error);
    }
  };

  readonly #onFailure = (event: Event): void => {
    const message =
      'message' in event && typeof event.message === 'string' && event.message !== ''
        ? event.message
        : event.type;
    this.#fail(new Error(`Advice worker failed: ${message}`));
  };

  constructor(worker: WorkerLike) {
    this.#worker = worker;
    worker.addEventListener('message', this.#onMessage);
    worker.addEventListener('error', this.#onFailure);
    worker.addEventListener('messageerror', this.#onFailure);
  }

  decideBot(view: PlayerView, style: BotStyle): Promise<Action> {
    return this.#request({ kind: 'bot', view, style }) as Promise<Action>;
  }

  recommend(view: PlayerView): Promise<Recommendation> {
    return this.#request({ kind: 'recommend', view }) as Promise<Recommendation>;
  }

  grade(view: PlayerView, userAction: ActionType): Promise<GradeResult<Recommendation>> {
    return this.#request({ kind: 'grade', view, userAction }) as Promise<
      GradeResult<Recommendation>
    >;
  }

  /** Removes listeners, terminates the worker, rejects pending requests with Error('Advice client disposed'). */
  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#fail(new Error('Advice client disposed'));
    this.#worker.terminate();
  }

  #request(payload: Payload): Promise<AdviceValue> {
    if (this.#failure !== null) return Promise.reject(this.#failure);
    const id = this.#nextId++;
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject });
      const request: AdviceRequest = { id, ...payload };
      this.#worker.postMessage(request);
    });
  }

  #fail(error: Error): void {
    this.#failure = error;
    this.#worker.removeEventListener('message', this.#onMessage);
    this.#worker.removeEventListener('error', this.#onFailure);
    this.#worker.removeEventListener('messageerror', this.#onFailure);
    for (const pending of this.#pending.values()) pending.reject(error);
    this.#pending.clear();
  }
}

/** The production advice worker: a separate same-origin module asset (D-4). */
export function createAdviceWorker(): Worker {
  return new Worker(new URL('./advice.worker.ts', import.meta.url), { type: 'module' });
}

let shared: AdviceClient | null = null;

/**
 * The app-wide advice client, shared by every table (deviation from D-2: a per-table worker's cold start
 * outlasted the paused-clock e2e slices). The first call creates its worker with `create`; later calls
 * return the same client. main.tsx calls it at load so the worker is warm before any table mounts.
 */
export function sharedAdviceClient(create: () => WorkerLike = createAdviceWorker): AdviceClient {
  shared ??= new AdviceClient(create());
  return shared;
}
