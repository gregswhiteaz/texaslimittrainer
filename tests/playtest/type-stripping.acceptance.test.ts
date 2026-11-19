import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT, sandboxEnv } from '../support/sandbox';

const CHILD_TIMEOUT_MS = 30_000;
const LOADER = join(REPO_ROOT, 'tools/playtest/resolve-ts.js');

function runWithLoader(args: string[]) {
  return spawnSync(process.execPath, ['--import', LOADER, ...args], {
    cwd: REPO_ROOT,
    env: sandboxEnv(),
    encoding: 'utf8',
    timeout: CHILD_TIMEOUT_MS,
  });
}

describe('playtest modules load under Node type stripping', () => {
  it('loads every module reachable from tools/playtest/main.ts through the playtest loader', () => {
    const result = spawnSync(
      process.execPath,
      [
        '--import',
        './tools/playtest/resolve-ts.js',
        'tools/playtest/main.ts',
        '--hands',
        '1',
        '--seed',
        '1',
      ],
      { cwd: REPO_ROOT, env: sandboxEnv(), encoding: 'utf8', timeout: CHILD_TIMEOUT_MS },
    );

    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).not.toContain('ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX');
    expect(result.stderr).not.toContain('ERR_IMPORT_ATTRIBUTE');
    expect(result.stdout.trim()).not.toBe('');
  });

  it('the playtest loader rejects a parameter property and an attribute-less JSON import', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tlh-strip-'));
    try {
      writeFileSync(
        join(dir, 'param.ts'),
        'export class C { constructor(private readonly c: number) {} }\n',
      );
      writeFileSync(join(dir, 'data.json'), '{"a":1}');
      writeFileSync(join(dir, 'json.ts'), "import d from './data.json';\nexport const v = d;\n");

      const cases = [
        { file: 'param.ts', code: 'ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX' },
        { file: 'json.ts', code: 'ERR_IMPORT_ATTRIBUTE_MISSING' },
      ];
      for (const { file, code } of cases) {
        const result = runWithLoader([join(dir, file)]);
        expect(result.status, `${file}\n${result.stderr}`).not.toBe(0);
        expect(result.stderr, file).toContain(code);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
