import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import { APP_VERSION, versionText } from '../../src/ui/app-version';
import { SettingsScreen } from '../../src/ui/settings/SettingsScreen';

// TASK-12.1 (AC#2): the Settings version line shows the build's package.json version.

const occurrences = (text: string, part: string): number => text.split(part).length - 1;

it('shows Version 1.2.0 for a 1.2.0 build', () => {
  const html = renderToString(<SettingsScreen onHome={() => undefined} version="1.2.0" />);
  expect(occurrences(html, '<p class="settings-version">Version 1.2.0</p>')).toBe(1);
  expect(versionText('1.2.0')).toBe('Version 1.2.0');
});

it('the default version is the package.json version', () => {
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as {
    version: string;
  };
  expect(APP_VERSION).toBe(pkg.version);
  const html = renderToString(<SettingsScreen onHome={() => undefined} />);
  expect(occurrences(html, `<p class="settings-version">Version ${pkg.version}</p>`)).toBe(1);
});

it('shows the header, the three sections and the data paragraph', () => {
  const html = renderToString(<SettingsScreen onHome={() => undefined} version="1.2.0" />);
  expect(html).toContain('<button type="button" class="link-button">← Home</button>');
  expect(html).toContain('<h1>Settings</h1>');
  for (const [id, name] of [
    ['settings-play', 'Play'],
    ['settings-display', 'Display'],
    ['settings-data', 'Your data'],
  ]) {
    expect(html).toContain(
      `<section class="settings-section" aria-labelledby="${id}"><h2 id="${id}">${name}</h2>`,
    );
  }
  expect(html).toContain(
    'Hands, sessions and statistics are stored only in this browser. Clearing browser data deletes them, and there is no backup in this version.',
  );
});
