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

const ENGINE_PROBES: Record<string, string> = {
  'value-import': "import { applyAction } from '../engine/hand';\n\nexport { applyAction };\n",
  'create-hand': "import { createHand } from '../engine/hand';\n\nexport { createHand };\n",
  'hand-state': "import type { HandState } from '../engine/hand';\n\nexport type { HandState };\n",
  'bet-cap': "import { STREET_BET_CAP } from '../engine/hand';\n\nexport { STREET_BET_CAP };\n",
  'view-fn': "import { playerView } from '../engine/player-view';\n\nexport { playerView };\n",
  cards: "import type { Card } from '../engine/cards';\n\nexport type { Card };\n",
  'dot-segment': "import { applyAction } from '../engine/./hand';\n\nexport { applyAction };\n",
  'double-slash': "import { applyAction } from '../engine//hand';\n\nexport { applyAction };\n",
  'parent-segment':
    "import { applyAction } from '../engine/hand/../hand';\n\nexport { applyAction };\n",
};

const REACH_PROBES: Record<string, { code: string; expected: string[] }> = {
  reexport: { code: "export { applyAction } from '../engine/hand';\n", expected: BOUNDARY },
  'reexport-all': { code: "export * from '../engine/hand';\n", expected: BOUNDARY },
  'side-effect': { code: "import '../engine/hand';\n", expected: BOUNDARY },
  'side-effect-dot': { code: "import '../engine/./hand';\n", expected: BOUNDARY },
  dynamic: {
    code: "export const load = (): Promise<unknown> => import('../engine/hand');\n",
    expected: ['Dynamic import() is not allowed'],
  },
  package: {
    code: "import { readFileSync } from 'node:fs';\n\nexport { readFileSync };\n",
    expected: ['relative path', 'REQ-025.1'],
  },
};

const CLEAN_PROBE = [
  "import type { EarlierShowdown, PlayerView, PublicPlayer, SeatPolicy, ShownHand } from '../engine/player-view';",
  "import type { Action, SeatNumber, Street } from '../engine/hand';",
  "import tag from './styles/tag.json' with { type: 'json' };",
  "import { recommend } from '../advice/recommend';",
  '',
  'export type Probe = [EarlierShowdown, PlayerView, PublicPlayer, SeatPolicy, ShownHand, Action, SeatNumber, Street];',
  'export const probe = [tag, recommend];',
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

function expectError(result: SandboxResult, name: string, expected: string[]): void {
  const block = fileBlock(result.output, `src/bots/${name}.ts`);
  expect(
    block.some((line) => line.includes('error') && expected.every((text) => line.includes(text))),
    `${name}: ${expected.join(' + ')}\n${block.join('\n')}`,
  ).toBe(true);
}

describe('bot SeatPolicy lint boundary', () => {
  let result: SandboxResult;

  beforeAll(() => {
    const files: Record<string, string> = {};
    for (const [name, code] of Object.entries(ENGINE_PROBES)) files[`src/bots/${name}.ts`] = code;
    for (const [name, { code }] of Object.entries(REACH_PROBES))
      files[`src/bots/${name}.ts`] = code;
    result = runInSandbox(files, 'lint');
  }, TOOLCHAIN_TIMEOUT_MS);

  it('bot code that imports engine internals fails npm run lint, naming each file', () => {
    expect(result.exitCode, result.output).not.toBe(0);
    for (const name of Object.keys(ENGINE_PROBES)) expectError(result, name, BOUNDARY);
  });

  it('re-exports, side-effect, dynamic and package imports in bot code fail npm run lint', () => {
    expect(result.exitCode, result.output).not.toBe(0);
    for (const [name, { expected }] of Object.entries(REACH_PROBES)) {
      expectError(result, name, expected);
    }
  });

  it(
    'PlayerView-boundary type imports pass and only src/bots is restricted',
    async () => {
      const eslint = new ESLint({ cwd: REPO_ROOT });
      const errors = async (code: string, file: string): Promise<string[]> => {
        const [lint] = await eslint.lintText(code, { filePath: join(REPO_ROOT, file) });
        return (lint?.messages ?? []).filter((m) => m.severity === 2).map((m) => m.message);
      };

      expect(await errors(CLEAN_PROBE, 'src/bots/probe.ts')).toEqual([]);

      const bots = await eslint.lintFiles(['src/bots']);
      expect(bots.length).toBeGreaterThan(0);
      expect(bots.flatMap((r) => r.messages.filter((m) => m.severity === 2))).toEqual([]);

      const table = await errors(ENGINE_PROBES['value-import'] as string, 'src/table/probe.ts');
      expect(table.some((message) => message.includes('PlayerView-boundary'))).toBe(false);
    },
    TOOLCHAIN_TIMEOUT_MS,
  );
});
