import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import App from '../../src/ui/App';

describe('App', () => {
  it('App renders the TLH Trainer heading and the seated table inside main', () => {
    const html = renderToString(<App />);

    expect(html).toMatch(
      /^<main><h1>TLH Trainer<\/h1><section aria-label="Table"[^>]*>.*<\/section><\/main>$/s,
    );
    expect(html.match(/data-part="stack">\$<!-- -->160</g)).toHaveLength(6);
  });
});
