import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import App from '../../src/ui/App';

describe('App', () => {
  it('App opens on the Home screen', () => {
    const html = renderToString(<App />);

    // React's server renderer prepends a preload <link> for the logo; the screen itself is the <main>.
    expect(html).toMatch(/^(<link [^>]*\/>)?<main class="screen">.*<\/main>$/s);
    expect(html).toContain('<h1>TLH Trainer</h1>');
    expect(html).toMatch(/<button[^>]*>.*New game.*<\/button>/s);
    expect(html).not.toContain('aria-label="Table"');
    expect(html).not.toContain('data-seat=');
  });
});
