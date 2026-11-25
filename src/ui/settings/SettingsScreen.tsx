import { DEFAULT_SETTINGS, type Settings } from '../../table/settings';
import { APP_VERSION, versionText } from '../app-version';
import { useHeadingFocus } from '../useHeadingFocus';

// TASK-12.1: the Settings screen. Later stories add the controls (TASK-12.2, 12.4-12.9).

export interface SettingsScreenProps {
  readonly onHome: () => void;
  /** The version shown; defaults to the build's version. */
  readonly version?: string;
  /** The current settings; undefined while they are being read (controls disabled). */
  readonly settings?: Settings;
  /** Called with the whole new settings record when a control changes. */
  readonly onSettingsChange?: (settings: Settings) => void;
}

/** The record after the toggle changes; undefined (no change) while settings are still loading. */
export function withOpponentStyles(
  settings: Settings | undefined,
  showOpponentStyles: boolean,
): Settings | undefined {
  return settings && { ...settings, showOpponentStyles };
}

export function SettingsScreen({
  onHome,
  version = APP_VERSION,
  settings,
  onSettingsChange,
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
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={(settings ?? DEFAULT_SETTINGS).showOpponentStyles}
            disabled={settings === undefined || onSettingsChange === undefined}
            onChange={(e) => {
              const next = withOpponentStyles(settings, e.currentTarget.checked);
              if (next !== undefined) onSettingsChange?.(next);
            }}
          />
          Show opponent styles at the table
        </label>
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
