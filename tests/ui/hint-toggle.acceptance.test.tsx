import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Recommendation } from '../../src/advice/recommend';
import { replayCodeFromWords } from '../../src/engine/deck';
import type { Action, HandState } from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';
import { Xoshiro128 } from '../../src/engine/seeded-random';
import { handleAdviceRequest } from '../../src/table/advice-service';
import {
  hintArrived,
  hintCard,
  hintInput,
  NO_HINT,
  shownHint,
  toggleHint,
  type HintState,
} from '../../src/table/hint';
import {
  applyUserAction,
  completedHand,
  countObserved,
  dealHand,
  nextHand,
  nextStep,
  rebuy,
  seatSession,
  stepBot,
  type CompletedHand,
  type ObservedCounts,
  type TableState,
} from '../../src/table/session';
import { TableView } from '../../src/ui/table/Table';
import { checkOrCall } from '../support/session-play';
import { FLOP_BET } from '../support/table-scenarios';

const noop = (): void => undefined;
const NO_LIMIT_TEXT = /\b(limit|remaining|left|cost|free hints?|\d+\s*(of|\/)\s*\d+\s*hints?)\b/i;

/** The table as Table renders it for `state` at `t`'s decision. */
function render(t: TableState, state: HintState): string {
  const status = shownHint(state, t.hand, true);
  return renderToString(
    <TableView
      table={t}
      onAct={noop}
      onLeave={noop}
      hint={status === 'none' ? null : { status, card: state.card }}
      onHint={noop}
    />,
  );
}

/** Text content: tags and React's text separators removed, entities decoded. */
function text(html: string): string {
  return html
    .replace(/<!-- -->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function toggle(html: string): { expanded: string | undefined; label: string } {
  const match = /<button([^>]*class="hint-toggle"[^>]*)>(.*?)<\/button>/s.exec(html);
  if (match === null) throw new Error('No Hint button');
  return {
    expanded: /aria-expanded="(\w+)"/.exec(match[1] as string)?.[1],
    label: text(match[2] as string),
  };
}

const hasCard = (html: string): boolean => html.includes('id="hint-card"');

function part(html: string, name: string): string {
  return text(new RegExp(`data-part="${name}"[^>]*>(.*?)</p>`, 's').exec(html)?.[1] ?? '');
}

/** The worker's own code path for a hint request at `t`. */
function workerHint(t: TableState, counts: ObservedCounts): Recommendation {
  const input = hintInput(t, counts);
  if (input === null) throw new Error('Not the user turn');
  const response = handleAdviceRequest({ id: 1, kind: 'recommend', ...input });
  if (!response.ok) throw new Error(response.error.message);
  return response.value as Recommendation;
}

const userView = (t: TableState): PlayerView => playerView(t.hand as HandState, t.config.userSeat);

/** Opens the hint at `t`, delivers the worker's card and returns the open state. */
function openHint(t: TableState, counts: ObservedCounts, from: HintState = NO_HINT): HintState {
  const decision = t.hand as HandState;
  const opened = toggleHint(from, decision);
  expect(opened.request).toBe(true);
  expect(render(t, opened.state)).toContain('Working out the hint…');
  return hintArrived(opened.state, decision, hintCard(workerHint(t, counts), userView(t), t));
}

describe('hint toggle', () => {
  it('Hide hint hides the card and the button reads Hint', () => {
    const open = openHint(FLOP_BET, {});
    const openHtml = render(FLOP_BET, open);
    expect(hasCard(openHtml)).toBe(true);
    expect(toggle(openHtml)).toEqual({ expanded: 'true', label: 'Hide hint' });

    const hidden = toggleHint(open, FLOP_BET.hand as HandState);
    expect(hidden.request).toBe(false);
    const hiddenHtml = render(FLOP_BET, hidden.state);
    expect(hasCard(hiddenHtml)).toBe(false);
    expect(toggle(hiddenHtml)).toEqual({ expanded: 'false', label: 'Hint' });
  }, 60_000);

  it('the hint opens at 50 decisions and 10 times in one with no limit or cost', () => {
    const random = new Xoshiro128(8011);
    const policy = (view: PlayerView): Action =>
      view.legalActions[random.nextUint32() % view.legalActions.length] as Action;
    let table = seatSession();
    let counts: ObservedCounts = {};
    let hint: HintState = NO_HINT;
    let decisions = 0;
    for (let n = 1; decisions < 50; n++) {
      if (n > 500) throw new Error('Not enough user decisions');
      if (nextStep(table) === 'rebuy') table = rebuy(table);
      let t = dealHand(table, replayCodeFromWords([n, 8, 0, 11]));
      while (nextStep(t) !== 'done') {
        if (nextStep(t) === 'bot') {
          t = stepBot(t, policy);
          continue;
        }
        if (decisions < 50) {
          expect(shownHint(hint, t.hand, true)).toBe('none');
          hint = openHint(t, counts, hint);
          const html = render(t, hint);
          const explanation = part(html, 'hint-explanation');
          expect(part(html, 'hint-action')).toMatch(/^Recommended: \S/);
          expect(explanation.length).toBeGreaterThan(0);
          expect(text(html).replace(explanation, '')).not.toMatch(NO_LIMIT_TEXT);
          decisions++;
        }
        t = applyUserAction(t, checkOrCall(t.hand as HandState));
      }
      counts = countObserved(counts, completedHand(t) as CompletedHand);
      table = nextHand(t);
    }
    expect(decisions).toBe(50);

    const decision = FLOP_BET.hand as HandState;
    let state = openHint(FLOP_BET, {});
    for (let cycle = 0; cycle < 10; cycle++) {
      const hidden = toggleHint(state, decision);
      expect(hasCard(render(FLOP_BET, hidden.state))).toBe(false);
      const shown = toggleHint(hidden.state, decision);
      expect(shown.request).toBe(false);
      const html = render(FLOP_BET, shown.state);
      expect(hasCard(html)).toBe(true);
      expect(part(html, 'hint-action')).toMatch(/^Recommended: \S/);
      const explanation = part(html, 'hint-explanation');
      expect(explanation.length).toBeGreaterThan(0);
      expect(text(html).replace(explanation, '')).not.toMatch(NO_LIMIT_TEXT);
      state = shown.state;
    }
  }, 60_000);
});
