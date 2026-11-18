import { describe, expect, it } from 'vitest';
import { HEADLESS_DIRS } from '../../tools/lint/headless-boundary.js';
import { runInSandbox, TOOLCHAIN_TIMEOUT_MS } from '../support/sandbox';

function forbiddenUseFiles(dir: string): Record<string, string> {
  return {
    [`src/${dir}/react.ts`]: "import { useState } from 'react';\n\nexport const s = useState;\n",
    [`src/${dir}/reactdom.ts`]:
      "import { createRoot } from 'react-dom/client';\n\nexport const c = createRoot;\n",
    [`src/${dir}/dom.ts`]: 'export const t = document.title;\n',
    [`src/${dir}/idb.ts`]: 'export const db = indexedDB;\n',
    [`src/${dir}/ui.ts`]: "import App from '../ui/App';\n\nexport const a = App;\n",
    'src/ui/App.ts': "export default function App(): string {\n  return 'app';\n}\n",
  };
}

/** Asserts that some output line contains both the expected text and the requirement id. */
function expectLineWithRequirement(output: string, expected: string): void {
  const line = output.split('\n').find((l) => l.includes(expected));
  expect(line, `no line contains ${expected}\n${output}`).toBeDefined();
  expect(line).toContain('REQ-059.2');
}

describe('headless boundary via npm run lint', () => {
  it(
    'lint reports each forbidden React, DOM, IndexedDB and UI use in every headless folder',
    () => {
      for (const dir of HEADLESS_DIRS) {
        const result = runInSandbox(forbiddenUseFiles(dir), 'lint');

        expect(result.exitCode, `${dir}: ${result.output}`).not.toBe(0);
        expectLineWithRequirement(result.output, "'react' import is restricted");
        expectLineWithRequirement(result.output, "'react-dom/client' import is restricted");
        expectLineWithRequirement(result.output, "Unexpected use of 'document'");
        expectLineWithRequirement(result.output, "Unexpected use of 'indexedDB'");
        expectLineWithRequirement(result.output, "'../ui/App' import is restricted");
      }
    },
    TOOLCHAIN_TIMEOUT_MS,
  );

  it(
    'lint allows React in src/ui and Node-safe code in headless folders',
    () => {
      const result = runInSandbox(
        {
          'src/engine/ok.ts':
            'export const ok = (n: number): number => Math.max(n, 0) + structuredClone([1]).length;\n',
          'src/ui/ok.tsx': [
            "import { useState } from 'react';",
            '',
            'export function Counter() {',
            '  const [count, setCount] = useState(0);',
            '  return <button onClick={() => setCount(count + 1)}>{count}</button>;',
            '}',
            '',
          ].join('\n'),
        },
        'lint',
      );

      expect(result.exitCode, result.output).toBe(0);
    },
    TOOLCHAIN_TIMEOUT_MS,
  );

  it(
    'lint reports globalThis access, dynamic import and type-only React import in headless folders',
    () => {
      const result = runInSandbox(
        {
          'src/engine/bypass.ts': [
            "import type { ReactNode } from 'react';",
            '',
            'export type Child = ReactNode;',
            'export const d = globalThis.document;',
            "export const lazy = () => import('./other');",
            '',
          ].join('\n'),
        },
        'lint',
      );

      expect(result.exitCode).not.toBe(0);
      expect(result.output).toContain("'globalThis.document' is restricted");
      expect(result.output).toContain('Dynamic import() is not allowed in headless modules');
      expect(result.output).toContain("'react' import is restricted");
    },
    TOOLCHAIN_TIMEOUT_MS,
  );
});
