import { join } from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT, TOOLCHAIN_TIMEOUT_MS } from '../support/sandbox';

const FUNCTION_CONSTRUCTOR = ['Function constructor', 'REQ-028.1'];
const GLOBAL_ALIAS = ['global alias', 'REQ-028.1'];

const PROBE_FILES = ['src/bots/probe.ts', 'src/advice/probe.ts'];

const CONSTRUCTOR_PROBES = [
  'export const F: unknown = (() => 0).constructor;\n',
  'export const F: unknown = [].constructor.constructor;\n',
  "const f = (): number => 0;\nexport const F: unknown = f['constructor'];\n",
  "const f = (): number => 0;\nexport const F: unknown = Reflect.get(f, 'constructor');\n",
  'const f = (): number => 0;\nexport const F: unknown = f[`constructor`];\n',
  'const { constructor: F } = (): number => 0;\nexport { F };\n',
];

const FUNCTION_PROBES = [
  'export const F: unknown = globalThis.Function;\n',
  "export const r: unknown = Reflect.apply(Function, undefined, ['return 1']);\n",
  "export const r: unknown = Reflect.construct(Function, ['return 1']);\n",
  'export const F = Function;\n',
];

const GLOBAL_PROBES = [
  'export const r = global.Math.random();\n',
  "export const d: unknown = global['indexedDB'];\n",
  'export const g: unknown = global;\n',
  'export const r: unknown = globalThis.global;\n',
];

const CLEAN_PROBE = [
  'class E extends Error {',
  '  constructor(m: string) {',
  '    super(m);',
  '  }',
  '}',
  'const o = { global: 1, constructor: 2 };',
  'export const g = o.global;',
  'export interface I {',
  '  global: number;',
  '  constructor: number;',
  '}',
  'export { E };',
  '',
].join('\n');

async function errorsOf(eslint: ESLint, code: string, file: string): Promise<string[]> {
  const [lint] = await eslint.lintText(code, { filePath: join(REPO_ROOT, file) });
  return (lint?.messages ?? []).filter((m) => m.severity === 2).map((m) => m.message);
}

async function expectEachProbeFails(probes: string[], expected: string[]): Promise<void> {
  const eslint = new ESLint({ cwd: REPO_ROOT });
  for (const file of PROBE_FILES) {
    for (const code of probes) {
      const errors = await errorsOf(eslint, code, file);
      expect(
        errors.some((message) => expected.every((text) => message.includes(text))),
        `${file}: ${code}\n${errors.join('\n')}`,
      ).toBe(true);
    }
  }
}

describe('bot boundary: Function constructor and the Node global alias', () => {
  it(
    'constructor access in bot and advice code fails lint',
    () => expectEachProbeFails(CONSTRUCTOR_PROBES, FUNCTION_CONSTRUCTOR),
    TOOLCHAIN_TIMEOUT_MS,
  );

  it(
    'globalThis.Function and Reflect with Function fail lint',
    () => expectEachProbeFails(FUNCTION_PROBES, FUNCTION_CONSTRUCTOR),
    TOOLCHAIN_TIMEOUT_MS,
  );

  it(
    'the Node global alias fails lint',
    () => expectEachProbeFails(GLOBAL_PROBES, GLOBAL_ALIAS),
    TOOLCHAIN_TIMEOUT_MS,
  );

  it(
    'real bot and advice code and legitimate constructor and global names lint clean',
    async () => {
      const eslint = new ESLint({ cwd: REPO_ROOT });
      for (const file of PROBE_FILES) {
        const [lint] = await eslint.lintText(CLEAN_PROBE, { filePath: join(REPO_ROOT, file) });
        const flagged = (lint?.messages ?? [])
          .map((m) => m.message)
          .filter(
            (message) =>
              message.includes('Function constructor') || message.includes('global alias'),
          );
        expect(flagged, file).toEqual([]);
      }

      const results = await eslint.lintFiles([
        'src/bots',
        'src/advice',
        'src/engine/bot-random.ts',
      ]);
      expect(results.length).toBeGreaterThan(0);
      const errors = results.flatMap((r) =>
        r.messages.filter((m) => m.severity === 2).map((m) => `${r.filePath}: ${m.message}`),
      );
      expect(errors).toEqual([]);
    },
    TOOLCHAIN_TIMEOUT_MS,
  );
});
