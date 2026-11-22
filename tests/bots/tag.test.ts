import { readdirSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { EquityInput, EquityResult } from '../../src/advice/equity';
import { SIX_MAX_CHART } from '../../src/advice/preflop';
import { decideTag, FREE_CHECK_EQUITY } from '../../src/bots/tag';
import { parseCards, type Card } from '../../src/engine/cards';
import { applyAction, createHand, type Action, type SeatNumber } from '../../src/engine/hand';
import { playerView } from '../../src/engine/player-view';
import { REPO_ROOT } from '../support/sandbox';

const STAKES_4_8 = { smallBlind: 2, bigBlind: 4, smallBet: 4, bigBet: 8 };

/** Seats 1..size, button 1, the given actions applied in order. */
function stateAfter(steps: Action[], size = 6) {
  let state = createHand({
    stakes: STAKES_4_8,
    seats: Array.from({ length: size }, (_, i) => ({ seat: i + 1, stack: 160 })),
    button: 1,
    deck: Array.from({ length: 52 }, (_, i) => i),
  });
  for (const action of steps) {
    const result = applyAction(state, action);
    if (!result.ok) throw new Error(result.error.message);
    state = result.state;
  }
  return state;
}

/** Button 1: preflop 4 fold, 5 fold, 6 call, 1 call, 2 complete, 3 check; seat 2 then acts first on the flop. */
const PREFLOP: Action[] = [
  { seat: 4, type: 'fold' },
  { seat: 5, type: 'fold' },
  { seat: 6, type: 'call', amount: 4 },
  { seat: 1, type: 'call', amount: 4 },
  { seat: 2, type: 'call', amount: 2 },
  { seat: 3, type: 'check' },
];
const FLOP_BET: Action[] = [...PREFLOP, { seat: 2, type: 'bet', amount: 4 }];
const FLOP_FREE: Action[] = [...PREFLOP, { seat: 2, type: 'check' }];

function stubEquity(equity: number) {
  const calls: EquityInput[] = [];
  const fn = (input: EquityInput): EquityResult => {
    calls.push(input);
    return {
      hero: { win: equity, tie: 0, equity },
      opponents: input.opponents.map(() => ({ win: 0, tie: 0, equity: 0 })),
      method: 'sampled',
      trials: 1,
    };
  };
  return { fn, calls };
}

const ENGINE_TYPES: Readonly<Record<string, readonly string[]>> = {
  'src/engine/player-view': [
    'PlayerView',
    'PublicPlayer',
    'SeatPolicy',
    'ShownHand',
    'EarlierShowdown',
  ],
  'src/engine/hand': ['Action', 'SeatNumber', 'Street'],
};
const IMPORT = /^import\s+(type\s+)?([\s\S]*?)\s+from\s+'([^']+)';/gm;

/** Imports in `text` (the source of `file`, repo-relative) that cross the PlayerView boundary. */
function boundaryProblems(file: string, text: string): string[] {
  const problems: string[] = [];
  for (const [statement, typeOnly, clause, specifier] of text.matchAll(IMPORT)) {
    const from = specifier as string;
    if (!from.startsWith('.')) {
      problems.push(`${file}: package import ${statement}`);
      continue;
    }
    const target = posix.join(posix.dirname(file), from);
    if (target.startsWith('src/ui')) problems.push(`${file}: UI import ${statement}`);
    if (!target.startsWith('src/engine')) continue;
    const allowed = ENGINE_TYPES[target];
    const names = (clause as string)
      .replace(/[{}]/g, '')
      .split(',')
      .map((name) => name.trim())
      .filter((name) => name !== '');
    if (
      typeOnly === undefined ||
      allowed === undefined ||
      names.some((n) => !allowed.includes(n))
    ) {
      problems.push(`${file}: engine import ${statement}`);
    }
  }
  return problems;
}

describe('TAG bot units', () => {
  it('free-check stand-in and option pass-through', () => {
    const [hero0, hero1, ...board] = parseCards('Ah 5h Kh 9h 2c') as [Card, Card, ...Card[]];
    const range = [parseCards('Qs Qd') as [Card, Card]];
    expect(FREE_CHECK_EQUITY({ hero: [hero0, hero1], board, opponents: [range, range] })).toEqual({
      hero: { win: 0, tie: 0, equity: 0 },
      opponents: [
        { win: 0, tie: 0, equity: 0 },
        { win: 0, tie: 0, equity: 0 },
      ],
      method: 'exact',
      trials: 0,
    });

    const facing = playerView(stateAfter(FLOP_BET), 3);
    const strong = stubEquity(1);
    expect(decideTag(facing, { equity: strong.fn })).toStrictEqual({
      seat: 3,
      type: 'call',
      amount: 4,
    });
    expect(strong.calls).toHaveLength(1);
    expect(decideTag(facing, { equity: stubEquity(0).fn })).toStrictEqual({
      seat: 3,
      type: 'fold',
    });

    const free = playerView(stateAfter(FLOP_FREE), 3);
    const unused = stubEquity(0);
    expect(decideTag(free, { equity: unused.fn })).toStrictEqual({ seat: 3, type: 'check' });
    expect(unused.calls).toHaveLength(0);

    const preflop = playerView(stateAfter([]), 4);
    const neverPreflop = stubEquity(1);
    expect(preflop.legalActions).toContainEqual(decideTag(preflop, { equity: neverPreflop.fn }));
    expect(neverPreflop.calls).toHaveLength(0);
  });

  it('propagates advice errors', () => {
    expect(() => decideTag(playerView(stateAfter([]), 3))).toThrow(
      new RangeError('Seat 3 is not to act'),
    );
    expect(() => decideTag(playerView(stateAfter(FLOP_BET), 6))).toThrow(
      new RangeError('Seat 6 is not to act'),
    );
    const nine = stateAfter([], 9);
    expect(() =>
      decideTag(playerView(nine, nine.toAct as SeatNumber), { chart: SIX_MAX_CHART }),
    ).toThrow(new RangeError('The 6-max chart does not fit 9 dealt-in seats'));
  });

  it('bots import only PlayerView-boundary types from the engine', () => {
    const dir = join(REPO_ROOT, 'src/bots');
    const files = readdirSync(dir).filter((name) => name.endsWith('.ts'));
    expect(files).toContain('tag.ts');
    for (const name of files) {
      const text = readFileSync(join(dir, name), 'utf8');
      expect([...text.matchAll(IMPORT)].length).toBeGreaterThan(0);
      expect(boundaryProblems(`src/bots/${name}`, text)).toEqual([]);
    }

    const probe = [
      "import { applyAction } from '../engine/hand';",
      "import type { HandState } from '../engine/hand';",
      "import type { Card } from '../engine/cards';",
      "import type { Action } from '../engine/hand';",
      "import { useState } from 'react';",
      "import { Table } from '../ui/table';",
      "import { recommend } from '../advice/recommend';",
    ].join('\n');
    expect(boundaryProblems('src/bots/probe.ts', probe)).toEqual([
      "src/bots/probe.ts: engine import import { applyAction } from '../engine/hand';",
      "src/bots/probe.ts: engine import import type { HandState } from '../engine/hand';",
      "src/bots/probe.ts: engine import import type { Card } from '../engine/cards';",
      "src/bots/probe.ts: package import import { useState } from 'react';",
      "src/bots/probe.ts: UI import import { Table } from '../ui/table';",
    ]);
  });
});
