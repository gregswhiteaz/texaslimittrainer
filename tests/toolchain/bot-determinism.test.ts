import { join } from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT, TOOLCHAIN_TIMEOUT_MS } from '../support/sandbox';

const eslint = new ESLint({ cwd: REPO_ROOT });

const PROBES = [
  'export const probe = Math.random();',
  'export const probe = Date.now();',
  'export const probe = new Date();',
  'export function probe(a: Uint32Array): Uint32Array {\n  return crypto.getRandomValues(a);\n}',
  'export const probe = performance.now();',
  'export const probe = globalThis.crypto;',
];

const ALIAS_PROBES = [
  'export const probe = globalThis.Math.random();',
  'export const c = crypto;',
  'export const p = performance;',
  'export const D = Date;',
  'export const { random } = Math;',
  'export const m = Math;',
  'export const g = globalThis;',
  'let x: unknown;\nx = crypto;\nexport { x };',
  'declare function use(x: unknown): void;\nuse(crypto);',
];

const CLEAN_PROBES = [
  'export const probe = Math.floor(1.5);',
  'export const probe = Math.max(1, 2);',
  'const o = { crypto: 1, performance: 2 };\nexport const probe = o.crypto;',
  'export const random = (): number => 1;',
  'export const probe = globalThis.structuredClone;',
];

/** Lints `code` as src/<dir>/probe.ts, or as `file` (repo-relative) when given. */
async function errors(dir: string, code: string, file = `src/${dir}/probe.ts`): Promise<string[]> {
  const [result] = await eslint.lintText(`${code}\n`, {
    filePath: join(REPO_ROOT, file),
  });
  return (result?.messages ?? []).filter((m) => m.severity === 2).map((m) => m.message);
}

const isGuard = (message: string): boolean =>
  message.includes('Non-deterministic source in bot decision code') &&
  message.includes('REQ-028.1');

describe('bot determinism lint guard', () => {
  it(
    'bot decision code may not use unseeded randomness or time',
    async () => {
      for (const code of PROBES) {
        for (const dir of ['bots', 'advice']) {
          expect((await errors(dir, code)).some(isGuard), `${dir}: ${code}`).toBe(true);
        }
        expect((await errors('engine', code)).some(isGuard), `engine: ${code}`).toBe(false);
      }

      const browser = await errors('bots', 'export const probe = globalThis.document;');
      expect(browser.some((m) => m.includes('REQ-059.2'))).toBe(true);
      const dynamicImport = await errors('advice', "export const probe = import('./x');");
      expect(dynamicImport.some((m) => m.includes('REQ-059.2'))).toBe(true);

      expect(await errors('bots', 'export const probe = Math.floor(1.5);')).toEqual([]);
    },
    TOOLCHAIN_TIMEOUT_MS,
  );

  it(
    'aliased globals are caught in bot decision code',
    async () => {
      for (const code of ALIAS_PROBES) {
        for (const dir of ['bots', 'advice']) {
          expect((await errors(dir, code)).some(isGuard), `${dir}: ${code}`).toBe(true);
        }
        expect((await errors('engine', code)).some(isGuard), `engine: ${code}`).toBe(false);
      }
      for (const code of CLEAN_PROBES) {
        for (const dir of ['bots', 'advice']) {
          expect(await errors(dir, code), `${dir}: ${code}`).toEqual([]);
        }
      }
    },
    TOOLCHAIN_TIMEOUT_MS,
  );

  it(
    'the guard covers bot-random.ts and globalThis.Math',
    async () => {
      const code = 'export const probe = globalThis.Math.random();';
      for (const file of ['src/bots/probe.ts', 'src/advice/probe.ts', 'src/engine/bot-random.ts']) {
        expect((await errors('', code, file)).some(isGuard), file).toBe(true);
      }
      for (const probe of PROBES) {
        expect((await errors('', probe, 'src/engine/bot-random.ts')).some(isGuard), probe).toBe(
          true,
        );
      }
      const [real] = await eslint.lintFiles([join(REPO_ROOT, 'src/engine/bot-random.ts')]);
      expect(real?.messages ?? []).toEqual([]);
    },
    TOOLCHAIN_TIMEOUT_MS,
  );
});
