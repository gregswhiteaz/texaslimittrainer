import { useCallback, useEffect, useRef, useState } from 'react';
import { newReplayCode, type ReplayCode } from '../../engine/deck';
import type { Action } from '../../engine/hand';
import {
  DEFAULT_SESSION_CONFIG,
  applyUserAction,
  completedHand,
  dealHand,
  nextStep,
  seatSession,
  stepBot,
  type CompletedHand,
  type SessionConfig,
  type TableState,
} from '../../table/session';

export interface TableSessionOptions {
  readonly config?: SessionConfig;
  readonly newCode?: () => ReplayCode;
  readonly onHandComplete?: (hand: CompletedHand) => void;
}

/** Holds the session and runs deal and bot steps one macrotask each; nothing runs on the user's turn. */
export function useTableSession({
  config = DEFAULT_SESSION_CONFIG,
  newCode = newReplayCode,
  onHandComplete,
}: TableSessionOptions): { table: TableState; act: (action: Action) => void } {
  const [table, setTable] = useState(() => seatSession(config));
  const reported = useRef<ReplayCode | null>(null);

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
    if (step === 'done' && table.replayCode !== reported.current) {
      reported.current = table.replayCode;
      const record = completedHand(table);
      if (record !== null) onHandComplete?.(record);
    }
    return undefined;
  }, [table, newCode, onHandComplete]);

  const act = useCallback((action: Action) => {
    setTable((t) => (nextStep(t) === 'user' ? applyUserAction(t, action) : t));
  }, []);

  return { table, act };
}
