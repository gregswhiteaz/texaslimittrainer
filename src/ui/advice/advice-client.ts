import type { ActionType, GradeResult } from '../../advice/grade';
import type { ObservedOpponent } from '../../advice/ranges';
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
  | {
      readonly kind: 'bot';
      readonly view: PlayerView;
      readonly style: BotStyle;
      readonly seed: number;
    }
  | {
      readonly kind: 'recommend';
      readonly view: PlayerView;
      readonly observed?: readonly ObservedOpponent[];
    }
  | {
      readonly kind: 'grade';
      readonly view: PlayerView;
      readonly userAction: ActionType;
      readonly observed?: readonly ObservedOpponent[];
    };

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
    if (response.id === null) return;
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

  /** True once the worker failed or the client was disposed: every call now rejects. */
  get failed(): boolean {
    return this.#failure !== null;
  }

  /** `seed` is the bot's main-thread seed (BotTurn.seed); 0 if omitted. */
  decideBot(view: PlayerView, style: BotStyle, seed = 0): Promise<Action> {
    return this.#request({ kind: 'bot', view, style, seed }) as Promise<Action>;
  }

  /** The user's advice; `observed` (the observed-stats snapshot) is sent only when given (D-4). */
  recommend(view: PlayerView, observed?: readonly ObservedOpponent[]): Promise<Recommendation> {
    return this.#request(
      observed === undefined ? { kind: 'recommend', view } : { kind: 'recommend', view, observed },
    ) as Promise<Recommendation>;
  }

  /** The user's decision graded with the user's advice; `observed` is sent only when given, as in recommend. */
  grade(
    view: PlayerView,
    userAction: ActionType,
    observed?: readonly ObservedOpponent[],
  ): Promise<GradeResult<Recommendation>> {
    return this.#request(
      observed === undefined
        ? { kind: 'grade', view, userAction }
        : { kind: 'grade', view, userAction, observed },
    ) as Promise<GradeResult<Recommendation>>;
  }

  /** Unless already failed: removes listeners, terminates the worker, rejects pending requests with Error('Advice client disposed'). */
  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#fail(new Error('Advice client disposed'));
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

  /** Enters the failed state once: removes listeners, terminates the worker, rejects pending requests. */
  #fail(error: Error): void {
    if (this.#failure !== null) return;
    this.#failure = error;
    this.#worker.terminate();
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
 * return the same client until it has failed, when the next call replaces it with a new one (TASK-13.1 D-5).
 * main.tsx calls it at load so the worker is warm before any table mounts.
 */
export function sharedAdviceClient(create: () => WorkerLike = createAdviceWorker): AdviceClient {
  if (shared === null || shared.failed) shared = new AdviceClient(create());
  return shared;
}
