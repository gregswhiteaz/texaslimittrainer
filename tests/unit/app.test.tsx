import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import App from '../../src/ui/App';

describe('App', () => {
  it('App renders the TLH Trainer heading inside main', () => {
    const html = renderToString(<App />);

    expect(html).toBe('<main><h1>TLH Trainer</h1><p>Texas Limit Hold &#x27;Em Trainer</p></main>');
  });
});
