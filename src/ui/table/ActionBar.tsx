import type { Action } from '../../engine/hand';
import type { ActionBarModel } from '../../table/action-bar';

export interface ActionBarProps {
  readonly model: ActionBarModel;
  readonly onAct: (action: Action) => void;
}

/** Native buttons only: no key handlers, so single keys never act (REQ-022.4). */
export function ActionBar({ model, onAct }: ActionBarProps): React.JSX.Element {
  return (
    <div role="group" aria-label="Your actions" className="action-bar">
      {model.buttons.map(({ label, action }, index) => (
        <button
          key={index}
          type="button"
          disabled={!model.enabled}
          onClick={() => {
            if (model.enabled && action !== null) onAct(action);
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
