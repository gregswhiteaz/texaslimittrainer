import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import { HomeScreen } from '../../src/ui/home/HomeScreen';

// TASK-12.1 (AC#1, A-1, D-2): Home's Settings entry comes last, after Statistics.

const SETTINGS =
  '<button type="button" class="menu-secondary">' +
  '<span class="menu-title">Settings</span>' +
  '<span class="menu-subtitle">Speed, display, reset data</span></button>';

function menuButtons(html: string): string[] {
  const body = /<nav[^>]*>(.*?)<\/nav>/s.exec(html.replace(/<!-- -->/g, ''))?.[1] ?? '';
  return body.match(/<button[^>]*>.*?<\/button>/gs) ?? [];
}

it('home offers Settings after Statistics', () => {
  const none = menuButtons(
    renderToString(
      <HomeScreen
        onNewGame={() => undefined}
        onStatistics={() => undefined}
        onSettings={() => undefined}
        paused={null}
      />,
    ),
  );
  expect(none).toHaveLength(3);
  expect(none[0]).toContain('New game');
  expect(none[1]).toContain('Statistics');
  expect(none[2]).toBe(SETTINGS);

  const summary = 'Cash · 6 players · $4/$8 · 12 hands · paused';
  const paused = menuButtons(
    renderToString(
      <HomeScreen
        onNewGame={() => undefined}
        onStatistics={() => undefined}
        onSettings={() => undefined}
        paused={{ summary }}
        onResume={() => undefined}
      />,
    ),
  );
  expect(paused).toHaveLength(4);
  expect(paused[0]).toContain('New game');
  expect(paused[1]).toContain('Resume session');
  expect(paused[2]).toContain('Statistics');
  expect(paused[3]).toBe(SETTINGS);

  const without = renderToString(
    <HomeScreen onNewGame={() => undefined} onStatistics={() => undefined} paused={null} />,
  );
  expect(without).not.toContain('Settings');
});
