import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../../src/table/settings';
import { SettingsScreen } from '../../src/ui/settings/SettingsScreen';

// TASK-12.11 (SPEC-03): the message shown on Settings when the latest change could not be saved.

const noop = (): void => undefined;
const MESSAGE =
  '<p role="alert" class="settings-error">Your change could not be saved, so the setting is unchanged.</p>';
const occurrences = (text: string, part: string): number => text.split(part).length - 1;

describe('Settings save-failed message', () => {
  it('the save-failed message renders after the header only when saveFailed is set', () => {
    const shown = renderToString(
      <SettingsScreen
        onHome={noop}
        settings={DEFAULT_SETTINGS}
        onSettingsChange={noop}
        saveFailed={true}
      />,
    );
    expect(occurrences(shown, MESSAGE)).toBe(1);
    expect(occurrences(shown, 'role="alert"')).toBe(1);
    const header = shown.indexOf('</header>');
    const message = shown.indexOf(MESSAGE);
    const play = shown.indexOf('aria-labelledby="settings-play"');
    expect(header).toBeGreaterThan(-1);
    expect(message).toBe(header + '</header>'.length);
    expect(play).toBeGreaterThan(message + MESSAGE.length - 1);

    for (const markup of [
      renderToString(
        <SettingsScreen
          onHome={noop}
          settings={DEFAULT_SETTINGS}
          onSettingsChange={noop}
          saveFailed={false}
        />,
      ),
      renderToString(<SettingsScreen onHome={noop} settings={DEFAULT_SETTINGS} />),
    ]) {
      expect(markup).not.toContain('role="alert"');
      expect(markup).not.toContain('settings-error');
    }
  });
});
