import { useCallback, useEffect, useRef, useState } from 'react';
import { newReplayCode, type ReplayCode } from '../../engine/deck';
import type { Action } from '../../engine/hand';
import {
  applyBotDecision,
  applyUserAction,
  botActionDelayMs,
  botTurn,
  completedHand,
  dealHand,
  nextHand,
  nextHandDelay,
  nextStep,
  seatSession,
  type BotTurn,
  type CompletedHand,
  type SessionConfig,
  type TableState,
} from '../../table/session';
import type { HandStore } from '../../table/hand-record';
import { handWrite, sessionRecord } from '../../table/session-record';
import { sharedHandStore } from '../../storage/hand-store';
import {
  sharedAdviceClient,
  createAdviceWorker as createProductionWorker,
  type WorkerLike,
} from '../advice/advice-client';

export interface TableSessionOptions {
  readonly config?: Partial<SessionConfig>;
  readonly newCode?: () => ReplayCode;
  readonly onHandComplete?: (hand: CompletedHand) => void;
  /** While true no next hand is dealt; turning it off starts a fresh delay (E09 seam, A-3). */
  readonly holdNextHand?: boolean;
  /**
   * Used only if no app-wide advice client exists yet, to create its worker; ignored once one exists
   * (main.tsx and the e2e harnesses create it at load). Default: the production worker.
   */
  readonly createAdviceWorker?: () => WorkerLike;
  /** Where each completed hand's record is written. Default: the app-wide IndexedDB store. */
  readonly handStore?: HandStore;
  /** A stored session to continue instead of seating `config`: no start record is written (A-6). */
  readonly resume?: ResumedSession;
}

/** A restored table ready to deal, with the stored session's id and start time (D-4). */
export interface ResumedSession {
  readonly table: TableState;
  readonly sessionId: string;
  readonly startedAt: Date;
}

/** A new session id: 32 lowercase hex characters from 16 CSPRNG bytes (A-8). */
function newSessionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

const noop = (): void => undefined;
let pending: Promise<void> = Promise.resolve();

/** Adds `write` to the chain tableWritesSettled waits for; its rejection is swallowed there. */
function track(write: Promise<unknown>): void {
  pending = Promise.all([pending, write.then(noop, noop)]).then(noop);
}

/** Resolves once every start-record put and hand write issued so far by any table has settled. Never
 *  rejects (failures are already logged). Home awaits it before reading the paused session (A-2). */
export function tableWritesSettled(): Promise<void> {
  return pending;
}

/**
 * Asks the app-wide advice worker for a bot decision. Never throws synchronously: a failure creating the
 * worker or client rejects the promise, like any other advice failure.
 */
export function requestBotDecision(create: () => WorkerLike, turn: BotTurn): Promise<Action> {
  return Promise.resolve().then(() =>
    sharedAdviceClient(create).decideBot(turn.view, turn.style, turn.seed),
  );
}

/**
 * Holds the session and runs the deal step one macrotask later and each bot step botActionDelayMs(speed)
 * later (0 at Rapid, REQ-011.1); nothing runs on the user's turn.
 * Bot decisions are computed by the app-wide advice worker; replies after unmount or for an old turn are dropped.
 * At mount the session's start record is put in the hand store, unless the session is resumed. After a hand
 * its record and the session's next-hand state are written together, and the next one is dealt NEXT_HAND_DELAY_MS later
 * (unless held) or once that write completes, whichever is later; a failed write deals nothing more (D-2).
 */
export function useTableSession({
  config,
  newCode = newReplayCode,
  onHandComplete,
  holdNextHand = false,
  createAdviceWorker = createProductionWorker,
  handStore,
  resume,
}: TableSessionOptions): {
  table: TableState;
  act: (action: Action) => void;
  dealNext: () => void;
} {
  const [table, setTable] = useState(() => resume?.table ?? seatSession(config));
  const reported = useRef<number | null>(null);
  const [sessionId] = useState(() => resume?.sessionId ?? newSessionId());
  const [startedAt] = useState(() => resume?.startedAt ?? new Date());
  // The start record (A-3): written once per mount from the seated table; each hand's write waits for it.
  // A failure is logged and does not stop dealing, as every hand's write puts the full session record.
  // A resumed session is already stored ready for this hand, so nothing is written (A-6).
  const [initialTable] = useState(table);
  const started = useRef<Promise<void> | null>(resume === undefined ? null : Promise.resolve());
  useEffect(() => {
    if (started.current !== null) return;
    started.current = (handStore ?? sharedHandStore())
      .putSession(sessionRecord(initialTable, { sessionId, startedAt, updatedAt: startedAt }))
      .catch((error: unknown) => {
        console.error('Session could not be saved', error);
      });
    track(started.current);
  }, [handStore, initialTable, sessionId, startedAt]);
  // Read through a ref so a new callback each render never restarts the next-hand timer (D-5).
  const callback = useRef(onHandComplete);
  useEffect(() => {
    callback.current = onHandComplete;
  });
  const write = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    const step = nextStep(table);
    if (step === 'deal') {
      const timer = setTimeout(() => {
        // Drawn outside the updater so a doubled updater call cannot draw twice.
        const code = newCode();
        setTable((t) => dealHand(t, code));
      }, 0);
      return () => clearTimeout(timer);
    }
    if (step === 'bot') {
      let cancelled = false;
      const timer = setTimeout(() => {
        const turn = botTurn(table);
        requestBotDecision(createAdviceWorker, turn).then(
          (action) => {
            if (!cancelled) setTable((t) => applyBotDecision(t, turn, action));
          },
          (error: unknown) => {
            if (!cancelled) {
              setTable(() => {
                throw error;
              });
            }
          },
        );
      }, botActionDelayMs(table.config.speed));
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
    if (step === 'done' && table.handNumber !== reported.current) {
      reported.current = table.handNumber;
      const done = completedHand(table);
      if (done !== null) {
        const { record, session } = handWrite(table, {
          sessionId,
          startedAt,
          completedAt: new Date(),
        });
        const store = handStore ?? sharedHandStore();
        write.current = (started.current ?? Promise.resolve()).then(() =>
          store.add(record, session),
        );
        write.current.catch((error: unknown) => {
          console.error('Hand record could not be saved', error);
        });
        track(write.current);
        callback.current?.(done);
      }
    }
    const delay = nextHandDelay(table, holdNextHand);
    if (delay !== null) {
      let cancelled = false;
      const timer = setTimeout(() => {
        write.current.then(
          () => {
            if (cancelled) return;
            const code = newCode();
            setTable((t) => (nextStep(t) === 'done' ? dealHand(nextHand(t), code) : t));
          },
          () => undefined,
        );
      }, delay);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
    return undefined;
  }, [table, newCode, holdNextHand, createAdviceWorker, handStore, sessionId, startedAt]);

  const act = useCallback((action: Action) => {
    setTable((t) => (nextStep(t) === 'user' ? applyUserAction(t, action) : t));
  }, []);

  /** Deals the next hand once its record is written, by the auto-deal's code path; a no-op unless the hand
   *  is done, and never after a failed write. */
  const dealNext = useCallback(() => {
    write.current.then(
      () => {
        const code = newCode();
        setTable((t) => (nextStep(t) === 'done' ? dealHand(nextHand(t), code) : t));
      },
      () => undefined,
    );
  }, [newCode]);

  return { table, act, dealNext };
}
