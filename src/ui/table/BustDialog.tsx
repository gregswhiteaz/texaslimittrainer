import { useLayoutEffect, useRef } from 'react';

export interface BustDialogProps {
  /** The buy-in in dollars. */
  readonly amount: number;
  readonly onRebuy?: () => void;
  readonly onLeave: () => void;
}

/** REQ-007.2: the modal Rebuy / Leave table choice when the user's cash stack is $0 (A-4). Escape is ignored. */
export function BustDialog({ amount, onRebuy, onLeave }: BustDialogProps): React.JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const element = dialog.current;
    if (element !== null && !element.open) element.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="bust-dialog"
      aria-labelledby="bust-heading"
      onCancel={(event) => event.preventDefault()}
      // Chromium closes a modal on a second Escape without a cancelable cancel event, so stop the key itself.
      onKeyDown={(event) => {
        if (event.key === 'Escape') event.preventDefault();
      }}
    >
      <h2 id="bust-heading">Out of chips</h2>
      <p>{`Your stack is $0. Rebuy for $${amount} to keep playing, or leave the table.`}</p>
      <div className="bust-actions">
        <button type="button" className="bust-rebuy" onClick={onRebuy}>
          Rebuy
        </button>
        <button type="button" className="bust-leave" onClick={onLeave}>
          Leave table
        </button>
      </div>
    </dialog>
  );
}
