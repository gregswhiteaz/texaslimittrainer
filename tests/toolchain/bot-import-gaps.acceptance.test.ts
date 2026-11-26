import { join } from 'node:path';
import { ESLint } from 'eslint';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  REPO_ROOT,
  runInSandbox,
  TOOLCHAIN_TIMEOUT_MS,
  type SandboxResult,
} from '../support/sandbox';

const BOUNDARY = ['PlayerView-boundary', 'REQ-025.1'];
const ADVICE = ['Advice code that bots use', 'REQ-025.1'];

const TYPE_PROBES: Record<string, string> = {
  'src/bots/type-hand-state.ts': "export type H = import('../engine/hand').HandState;\n",
  'src/bots/type-hand-module.ts': "export type M = typeof import('../engine/hand');\n",
  'src/bots/type-cards.ts': "export type C = import('../engine/cards').Card;\n",
  'src/bots/type-dot.ts': "export type S = import('../engine/./hand').Action;\n",
  'src/bots/styles/type-deck.ts': "export type D = import('../../engine/deck').ReplayCode;\n",
};

const CREATE_HAND = "import { createHand } from '../engine/hand';\n\nexport { createHand };\n";

const ADVICE_PROBES: Record<string, string> = {
  'src/advice/probe-create-hand.ts': CREATE_HAND,
  'src/advice/probe-hand-state.ts':
    "import type { HandState } from '../engine/hand';\n\nexport type { HandState };\n",
  'src/advice/probe-view-fn.ts':
    "import { playerView } from '../engine/player-view';\n\nexport { playerView };\n",
  'src/advice/probe-deck.ts':
    "import type { ReplayCode } from '../engine/deck';\n\nexport type { ReplayCode };\n",
};

const GOLDEN_PROBE = {
  'src/bots/golden.ts':
    "import { parseGoldenSpots } from '../advice/golden';\n\nexport { parseGoldenSpots };\n",
};

const GOLDEN_PATH_PROBES: Record<string, string> = {
  'src/bots/golden-js.ts':
    "import { parseGoldenSpots } from '../advice/golden.js';\n\nexport { parseGoldenSpots };\n",
  'src/bots/golden-ts.ts':
    "import { parseGoldenSpots } from '../advice/golden.ts';\n\nexport { parseGoldenSpots };\n",
  'src/bots/golden-type.ts':
    "export type G = typeof import('../advice/golden').parseGoldenSpots;\n",
  'src/bots/golden-type-js.ts':
    "export type G = typeof import('../advice/golden.js').parseGoldenSpots;\n",
};

const BOT_ALLOW_LIST_PROBES: Record<string, string> = {
  'src/bots/store.ts':
    "import { sharedHandStore } from '../storage/hand-store';\n\nexport { sharedHandStore };\n",
  'src/bots/table-state.ts':
    "import type { TableState } from '../table/session';\n\nexport type { TableState };\n",
  'src/bots/table-state-inline.ts':
    "import { type TableState } from '../table/session';\n\nexport type { TableState };\n",
  'src/bots/table-state-type.ts': "export type T = import('../table/session').TableState;\n",
  'src/bots/table-state-js.ts':
    "import type { TableState } from '../table/session.js';\n\nexport type { TableState };\n",
  'src/bots/table-value.ts': "import { botTurn } from '../table/session';\n\nexport { botTurn };\n",
  'src/bots/table-lineup-value.ts':
    "import { LineUpName } from '../table/session';\n\nexport type { LineUpName };\n",
  'src/bots/table-reexport.ts': "export type { TableState } from '../table/session';\n",
  'src/bots/table-reexport-all.ts': "export * from '../table/session';\n",
  'src/bots/table-side-effect.ts': "import '../table/session';\n",
  'src/bots/table-dot.ts':
    "import type { TableState } from './../table/session';\n\nexport type { TableState };\n",
  'src/bots/hint.ts': "import { hintArrived } from '../table/hint';\n\nexport { hintArrived };\n",
  'src/bots/runner.ts': "import { runHands } from '../playtest/runner';\n\nexport { runHands };\n",
  'src/bots/runner-type.ts': "export type R = typeof import('../playtest/runner').runHands;\n",
};

const ADVICE_ALLOW_LIST_PROBES: Record<string, string> = {
  'src/advice/probe-golden.ts':
    "import { parseGoldenSpots } from './golden';\n\nexport { parseGoldenSpots };\n",
  'src/advice/probe-golden-js.ts':
    "import { parseGoldenSpots } from './golden.js';\n\nexport { parseGoldenSpots };\n",
  'src/advice/probe-golden-all.ts': "export * from './golden';\n",
  'src/advice/probe-table.ts':
    "import { dealHand, type TableState } from '../table/session';\n\nexport { dealHand };\nexport type { TableState };\n",
  'src/advice/probe-table-reexport.ts': "export { botTurn } from '../table/session';\n",
  'src/advice/probe-table-type.ts': "export type T = import('../table/session').TableState;\n",
  'src/advice/probe-storage.ts': "export { sharedHandStore } from '../storage/hand-store';\n",
  'src/advice/probe-playtest.ts':
    "import { runHands } from '../playtest/runner';\n\nexport { runHands };\n",
  'src/advice/probe-package.ts':
    "import { readFileSync } from 'node:fs';\n\nexport { readFileSync };\n",
  'src/advice/probe-dot.ts':
    "import { applyAction } from '../engine/./hand';\n\nexport { applyAction };\n",
  'src/advice/probe-double-slash.ts':
    "import { applyAction } from '../engine//hand';\n\nexport { applyAction };\n",
  'src/advice/probe-parent.ts':
    "import { applyAction } from '../engine/hand/../hand';\n\nexport { applyAction };\n",
  'src/advice/probe-dot-parent.ts':
    "import { sharedHandStore } from './../storage/hand-store';\n\nexport { sharedHandStore };\n",
};

const LINEUP_CLEAN_PROBE = [
  "import type { LineUpName, SessionConfig, SessionSeat } from '../table/session';",
  "import { type LineUpName as Name } from '../table/session';",
  "import { recommend } from '../advice/recommend.js';",
  '',
  "export type { SessionSeat } from '../table/session';",
  "export type T = [LineUpName, SessionConfig, SessionSeat, Name, import('../table/session').LineUpName];",
  'export const probe = recommend;',
  '',
].join('\n');

const TYPE_CLEAN_PROBE = [
  'export type T = [',
  "  import('../engine/player-view').PlayerView,",
  "  import('../engine/player-view').SeatPolicy,",
  "  import('../engine/player-view').PublicPlayer,",
  "  import('../engine/player-view').ShownHand,",
  "  import('../engine/player-view').EarlierShowdown,",
  "  import('../engine/hand').Action,",
  "  import('../engine/hand').SeatNumber,",
  "  import('../engine/hand').Street,",
  "  import('../advice/recommend').Recommendation,",
  '];',
  '',
].join('\n');

const ADVICE_CLEAN_PROBE = [
  "import { STREET_BET_CAP, type Action } from '../engine/hand';",
  "import { evaluate } from '../engine/hand-evaluator';",
  "import { formatCard } from '../engine/cards';",
  "import { splitMix32 } from '../engine/seeded-random';",
  "import type { PlayerView } from '../engine/player-view';",
  '',
  'export { STREET_BET_CAP, evaluate, formatCard, splitMix32 };',
  'export type { Action, PlayerView };',
  '',
].join('\n');

/** Returns the ESLint stylish block for one file: its header line up to the next blank line. */
function fileBlock(output: string, file: string): string[] {
  const lines = output.split('\n');
  const start = lines.findIndex((line) => line.trimEnd().endsWith(file));
  expect(start, `no file header for ${file}\n${output}`).toBeGreaterThanOrEqual(0);
  const end = lines.findIndex((line, i) => i > start && line.trim() === '');
  return lines.slice(start, end === -1 ? undefined : end);
}

function expectError(result: SandboxResult, file: string, expected: string[]): void {
  const block = fileBlock(result.output, file);
  expect(
    block.some((line) => line.includes('error') && expected.every((text) => line.includes(text))),
    `${file}: ${expected.join(' + ')}\n${block.join('\n')}`,
  ).toBe(true);
}

async function errorsOf(eslint: ESLint, code: string, file: string): Promise<string[]> {
  const [lint] = await eslint.lintText(code, { filePath: join(REPO_ROOT, file) });
  return (lint?.messages ?? []).filter((m) => m.severity === 2).map((m) => m.message);
}

describe('bot import gaps: type-position imports and the advice path', () => {
  let result: SandboxResult;

  beforeAll(() => {
    result = runInSandbox(
      {
        ...TYPE_PROBES,
        ...ADVICE_PROBES,
        ...GOLDEN_PROBE,
        ...GOLDEN_PATH_PROBES,
        ...BOT_ALLOW_LIST_PROBES,
        ...ADVICE_ALLOW_LIST_PROBES,
      },
      'lint',
    );
  }, TOOLCHAIN_TIMEOUT_MS);

  it('type-position engine imports in bot code fail npm run lint', () => {
    expect(result.exitCode, result.output).not.toBe(0);
    for (const file of Object.keys(TYPE_PROBES)) expectError(result, file, BOUNDARY);
  });

  it('advice code that imports hand state fails npm run lint', () => {
    expect(result.exitCode, result.output).not.toBe(0);
    for (const file of Object.keys(ADVICE_PROBES)) expectError(result, file, ADVICE);
  });

  it('bot code that imports advice/golden fails npm run lint', () => {
    expect(result.exitCode, result.output).not.toBe(0);
    expectError(result, 'src/bots/golden.ts', BOUNDARY);
    for (const file of Object.keys(GOLDEN_PATH_PROBES)) expectError(result, file, BOUNDARY);
  });

  it('bot code that imports modules outside the allow-list fails npm run lint', () => {
    expect(result.exitCode, result.output).not.toBe(0);
    for (const file of Object.keys(BOT_ALLOW_LIST_PROBES)) expectError(result, file, BOUNDARY);
  });

  it('advice code that imports golden, table, storage, playtest or packages fails npm run lint', () => {
    expect(result.exitCode, result.output).not.toBe(0);
    for (const file of Object.keys(ADVICE_ALLOW_LIST_PROBES)) expectError(result, file, ADVICE);
  });

  it(
    'PlayerView-boundary types in type position pass',
    async () => {
      const eslint = new ESLint({ cwd: REPO_ROOT });
      expect(await errorsOf(eslint, TYPE_CLEAN_PROBE, 'src/bots/probe.ts')).toEqual([]);
      expect(await errorsOf(eslint, LINEUP_CLEAN_PROBE, 'src/bots/probe.ts')).toEqual([]);

      const bots = await eslint.lintFiles(['src/bots']);
      expect(bots.length).toBeGreaterThan(0);
      expect(bots.flatMap((r) => r.messages.filter((m) => m.severity === 2))).toEqual([]);
    },
    TOOLCHAIN_TIMEOUT_MS,
  );

  it(
    'bot-reachable advice code lints clean and golden.ts is exempt',
    async () => {
      const eslint = new ESLint({ cwd: REPO_ROOT });
      const real = await eslint.lintFiles(['src/advice', 'src/bots']);
      expect(real.some((r) => r.filePath.includes(join('src', 'advice')))).toBe(true);
      expect(real.flatMap((r) => r.messages.filter((m) => m.severity === 2))).toEqual([]);

      expect(await errorsOf(eslint, ADVICE_CLEAN_PROBE, 'src/advice/probe.ts')).toEqual([]);

      const golden = await errorsOf(eslint, CREATE_HAND, 'src/advice/golden.ts');
      expect(golden.some((message) => message.includes('Advice code that bots use'))).toBe(false);
    },
    TOOLCHAIN_TIMEOUT_MS,
  );
});
