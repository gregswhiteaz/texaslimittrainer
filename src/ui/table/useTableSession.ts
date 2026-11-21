import { useCallback, useEffect, useRef, useState } from 'react';
import { newReplayCode, type ReplayCode } from '../../engine/deck';
import type { Action } from '../../engine/hand';
import {
  applyBotDecision,
  applyUserAction,
  botTurn,
  completedHand,
  dealHand,
  nextHand,
  nextHandDelay,
  nextStep,
  seatSession,
  type CompletedHand,
  type SessionConfig,
  type TableState,
} from '../../table/session';
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
  /** Creates the app-wide advice worker if none exists yet (test seam; default: the production worker). */
  readonly createAdviceWorker?: () => WorkerLike;
}

/**
 * Holds the session and runs deal and bot steps one macrotask each; nothing runs on the user's turn.
 * Bot decisions are computed by the app-wide advice worker; replies after unmount or for an old turn are dropped.
 * After a hand the next one is dealt NEXT_HAND_DELAY_MS later unless held.
 */
export function useTableSession({
  config,
  newCode = newReplayCode,
  onHandComplete,
  holdNextHand = false,
  createAdviceWorker = createProductionWorker,
}: TableSessionOptions): {
  table: TableState;
  act: (action: Action) => void;
  dealNext: () => void;
} {
  const [table, setTable] = useState(() => seatSession(config));
  const reported = useRef<number | null>(null);
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
        sharedAdviceClient(createAdviceWorker)
          .decideBot(turn.view, turn.style)
          .then(
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
      }, 0);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
    if (step === 'done' && table.handNumber !== reported.current) {
      reported.current = table.handNumber;
      const record = completedHand(table);
      if (record !== null) onHandComplete?.(record);
    }
    const delay = nextHandDelay(table, holdNextHand);
    if (delay !== null) {
      const timer = setTimeout(() => {
        const code = newCode();
        setTable((t) => (nextStep(t) === 'done' ? dealHand(nextHand(t), code) : t));
      }, delay);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [table, newCode, onHandComplete, holdNextHand, createAdviceWorker]);

  const act = useCallback((action: Action) => {
    setTable((t) => (nextStep(t) === 'user' ? applyUserAction(t, action) : t));
  }, []);

  /** Deals the next hand now, by the auto-deal's code path; a no-op unless the hand is done. */
  const dealNext = useCallback(() => {
    const code = newCode();
    setTable((t) => (nextStep(t) === 'done' ? dealHand(nextHand(t), code) : t));
  }, [newCode]);

  return { table, act, dealNext };
}
