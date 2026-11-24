import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HomeScreen } from '../../src/ui/home/HomeScreen';

/** Markup text with React's text separators removed. */
const text = (html: string): string => html.replace(/<!-- -->/g, '');

function menu(html: string): { nav: string; buttons: string[] } {
  const nav = /<nav[^>]*>/.exec(html)?.[0] ?? '';
  const body = /<nav[^>]*>(.*?)<\/nav>/s.exec(html)?.[1] ?? '';
  return { nav, buttons: body.match(/<button[^>]*>.*?<\/button>/gs) ?? [] };
}

describe('Home resume acceptance', () => {
  it('home shows Resume session with its summary only for a paused session', () => {
    const summary = 'Cash · 6 players · $4/$8 · 132 hands · paused';
    const shown = menu(
      text(
        renderToString(
          <HomeScreen
            onNewGame={() => undefined}
            paused={{ summary }}
            onResume={() => undefined}
          />,
        ),
      ),
    );
    expect(shown.nav).toContain('aria-label="Main menu"');
    expect(shown.nav).toContain('data-paused="shown"');
    expect(shown.buttons).toHaveLength(2);
    expect(shown.buttons[0]).toContain('New game');
    expect(shown.buttons[1]).toBe(
      '<button type="button" class="menu-secondary">' +
        '<span class="menu-title">Resume session</span>' +
        `<span class="menu-subtitle">${summary}</span></button>`,
    );

    const none = menu(
      text(renderToString(<HomeScreen onNewGame={() => undefined} paused={null} />)),
    );
    expect(none.nav).toContain('data-paused="none"');
    expect(none.buttons).toHaveLength(1);
    expect(none.buttons[0]).toContain('New game');

    const loading = menu(text(renderToString(<HomeScreen onNewGame={() => undefined} />)));
    expect(loading.nav).toContain('data-paused="loading"');
    expect(loading.buttons).toHaveLength(1);
    expect(loading.buttons[0]).toContain('New game');
    expect(loading.buttons.join('')).not.toContain('Resume session');
  });
});
