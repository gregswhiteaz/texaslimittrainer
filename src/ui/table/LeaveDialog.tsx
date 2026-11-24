import { useLayoutEffect, useRef } from 'react';

export interface LeaveDialogProps {
  readonly onConfirm: () => void;
  /** Cancel button, Escape and any close of the dialog. */
  readonly onCancel: () => void;
}

/** TASK-10.2: asks before Leave table folds the hand in progress. Cancel is focused (A-3) and Escape acts as
 *  Cancel; the Table returns focus to Leave table on Cancel. */
export function LeaveDialog({ onConfirm, onCancel }: LeaveDialogProps): React.JSX.Element {
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
      className="leave-dialog"
      aria-labelledby="leave-heading"
      onClose={onCancel}
    >
      <h2 id="leave-heading">Leave now? Your hand will be folded.</h2>
      <div className="leave-actions">
        <button
          ref={cancel}
          type="button"
          className="leave-cancel"
          onClick={() => dialog.current?.close()}
        >
          Cancel
        </button>
        <button type="button" className="leave-confirm" onClick={onConfirm}>
          Confirm
        </button>
      </div>
    </dialog>
  );
}
