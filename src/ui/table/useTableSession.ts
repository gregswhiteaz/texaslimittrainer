import { useCallback, useEffect, useRef, useState } from 'react';
import { newReplayCode, type ReplayCode } from '../../engine/deck';
import type { Action } from '../../engine/hand';
import {
  applyUserAction,
  completedHand,
  dealHand,
  nextHand,
  nextHandDelay,
  nextStep,
  seatSession,
  stepBot,
  type CompletedHand,
  type SessionConfig,
  type TableState,
} from '../../table/session';

export interface TableSessionOptions {
  readonly config?: Partial<SessionConfig>;
  readonly newCode?: () => ReplayCode;
  readonly onHandComplete?: (hand: CompletedHand) => void;
  /** While true no next hand is dealt; turning it off starts a fresh delay (E09 seam, A-3). */
  readonly holdNextHand?: boolean;
}

/**
 * Holds the session and runs deal and bot steps one macrotask each; nothing runs on the user's turn.
 * After a hand the next one is dealt NEXT_HAND_DELAY_MS later unless held.
 */
export function useTableSession({
  config,
  newCode = newReplayCode,
  onHandComplete,
  holdNextHand = false,
}: TableSessionOptions): { table: TableState; act: (action: Action) => void } {
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
      const timer = setTimeout(() => setTable((t) => stepBot(t)), 0);
      return () => clearTimeout(timer);
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
  }, [table, newCode, onHandComplete, holdNextHand]);

  const act = useCallback((action: Action) => {
    setTable((t) => (nextStep(t) === 'user' ? applyUserAction(t, action) : t));
  }, []);

  return { table, act };
}
