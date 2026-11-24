import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SESSION_CONFIG } from '../../src/table/session';
import { GameConfigScreen } from '../../src/ui/config/GameConfigScreen';
import type { EndPrompt } from '../../src/ui/config/EndSessionDialog';

// TASK-2.7: Game Config shows the end-session dialog only while App passes a prompt.

const noop = (): void => undefined;
const SUMMARY = 'Cash · 6 players · $4/$8 · 4 hands · paused';

const render = (endPrompt?: EndPrompt | null): string =>
  renderToString(
    <GameConfigScreen
      config={DEFAULT_SESSION_CONFIG}
      onStart={noop}
      onCancel={noop}
      {...(endPrompt === undefined ? {} : { endPrompt })}
    />,
  );

const prompt = (handsPlayed: number, ending: boolean): EndPrompt => ({
  summary: SUMMARY,
  handsPlayed,
  ending,
  onConfirm: noop,
  onCancel: noop,
});

const dialogOf = (html: string): string => /<dialog[^>]*>.*?<\/dialog>/s.exec(html)?.[0] ?? '';
const buttonsOf = (dialog: string) =>
  [...dialog.matchAll(/<button([^>]*)>([^<]*)<\/button>/g)].map((m) => ({
    attributes: m[1] ?? '',
    text: m[2],
  }));

describe('end session dialog acceptance', () => {
  it('renders the dialog only with a prompt', () => {
    const html = render(prompt(4, false));
    expect(html.match(/<dialog[\s>]/g)).toHaveLength(1);
    expect(html).toContain(
      '<dialog class="end-session-dialog" aria-labelledby="end-session-heading">',
    );
    const dialog = dialogOf(html);
    expect(dialog).toContain('<h2 id="end-session-heading">End your paused session?</h2>');
    expect(dialog).toContain('<p>Starting a new game ends this paused session:</p>');
    expect(dialog).toContain(`<p class="end-session-summary">${SUMMARY}</p>`);
    expect(dialog).toContain('<p>Its Session Report will be saved.</p>');
    expect(dialog).not.toContain('no report is saved');
    const buttons = buttonsOf(dialog);
    expect(buttons.map((b) => b.text)).toEqual(['Cancel', 'End session and start']);
    for (const b of buttons) expect(b.attributes).not.toContain('disabled');
    // The dialog follows the config actions inside <main>.
    expect(html).toMatch(/Start game<\/button><\/div><dialog[^>]*>.*<\/dialog><\/main>/s);

    const empty = dialogOf(render(prompt(0, false)));
    expect(empty).toContain('<p>It has no completed hands, so no report is saved.</p>');
    expect(empty).not.toContain('Its Session Report will be saved.');

    const ending = buttonsOf(dialogOf(render(prompt(4, true))));
    expect(ending.map((b) => b.text)).toEqual(['Cancel', 'End session and start']);
    for (const b of ending) expect(b.attributes).toContain('disabled=""');

    expect(render()).not.toMatch(/<dialog/);
    expect(render(null)).not.toMatch(/<dialog/);
  });
});
