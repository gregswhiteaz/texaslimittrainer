import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  configForLineUp,
  DEFAULT_SESSION_CONFIG,
  type SessionConfig,
} from '../../src/table/session';
import { GameConfigScreen } from '../../src/ui/config/GameConfigScreen';

const render = (config: SessionConfig): string =>
  renderToString(
    <GameConfigScreen config={config} onStart={() => undefined} onCancel={() => undefined} />,
  ).replace(/<!-- -->/g, '');

describe('Game Config randomise button acceptance (TASK-2.9)', () => {
  it('game config shows a randomise line-up button beside the opponents heading', () => {
    for (const config of [
      DEFAULT_SESSION_CONFIG,
      configForLineUp(DEFAULT_SESSION_CONFIG, 2, 'Mixed'),
    ]) {
      const html = render(config);
      const opponents =
        /<section[^>]*aria-labelledby="config-opponents"[^>]*>([\s\S]*?)<\/section>/.exec(
          html,
        )?.[1];
      expect(opponents).toBeDefined();
      const section = opponents ?? '';

      const buttons = [...section.matchAll(/<button([^>]*)>(.*?)<\/button>/g)];
      expect(buttons.map(([, , text]) => text)).toEqual(['Randomise line-up']);
      expect(buttons[0]?.[1]).toMatch(/ type="button"/);

      expect(section).toMatch(
        /^<div class="config-opponents-header"><h2 id="config-opponents">Opponents<\/h2><button type="button"[^>]*>Randomise line-up<\/button><\/div>/,
      );
      const heading = section.indexOf('<h2 id="config-opponents">Opponents</h2>');
      const button = section.indexOf('Randomise line-up');
      const radiogroup = section.indexOf('role="radiogroup"');
      expect(heading).toBeGreaterThanOrEqual(0);
      expect(button).toBeGreaterThan(heading);
      expect(radiogroup).toBeGreaterThan(button);

      const all = [...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map(([, label]) => label);
      expect(all).toEqual(['← Home', 'Randomise line-up', 'Cancel', 'Start game']);
    }
  });
});
