import { beforeAll, describe, expect, it } from 'vitest';
import { runInSandbox, TOOLCHAIN_TIMEOUT_MS, type SandboxResult } from '../support/sandbox';

const PARAM_PROBE = [
  'export class Probe {',
  '  constructor(private readonly c: number) {}',
  '',
  '  value(): number {',
  '    return this.c;',
  '  }',
  '}',
  '',
].join('\n');

const JSON_PROBE = "import d from './data.json';\n\nexport const v = d;\n";

const ENUM_PROBE = 'export enum E {\n  A,\n}\n';

const OK_PROBE = [
  "import d from './data.json' with { type: 'json' };",
  '',
  'export class Probe {',
  '  readonly c: number;',
  '',
  '  constructor(c: number) {',
  '    this.c = c;',
  '  }',
  '}',
  '',
  'export const v = d;',
  '',
].join('\n');

const DYN_PROBE = "export const load = () => import('./x');\n";

const FILES: Record<string, string> = {
  'src/advice/param-probe.ts': PARAM_PROBE,
  'src/ui/param-probe.ts': PARAM_PROBE,
  'src/advice/json-probe.ts': JSON_PROBE,
  'src/advice/data.json': '{ "a": 1 }\n',
  'src/ui/json-probe.ts': JSON_PROBE,
  'src/ui/data.json': '{ "a": 1 }\n',
  'src/ui/enum-probe.ts': ENUM_PROBE,
  'src/ui/ok-probe.ts': OK_PROBE,
  'src/advice/x.ts': 'export const x = 1;\n',
  'src/advice/dyn-probe.ts': DYN_PROBE,
};

/** Returns the ESLint stylish block for one file: its header line up to the next blank line. */
function fileBlock(output: string, file: string): string[] {
  const lines = output.split('\n');
  const start = lines.findIndex((line) => line.trimEnd().endsWith(file));
  expect(start, `no file header for ${file}\n${output}`).toBeGreaterThanOrEqual(0);
  const end = lines.findIndex((line, i) => i > start && line.trim() === '');
  return lines.slice(start, end === -1 ? undefined : end);
}

function expectLine(result: SandboxResult, file: string, ...parts: string[]): void {
  const block = fileBlock(result.output, file);
  const line = block.find((l) => parts.every((part) => l.includes(part)));
  expect(line, `${file}: no line contains ${parts.join(' + ')}\n${result.output}`).toBeDefined();
}

describe('type-stripping lint rules', () => {
  let result: SandboxResult;

  beforeAll(() => {
    result = runInSandbox(FILES, 'lint');
  }, TOOLCHAIN_TIMEOUT_MS);

  it('lint rejects parameter properties, attribute-less JSON imports and enums in src, naming each file', () => {
    expect(result.exitCode, result.output).not.toBe(0);
    for (const file of ['src/advice/param-probe.ts', 'src/ui/param-probe.ts']) {
      expectLine(result, file, '@typescript-eslint/parameter-properties');
    }
    for (const file of ['src/advice/json-probe.ts', 'src/ui/json-probe.ts']) {
      expectLine(result, file, "with { type: 'json' }", 'no-restricted-syntax');
    }
    expectLine(result, 'src/ui/enum-probe.ts', 'Enums are not erasable', 'no-restricted-syntax');
  });

  it('lint accepts explicit fields and attributed JSON imports and keeps the headless dynamic-import ban', () => {
    const lines = result.output.split('\n');
    expect(
      lines.some((line) => line.trimEnd().endsWith('src/ui/ok-probe.ts')),
      result.output,
    ).toBe(false);
    expectLine(
      result,
      'src/advice/dyn-probe.ts',
      'Dynamic import() is not allowed in headless modules',
    );
  });
});
