import { useLayoutEffect, useRef } from 'react';

export interface EndPrompt {
  /** resumeSummary(record) of the paused session. */
  readonly summary: string;
  /** Picks the report line. */
  readonly handsPlayed: number;
  /** True while Confirm runs: both buttons disabled, Escape ignored. */
  readonly ending: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

/** TASK-2.7: asks before Start game ends the paused session. Cancel is focused (A-2) and Escape acts as Cancel;
 *  Game Config returns focus to Start game on close. */
export function EndSessionDialog({
  summary,
  handsPlayed,
  ending,
  onConfirm,
  onCancel,
}: EndPrompt): React.JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const element = dialog.current;
    if (element !== null && !element.open) element.showModal();
    cancel.current?.focus();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="end-session-dialog"
      aria-labelledby="end-session-heading"
      onCancel={(event) => {
        if (ending) event.preventDefault();
      }}
      // Chromium closes a modal on a second Escape without a cancelable cancel event, so stop the key itself.
      onKeyDown={(event) => {
        if (ending && event.key === 'Escape') event.preventDefault();
      }}
      onClose={onCancel}
    >
      <h2 id="end-session-heading">End your paused session?</h2>
      <p>Starting a new game ends this paused session:</p>
      <p className="end-session-summary">{summary}</p>
      <p>
        {handsPlayed >= 1
          ? 'Its Session Report will be saved.'
          : 'It has no completed hands, so no report is saved.'}
      </p>
      <div className="end-session-actions">
        <button
          ref={cancel}
          type="button"
          className="end-session-cancel"
          disabled={ending}
          onClick={() => dialog.current?.close()}
        >
          Cancel
        </button>
        <button type="button" className="end-session-confirm" disabled={ending} onClick={onConfirm}>
          End session and start
        </button>
      </div>
    </dialog>
  );
}
