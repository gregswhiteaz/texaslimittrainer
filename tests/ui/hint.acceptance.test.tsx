import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ObservedOpponent } from '../../src/advice/ranges';
import { recommend, userAdviceOptions, type Recommendation } from '../../src/advice/recommend';
import { replayCodeFromWords } from '../../src/engine/deck';
import type { Action, HandState, Street } from '../../src/engine/hand';
import { playerView, type PlayerView } from '../../src/engine/player-view';
import { Xoshiro128 } from '../../src/engine/seeded-random';
import { actionLabel, isShortAllIn, userActionBar } from '../../src/table/action-bar';
import { handleAdviceRequest } from '../../src/table/advice-service';
import {
  hintArrived,
  hintCard,
  hintInput,
  NO_HINT,
  shownHint,
  toggleHint,
  type HintCardView,
  type HintState,
} from '../../src/table/hint';
import {
  applyUserAction,
  configForPlayers,
  DEFAULT_SESSION_CONFIG,
  dealHand,
  nextHand,
  nextStep,
  seatSession,
  stepBot,
  userActions,
  type ObservedCounts,
  type TableState,
} from '../../src/table/session';
import { TableView } from '../../src/ui/table/Table';
import { checkOrCall } from '../support/session-play';
import {
  FLOP_BET,
  observedStyle,
  PREFLOP,
  PREFLOP_DECISION,
  RIVER,
  SHOWDOWN,
  STORYBOARD_HISTORY,
  TURN_DECISION,
} from '../support/table-scenarios';

const noop = (): void => undefined;

type ShownHint = { status: 'loading' | 'ready' | 'error'; card: HintCardView | null } | null;

function render(table: TableState, hint: ShownHint = null): string {
  return renderToString(
    <TableView table={table} onAct={noop} onLeave={noop} hint={hint} onHint={noop} />,
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

function hintButtons(html: string): { attrs: string; label: string }[] {
  return [...html.matchAll(/<button([^>]*class="hint-toggle"[^>]*)>(.*?)<\/button>/gs)].map(
    ([, attrs = '', body = '']) => ({ attrs, label: text(body) }),
  );
}

function actionsGroup(html: string): string {
  const group = /<div role="group" aria-label="Your actions"[^>]*>(.*?)<\/div>/s.exec(html)?.[1];
  if (group === undefined) throw new Error('No "Your actions" group');
  return group;
}

function hintSection(html: string): string | null {
  return /<section id="hint-card"[^>]*>(.*?)<\/section>/s.exec(html)?.[1] ?? null;
}

function part(html: string, name: string): string | null {
  const match = new RegExp(`data-part="${name}"[^>]*>(.*?)</(p|span)>`, 's').exec(html);
  return match === null ? null : text(match[1] as string);
}

function opponentLines(section: string): Map<number, string> {
  return new Map(
    [...section.matchAll(/<li data-seat="(\d+)">(.*?)<\/li>/gs)].map(([, seat, body]) => [
      Number(seat),
      text(body as string),
    ]),
  );
}

const userView = (t: TableState): PlayerView => playerView(t.hand as HandState, t.config.userSeat);

const ready = (card: HintCardView): ShownHint => ({ status: 'ready', card });

/** The worker's own code path for a hint request at `t`. */
function workerHint(t: TableState, counts: ObservedCounts): Recommendation {
  const input = hintInput(t, counts);
  if (input === null) throw new Error('Not the user turn');
  const response = handleAdviceRequest({ id: 1, kind: 'recommend', ...input });
  if (!response.ok) throw new Error(response.error.message);
  return response.value as Recommendation;
}

/** A cheap seeded policy: any legal action (no equity work, A-8). */
function randomLegal(random: Xoshiro128): (view: PlayerView) => Action {
  return (view) => view.legalActions[random.nextUint32() % view.legalActions.length] as Action;
}

/** 250 user decisions per street from seeded 2-, 6- and 10-player hands (A-8). */
function seededDecisions(): TableState[] {
  const perStreet = 250;
  const buckets: Partial<Record<Street, TableState[]>> = {
    preflop: [],
    flop: [],
    turn: [],
    river: [],
  };
  const random = new Xoshiro128(8001);
  const policy = randomLegal(random);
  const sizes = [2, 6, 10];
  for (let i = 0; Object.values(buckets).some((b) => b.length < perStreet); i++) {
    if (i > 20_000) throw new Error('Not enough seeded decisions');
    const players = sizes[i % sizes.length] as number;
    let t = dealHand(
      seatSession(configForPlayers(DEFAULT_SESSION_CONFIG, players)),
      replayCodeFromWords([i, players, 8, 1]),
    );
    while (nextStep(t) !== 'done') {
      if (nextStep(t) === 'bot') {
        t = stepBot(t, policy);
        continue;
      }
      const hand = t.hand as HandState;
      const bucket = buckets[hand.street] as TableState[];
      if (bucket.length < perStreet) bucket.push(t);
      t = applyUserAction(t, checkOrCall(hand));
    }
  }
  return Object.values(buckets).flat();
}

const BEN_45 = observedStyle(45, 27, 9);

describe('hint card on the table', () => {
  it('a Hint button is present on every enabled bar', () => {
    const states = seededDecisions();
    expect(states).toHaveLength(1000);
    const streets = new Map<string, number>();
    const sizes = new Set<number>();
    for (const t of states) {
      expect(userActionBar(t)?.enabled).toBe(true);
      const street = (t.hand as HandState).street;
      streets.set(street, (streets.get(street) ?? 0) + 1);
      sizes.add(t.seats.length);
      const html = render(t);
      const buttons = hintButtons(html);
      expect(buttons).toHaveLength(1);
      expect(buttons[0]?.label).toBe('Hint');
      expect(buttons[0]?.attrs).not.toMatch(/\sdisabled=""/);
      expect(actionsGroup(html)).not.toContain('hint-toggle');
    }
    expect([...streets]).toEqual([
      ['preflop', 250],
      ['flop', 250],
      ['turn', 250],
      ['river', 250],
    ]);
    expect([...sizes].sort((a, b) => a - b)).toEqual([2, 6, 10]);
  });

  it('Hint is disabled or absent when the bar is idle', () => {
    expect(hintButtons(render(seatSession()))).toEqual([]);
    const open: HintState = { open: true, decision: FLOP_BET.hand, card: null, failed: false };
    for (const t of [PREFLOP, SHOWDOWN]) {
      const bar = userActionBar(t);
      expect(bar?.enabled).toBe(false);
      expect(shownHint(open, t.hand, bar?.enabled === true)).toBe('none');
      const html = render(t);
      const buttons = hintButtons(html);
      expect(buttons).toHaveLength(1);
      expect(buttons[0]?.attrs).toMatch(/\sdisabled=""/);
      expect(hintSection(html)).toBeNull();
    }
  });

  it('postflop hint shows the engine numbers, explanation and basis', () => {
    const counts: ObservedCounts = { 2: BEN_45 };
    const expectedSnapshot: ObservedOpponent[] = [{ seat: 2, hands: 45, vpip: 60, pfr: 20 }];
    for (const t of [FLOP_BET, TURN_DECISION, RIVER]) {
      const view = userView(t);
      const rec = workerHint(t, counts);
      expect(rec).toEqual(recommend(view, userAdviceOptions(expectedSnapshot)));
      if (rec.basis !== 'equity') throw new Error('Expected postflop advice');
      const section = hintSection(render(t, ready(hintCard(rec, view, t)))) as string;
      expect(section).not.toBeNull();
      expect(part(section, 'hint-action')).toBe(
        `Recommended: ${actionLabel(rec.move, { allIn: isShortAllIn(view, rec.move) })}`,
      );
      const equity = part(section, 'hint-equity') as string;
      const required = part(section, 'hint-required') as string;
      expect(equity).toBe(`Equity ${rec.equityPct.toFixed(1)}%`);
      expect(required).toBe(`Required equity ${rec.requiredEquityPct.toFixed(1)}%`);
      expect(equity.replace('Equity ', '')).toMatch(/^\d{1,3}\.\d%$/);
      expect(required.replace('Required equity ', '')).toMatch(/^\d{1,3}\.\d%$/);
      expect(part(section, 'hint-explanation')).toBe(rec.explanation);
      const ben = rec.opponentBasis.find((b) => b.seat === 2);
      expect(opponentLines(section).get(2)).toBe(`Ben: ${ben?.text}`);
      if (t === FLOP_BET) expect(ben?.text).toBe('based on 45 hands of this opponent');
    }
  }, 60_000);

  it('preflop hint shows the chart basis instead of equity', () => {
    const view = userView(PREFLOP_DECISION);
    const rec = workerHint(PREFLOP_DECISION, {});
    expect(rec).toEqual(recommend(view, userAdviceOptions([])));
    const section = hintSection(
      render(PREFLOP_DECISION, ready(hintCard(rec, view, PREFLOP_DECISION))),
    ) as string;
    expect(part(section, 'hint-chart')).toBe('From the 6-max chart: raise A9o from the cutoff');
    expect(part(section, 'hint-explanation')).toBe(rec.explanation);
    expect([...opponentLines(section).values()]).toEqual([
      'Ava: typical player',
      'Ben: typical player',
      'Eli: typical player',
    ]);
    expect(section).not.toContain('hint-equity');
    expect(section).not.toContain('hint-required');
    expect(text(section).replace(rec.explanation, '')).not.toContain('%');
  });

  it('multiway basis shows 45 hands and typical player', () => {
    const counts: ObservedCounts = { 2: BEN_45, 5: observedStyle(12, 3, 1) };
    const view = userView(FLOP_BET);
    const rec = workerHint(FLOP_BET, counts);
    const lines = opponentLines(
      hintSection(render(FLOP_BET, ready(hintCard(rec, view, FLOP_BET)))) as string,
    );
    expect(lines.get(2)).toBe('Ben: based on 45 hands of this opponent');
    expect(lines.get(6)).toBe('Eli: typical player');
  }, 60_000);

  it('acting hides the hint and the next decision starts closed', () => {
    const card: HintCardView = {
      action: 'Call $4',
      chartBasis: null,
      equity: '50.0%',
      requiredEquity: '13.3%',
      explanation: 'Call.',
      opponents: [],
    };
    const cases: [TableState, Action['type']][] = [
      [FLOP_BET, 'fold'],
      [FLOP_BET, 'call'],
      [FLOP_BET, 'raise'],
      [TURN_DECISION, 'check'],
      [TURN_DECISION, 'bet'],
    ];
    for (const [t, type] of cases) {
      const decision = t.hand as HandState;
      const loading = toggleHint(NO_HINT, decision).state;
      const open = hintArrived(loading, decision, card);
      expect(shownHint(open, decision, true)).toBe('ready');
      const action = userActions(t).find((a) => a.type === type) as Action;
      const after = applyUserAction(t, action);
      const enabled = userActionBar(after)?.enabled === true;
      for (const state of [open, loading, hintArrived(loading, decision, card)]) {
        expect(shownHint(state, after.hand, enabled)).toBe('none');
      }
    }

    // The next decision later in the same hand: calling at FLOP_BET leads to TURN_DECISION.
    const flopIndex = STORYBOARD_HISTORY.indexOf(FLOP_BET);
    expect(STORYBOARD_HISTORY.indexOf(TURN_DECISION)).toBeGreaterThan(flopIndex);
    const stale = hintArrived(
      toggleHint(NO_HINT, FLOP_BET.hand as HandState).state,
      FLOP_BET.hand as HandState,
      card,
    );
    expect(shownHint(stale, TURN_DECISION.hand, true)).toBe('none');
    const turnHtml = render(TURN_DECISION, null);
    expect(hintSection(turnHtml)).toBeNull();
    expect(hintButtons(turnHtml)[0]?.label).toBe('Hint');

    // The user's first decision of the next hand.
    let next = dealHand(nextHand(SHOWDOWN), replayCodeFromWords([5, 6, 7, 8]));
    while (nextStep(next) === 'bot') next = stepBot(next, (v) => checkOrCallView(v));
    expect(nextStep(next)).toBe('user');
    expect(shownHint(stale, next.hand, true)).toBe('none');
    const reopened = toggleHint(stale, next.hand as HandState);
    expect(reopened.request).toBe(true);
    expect(shownHint(reopened.state, next.hand, true)).toBe('loading');
  });
});

function checkOrCallView(view: PlayerView): Action {
  return (view.legalActions.find((a) => a.type === 'check') ??
    view.legalActions.find((a) => a.type === 'call')) as Action;
}
