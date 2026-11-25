import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ErrorScreen } from '../../src/ui/error/ErrorScreen';

describe('Error screen acceptance (TASK-13.1)', () => {
  it('the error screen shows a heading, one sentence and a native Return Home button only', () => {
    expect(renderToString(<ErrorScreen onHome={() => undefined} />)).toBe(
      '<main class="screen error-screen"><h1>Something went wrong</h1><p class="error-message">The app hit an unexpected problem. Every completed hand is saved, and a paused session resumes from its last completed hand.</p><button type="button" class="error-home">Return Home</button></main>',
    );
  });
});
