import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { findSyncConflictCopies, isSyncConflictCopy } from '../../tools/lint/sync-copies.js';
import { REPO_ROOT, runInSandbox, TOOLCHAIN_TIMEOUT_MS } from '../support/sandbox';

const CLI = join(REPO_ROOT, 'tools/lint/sync-copies.js');

const tempDirs: string[] = [];

function makeTree(paths: string[]): string {
  const root = mkdtempSync(join(tmpdir(), 'tlh-sync-copies-'));
  tempDirs.push(root);
  for (const path of paths) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), '');
  }
  return root;
}

function runCli(root: string): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [CLI, root], { encoding: 'utf8' });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function git(args: string[]): { status: number | null; stdout: string } {
  const result = spawnSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' });
  return { status: result.status, stdout: result.stdout };
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('sync conflict copies', () => {
  it('isSyncConflictCopy matches iCloud conflict names and nothing else', () => {
    const cases: [string, boolean][] = [
      ['x 2.ts', true],
      ['doc-100 - Hand records 2.md', true],
      ['foo.test 2.ts', true],
      ['src 2', true],
      ['index 12', true],
      ['.env 2', true],
      ['x.ts', false],
      ['task-1.54 - Stop-file-sync-conflict-copies-from-reaching-commits.md', false],
      ['task-9 - 3.5bb-sizing.md', false],
      ['x2.ts', false],
      ['x-2.ts', false],
      [' 2.ts', false],
    ];
    for (const [name, expected] of cases) {
      expect(isSyncConflictCopy(name), name).toBe(expected);
    }
  });

  it('findSyncConflictCopies returns sorted POSIX paths and reports a copied directory once', () => {
    const root = makeTree(['b/y 3.ts', 'a/x 2.ts', 'dir 2/inner 2.ts', 'a/ok.ts']);
    expect(findSyncConflictCopies(root)).toEqual(['a/x 2.ts', 'b/y 3.ts', 'dir 2']);
  });

  it('the check fails naming each conflict copy and skips .git and node_modules', () => {
    const root = makeTree([
      'src/x 2.ts',
      'src/x.ts',
      'backlog/docs/doc-100 - Foo 2.md',
      'e2e 2/a.ts',
      '.git/index 2',
      'node_modules/pkg/a 2.js',
    ]);
    const result = runCli(root);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('File-sync conflict copies found');
    expect(result.stderr).toContain('src/x 2.ts');
    expect(result.stderr).toContain('backlog/docs/doc-100 - Foo 2.md');
    expect(result.stderr).toContain('e2e 2');
    expect(result.stderr).not.toContain('index 2');
    expect(result.stderr).not.toContain('a 2.js');
    expect(result.stderr).not.toContain('src/x.ts');
  });

  it('the check passes when there are no conflict copies', () => {
    const root = makeTree(['src/x.ts', 'backlog/tasks/task-1.54 - Stop-file-sync.md']);
    const result = runCli(root);

    expect(result.status).toBe(0);
    expect(result.stdout + result.stderr).toBe('');
  });

  it(
    'npm run lint fails naming a conflict copy',
    () => {
      const result = runInSandbox({ 'src/ui/probe 2.ts': 'export const x = 1;\n' }, 'lint');

      expect(result.output).toContain('src/ui/probe 2.ts');
      expect(result.output).toContain('File-sync conflict copies found');
      expect(result.exitCode).not.toBe(0);
    },
    TOOLCHAIN_TIMEOUT_MS,
  );

  it('gitignore ignores conflict copies but no tracked file', () => {
    const copies = [
      'src/x 2.ts',
      'backlog/docs/doc-100 - Foo 2.md',
      'src 2/a.ts',
      'tests/foo.test 12.ts',
    ];
    const ignored = git(['check-ignore', '--no-index', ...copies]);
    expect(ignored.status).toBe(0);
    expect(ignored.stdout.split('\n').filter(Boolean)).toEqual(copies);

    const trackedIgnored = git(['ls-files', '-ci', '--exclude-standard']);
    expect(trackedIgnored.status).toBe(0);
    expect(trackedIgnored.stdout).toBe('');

    const tracked = git(['ls-files']);
    expect(tracked.status).toBe(0);
    const trackedCopies = tracked.stdout
      .split('\n')
      .filter(Boolean)
      .filter((path) => isSyncConflictCopy(basename(path)));
    expect(trackedCopies).toEqual([]);
  });

  it('README says not to keep the repo in an iCloud-synced folder and how to move it', () => {
    const readme = readFileSync(join(REPO_ROOT, 'README.md'), 'utf8');
    const start = readme.indexOf('## Where to keep the repo');
    expect(start).toBeGreaterThanOrEqual(0);
    const next = readme.indexOf('\n## ', start + 1);
    const section = readme.slice(start, next === -1 ? undefined : next);

    const prose = section.replace(/\s+/g, ' ');

    expect(prose).toMatch(/must not live in an iCloud-synced folder/);
    expect(prose).toContain('Desktop & Documents');
    expect(section).toMatch(/^mv .+ ~\/Code\b/m);
    expect(prose).toMatch(/delete any conflict copies listed by `npm run lint`/i);
    expect(prose).toContain(
      '"Desktop & Documents Folders" in System Settings → Apple Account → iCloud → iCloud Drive',
    );
  });
});
