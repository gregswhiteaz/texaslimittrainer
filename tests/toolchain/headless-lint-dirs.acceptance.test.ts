import { describe, expect, it } from 'vitest';
import {
  HEADLESS_DIRS,
  HEADLESS_FILES,
  LINT_ONLY_HEADLESS_DIRS,
} from '../../tools/lint/headless-boundary.js';
import { runInSandbox, TOOLCHAIN_TIMEOUT_MS } from '../support/sandbox';

const PROBE = [
  "import { useState } from 'react';",
  "import { createRoot } from 'react-dom/client';",
  "import App from '../ui/App';",
  '',
  'export const probe = [useState, createRoot, App];',
  '',
].join('\n');

const NEW_DIRS = ['playtest', 'table'];

/** Returns the ESLint stylish block for one file: its header line up to the next blank line. */
function fileBlock(output: string, file: string): string[] {
  const lines = output.split('\n');
  const start = lines.findIndex((line) => line.trimEnd().endsWith(file));
  expect(start, `no file header for ${file}\n${output}`).toBeGreaterThanOrEqual(0);
  const end = lines.findIndex((line, i) => i > start && line.trim() === '');
  return lines.slice(start, end === -1 ? undefined : end);
}

describe('headless lint covers src/playtest and src/table', () => {
  it(
    'lint rejects UI and browser imports in src/playtest and src/table, naming each file',
    () => {
      const files: Record<string, string> = {
        'src/ui/App.ts': "export default function App(): string {\n  return 'app';\n}\n",
      };
      for (const dir of NEW_DIRS) files[`src/${dir}/ui-probe.ts`] = PROBE;

      const result = runInSandbox(files, 'lint');

      expect(result.exitCode, result.output).not.toBe(0);
      for (const dir of NEW_DIRS) {
        const block = fileBlock(result.output, `src/${dir}/ui-probe.ts`);
        for (const expected of [
          "'react' import is restricted",
          "'react-dom/client' import is restricted",
          "'../ui/App' import is restricted",
        ]) {
          const line = block.find((l) => l.includes(expected));
          expect(line, `${dir}: no line contains ${expected}\n${result.output}`).toBeDefined();
          expect(line).toContain('REQ-059.2');
        }
      }
    },
    TOOLCHAIN_TIMEOUT_MS,
  );

  it('the lint-only headless folders are playtest and table', () => {
    expect(LINT_ONLY_HEADLESS_DIRS).toEqual(['playtest', 'table']);
    expect(HEADLESS_FILES).toEqual(
      expect.arrayContaining([
        'src/playtest/**',
        'src/table/**',
        ...HEADLESS_DIRS.map((dir) => `src/${dir}/**`),
      ]),
    );
  });
});
