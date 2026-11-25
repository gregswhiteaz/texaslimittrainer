import { useHeadingFocus } from '../useHeadingFocus';

export const ERROR_HEADING = 'Something went wrong';
export const ERROR_MESSAGE =
  'The app hit an unexpected problem. Every completed hand is saved, and a paused session resumes from its last completed hand.';

/** Shown in place of the whole app after an unexpected error (TASK-13.1 D-1). It takes no error, so no
 *  detail can ever be shown. */
export function ErrorScreen({ onHome }: { readonly onHome: () => void }): React.JSX.Element {
  const heading = useHeadingFocus(true);
  return (
    <main className="screen error-screen">
      <h1 ref={heading}>{ERROR_HEADING}</h1>
      <p className="error-message">{ERROR_MESSAGE}</p>
      <button type="button" className="error-home" onClick={onHome}>
        Return Home
      </button>
    </main>
  );
}
