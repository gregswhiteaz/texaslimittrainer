import { join } from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT, TOOLCHAIN_TIMEOUT_MS } from '../support/sandbox';

const PROCESS_GLOBAL = ['process global', 'REQ-028.1'];

const PROBE_FILES = ['src/bots/probe.ts', 'src/advice/probe.ts', 'src/engine/bot-random.ts'];

const PROCESS_PROBES = [
  'export const r = process.hrtime()[1];\n',
  'export const r = process.uptime();\n',
  "export const c: unknown = process.getBuiltinModule('node:crypto');\n",
  'export const r = globalThis.process.hrtime();\n',
];

const CLEAN_PROBE = [
  'declare global {',
  '  interface ProbeGlobal {',
  '    process: number;',
  '  }',
  '}',
  'const o = { process: 1 };',
  'export const p = o.process;',
  'export interface I {',
  '  process: number;',
  '}',
  '',
].join('\n');

async function errorsOf(eslint: ESLint, code: string, file: string): Promise<string[]> {
  const [lint] = await eslint.lintText(code, { filePath: join(REPO_ROOT, file) });
  return (lint?.messages ?? []).filter((m) => m.severity === 2).map((m) => m.message);
}

describe('bot boundary: the Node process global', () => {
  it(
    'process and globalThis.process in bot decision code fail lint',
    async () => {
      const eslint = new ESLint({ cwd: REPO_ROOT });
      for (const file of PROBE_FILES) {
        for (const code of PROCESS_PROBES) {
          const errors = await errorsOf(eslint, code, file);
          expect(
            errors.some((message) => PROCESS_GLOBAL.every((text) => message.includes(text))),
            `${file}: ${code}\n${errors.join('\n')}`,
          ).toBe(true);
        }
      }
    },
    TOOLCHAIN_TIMEOUT_MS,
  );

  it(
    'declare global and process property names lint clean',
    async () => {
      const eslint = new ESLint({ cwd: REPO_ROOT });
      for (const file of PROBE_FILES) {
        const errors = await errorsOf(eslint, CLEAN_PROBE, file);
        const flagged = errors.filter(
          (message) =>
            message.includes('process global') ||
            message.includes('global alias') ||
            message.includes('Function constructor'),
        );
        expect(flagged, file).toEqual([]);
      }
    },
    TOOLCHAIN_TIMEOUT_MS,
  );
});
