import { APP_VERSION, versionText } from '../app-version';
import { useHeadingFocus } from '../useHeadingFocus';

// TASK-12.1: the Settings screen. Later stories add the controls (TASK-12.2, 12.4-12.9).

export interface SettingsScreenProps {
  readonly onHome: () => void;
  /** The version shown; defaults to the build's version. */
  readonly version?: string;
}

export function SettingsScreen({
  onHome,
  version = APP_VERSION,
}: SettingsScreenProps): React.JSX.Element {
  const heading = useHeadingFocus(true);
  return (
    <main className="screen settings-screen">
      <header className="settings-header">
        <button type="button" className="link-button" onClick={onHome}>
          ← Home
        </button>
        <h1 ref={heading}>Settings</h1>
      </header>
      <section className="settings-section" aria-labelledby="settings-play">
        <h2 id="settings-play">Play</h2>
      </section>
      <section className="settings-section" aria-labelledby="settings-display">
        <h2 id="settings-display">Display</h2>
      </section>
      <section className="settings-section" aria-labelledby="settings-data">
        <h2 id="settings-data">Your data</h2>
        <p>
          Hands, sessions and statistics are stored only in this browser. Clearing browser data
          deletes them, and there is no backup in this version.
        </p>
      </section>
      <p className="settings-version">{versionText(version)}</p>
    </main>
  );
}
