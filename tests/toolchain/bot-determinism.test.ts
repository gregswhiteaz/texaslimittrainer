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

async function errors(dir: string, code: string): Promise<string[]> {
  const [result] = await eslint.lintText(`${code}\n`, {
    filePath: join(REPO_ROOT, 'src', dir, 'probe.ts'),
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
});
