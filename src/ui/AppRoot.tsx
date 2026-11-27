import { Component } from 'react';
import { sharedAdviceClient } from './advice/advice-client';
import App from './App';
import { ErrorScreen } from './error/ErrorScreen';
import { unexpectedFromErrorEvent, unexpectedFromRejection } from './error/unexpected-error';

interface State {
  readonly error: boolean;
  readonly returned: boolean;
}

/**
 * TASK-13.1: shows the error screen in place of the whole app on any render, commit or effect error below it,
 * any window `error` event carrying an error and any unhandled rejection (A-1). Nothing is written, so a
 * paused session resumes from its last completed hand (D-2). While the screen shows, later errors are
 * ignored (A-2).
 */
export class AppRoot extends Component<object, State> {
  override state: State = { error: false, returned: false };
  /** Set with the first error and cleared by Return Home, so only that error is logged (A-2, D-4). */
  #showing = false;

  static getDerivedStateFromError(): Partial<State> {
    return { error: true };
  }

  readonly #onError = (event: ErrorEvent): void => {
    const error = unexpectedFromErrorEvent(event);
    if (error !== null) this.#show(error);
  };

  readonly #onRejection = (event: PromiseRejectionEvent): void => {
    this.#show(unexpectedFromRejection(event));
  };

  override componentDidMount(): void {
    window.addEventListener('error', this.#onError);
    window.addEventListener('unhandledrejection', this.#onRejection);
  }

  override componentWillUnmount(): void {
    window.removeEventListener('error', this.#onError);
    window.removeEventListener('unhandledrejection', this.#onRejection);
  }

  override componentDidCatch(error: unknown): void {
    if (this.#showing) return;
    this.#showing = true;
    console.error('Unexpected error', error);
  }

  #show(error: unknown): void {
    if (this.#showing) return;
    this.#showing = true;
    console.error('Unexpected error', error);
    this.setState({ error: true });
  }

  /** Steps back off the Table's history entry (A-4), starts a fresh advice worker if the old one failed (A-5),
   *  then remounts App on Home with its heading focused. */
  readonly #returnHome = (): void => {
    const state: unknown = history.state;
    if (typeof state === 'object' && state !== null && 'tlhTable' in state) history.back();
    try {
      sharedAdviceClient();
    } catch (error) {
      console.error('Advice worker could not be started', error);
    }
    this.#showing = false;
    this.setState({ error: false, returned: true });
  };

  override render(): React.JSX.Element {
    const { error, returned } = this.state;
    return error ? <ErrorScreen onHome={this.#returnHome} /> : <App returned={returned} />;
  }
}
