import { join } from 'node:path';
import { ESLint } from 'eslint';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { BROWSER_ONLY_GLOBALS, HEADLESS_DIRS } from '../../tools/lint/headless-boundary.js';
import { REPO_ROOT, TOOLCHAIN_TIMEOUT_MS } from '../support/sandbox';

const NODE_SAFE_GLOBALS = [
  'console',
  'setTimeout',
  'URL',
  'crypto',
  'structuredClone',
  'performance',
  'Math',
  'TextEncoder',
  'queueMicrotask',
];

const eslint = new ESLint({ cwd: REPO_ROOT });

async function restrictedGlobalMessages(dir: string, name: string): Promise<string[]> {
  const [result] = await eslint.lintText(`export const probe = ${name};\n`, {
    filePath: join(REPO_ROOT, 'src', dir, 'probe.ts'),
  });
  return (result?.messages ?? [])
    .filter((m) => m.ruleId === 'no-restricted-globals')
    .map((m) => m.message);
}

describe('headless boundary globals (property)', () => {
  it('BROWSER_ONLY_GLOBALS includes browser-only APIs and excludes Node-safe ones', () => {
    for (const name of [
      'window',
      'document',
      'self',
      'location',
      'alert',
      'HTMLElement',
      'indexedDB',
      'IDBDatabase',
      'localStorage',
      'sessionStorage',
      'navigator',
    ]) {
      expect(BROWSER_ONLY_GLOBALS).toContain(name);
    }
    for (const name of [...NODE_SAFE_GLOBALS, 'fetch', 'Event', 'globalThis']) {
      expect(BROWSER_ONLY_GLOBALS).not.toContain(name);
    }
    expect(BROWSER_ONLY_GLOBALS).toEqual([...new Set(BROWSER_ONLY_GLOBALS)].sort());
  });

  it(
    'every browser-only global is reported in every headless folder and Node-safe globals are not',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...HEADLESS_DIRS),
          fc.constantFrom(...BROWSER_ONLY_GLOBALS),
          async (dir, name) => {
            const messages = await restrictedGlobalMessages(dir, name);
            expect(messages.some((m) => m.includes(`'${name}'`))).toBe(true);
          },
        ),
        { numRuns: 200 },
      );

      for (const dir of HEADLESS_DIRS) {
        for (const name of NODE_SAFE_GLOBALS) {
          expect(await restrictedGlobalMessages(dir, name), `${dir}: ${name}`).toEqual([]);
        }
      }
    },
    TOOLCHAIN_TIMEOUT_MS,
  );
});
