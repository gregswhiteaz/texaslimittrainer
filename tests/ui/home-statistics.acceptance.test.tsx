import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import { HomeScreen } from '../../src/ui/home/HomeScreen';

// TASK-11.1 (AC#1, A-4): Home's Statistics entry comes after New game and Resume session.

const STATISTICS =
  '<button type="button" class="menu-secondary">' +
  '<span class="menu-title">Statistics</span>' +
  '<span class="menu-subtitle">Your progress across sessions</span></button>';

function menuButtons(html: string): string[] {
  const body = /<nav[^>]*>(.*?)<\/nav>/s.exec(html.replace(/<!-- -->/g, ''))?.[1] ?? '';
  return body.match(/<button[^>]*>.*?<\/button>/gs) ?? [];
}

it('home offers Statistics after New game and Resume session', () => {
  const none = menuButtons(
    renderToString(
      <HomeScreen onNewGame={() => undefined} onStatistics={() => undefined} paused={null} />,
    ),
  );
  expect(none).toHaveLength(2);
  expect(none[0]).toContain('class="menu-primary"');
  expect(none[0]).toContain('New game');
  expect(none[1]).toBe(STATISTICS);

  const summary = 'Cash · 6 players · $4/$8 · 12 hands · paused';
  const paused = menuButtons(
    renderToString(
      <HomeScreen
        onNewGame={() => undefined}
        onStatistics={() => undefined}
        paused={{ summary }}
        onResume={() => undefined}
      />,
    ),
  );
  expect(paused).toHaveLength(3);
  expect(paused[0]).toContain('New game');
  expect(paused[1]).toContain('Resume session');
  expect(paused[1]).toContain(summary);
  expect(paused[2]).toBe(STATISTICS);
});
