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
    result = runInSandbox({ ...TYPE_PROBES, ...ADVICE_PROBES, ...GOLDEN_PROBE }, 'lint');
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
  });

  it(
    'PlayerView-boundary types in type position pass',
    async () => {
      const eslint = new ESLint({ cwd: REPO_ROOT });
      expect(await errorsOf(eslint, TYPE_CLEAN_PROBE, 'src/bots/probe.ts')).toEqual([]);

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
