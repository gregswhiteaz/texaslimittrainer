import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { REPO_ROOT } from '../support/sandbox';

vi.setConfig({ testTimeout: 30_000 });

const SCRIPT = join(REPO_ROOT, 'tools/git/prune-merged-branches.js');

let dir: string;
let origin: string;
let clone: string;
let env: NodeJS.ProcessEnv;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'tlh-prune-'));
  origin = join(dir, 'origin.git');
  clone = join(dir, 'clone');
  // Isolate every git call from the real repository and the user's git config and hooks.
  env = {
    ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_'))),
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CEILING_DIRECTORIES: dir,
    GIT_AUTHOR_NAME: 'Test',
    GIT_AUTHOR_EMAIL: 'test@example.com',
    GIT_COMMITTER_NAME: 'Test',
    GIT_COMMITTER_EMAIL: 'test@example.com',
  };
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function git(cwd: string, ...args: string[]): string {
  const result = spawnSync('git', args, { cwd, env, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`);
  return result.stdout;
}

function prune(cwd: string, ...args: string[]) {
  const result = spawnSync(process.execPath, [SCRIPT, ...args], { cwd, env, encoding: 'utf8' });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

const refs = (cwd: string) => git(cwd, 'for-each-ref', '--format=%(refname) %(objectname)');
const branches = (cwd: string) =>
  git(cwd, 'for-each-ref', '--format=%(refname:short)', 'refs/heads/').split('\n').filter(Boolean);

function commit(message: string): void {
  git(clone, 'commit', '--allow-empty', '-m', message);
}

/** A bare origin and a clone with only `main`, pushed. */
function setUpMain(): void {
  git(dir, 'init', '--bare', '--initial-branch=main', origin);
  git(dir, 'clone', origin, clone);
  git(clone, 'checkout', '-b', 'main');
  commit('initial');
  git(clone, 'push', 'origin', 'main');
}

/** SPEC-04 fixture: `doit/a` and `doit/c` merged into `main`, `doit/b` one commit ahead; all pushed. */
function setUpFixture(): void {
  setUpMain();
  for (const name of ['a', 'c']) {
    git(clone, 'checkout', '-b', `doit/${name}`, 'main');
    commit(`work on ${name}`);
    git(clone, 'checkout', 'main');
    git(clone, 'merge', '--no-ff', '-m', `Merge doit/${name}`, `doit/${name}`);
  }
  git(clone, 'checkout', '-b', 'doit/b', 'main');
  commit('work on b');
  git(clone, 'checkout', 'main');
  git(clone, 'push', 'origin', 'main', 'doit/a', 'doit/b', 'doit/c');
  git(clone, 'fetch', 'origin');
}

/** Makes any push to origin fail and leave a marker, to prove no push happened. */
function forbidPush(): string {
  const marker = join(dir, 'pushed');
  const hooks = join(origin, 'hooks');
  mkdirSync(hooks, { recursive: true });
  const hook = join(hooks, 'pre-receive');
  writeFileSync(hook, `#!/bin/sh\ntouch '${marker}'\nexit 1\n`);
  chmodSync(hook, 0o755);
  return marker;
}

describe('prune-merged-branches', () => {
  it('dry run lists merged doit branches and deletes nothing', () => {
    setUpFixture();
    const before = { clone: refs(clone), origin: refs(origin) };
    const run = prune(clone);
    expect(run.stderr).toBe('');
    expect(run.code).toBe(0);
    expect(run.stdout).toBe(
      [
        'Dry run: nothing deleted. Re-run with --apply to delete these branches.',
        'Local doit/* branches merged into main (2):',
        '  doit/a',
        '  doit/c',
        'Remote doit/* branches on origin merged into origin/main (2):',
        '  doit/a',
        '  doit/c',
        '',
      ].join('\n'),
    );
    expect(run.stdout).not.toContain('doit/b');
    expect(refs(clone)).toBe(before.clone);
    expect(refs(origin)).toBe(before.origin);
  });

  it('apply deletes merged doit branches locally and on origin', () => {
    setUpFixture();
    const run = prune(clone, '--apply');
    expect(run.stderr).toBe('');
    expect(run.code).toBe(0);
    expect(run.stdout.startsWith('Deleting these branches.\n')).toBe(true);
    expect(run.stdout).toContain('Deleted 2 local and 2 remote branches.');
    expect(branches(clone)).toEqual(['doit/b', 'main']);
    expect(branches(origin)).toEqual(['doit/b', 'main']);
  });

  it('keeps the checked-out branch and branches not merged on origin', () => {
    setUpFixture();
    git(clone, 'merge', '--ff-only', 'doit/b');
    git(clone, 'checkout', 'doit/c');
    const run = prune(clone, '--apply');
    expect(run.stderr).toBe('');
    expect(run.code).toBe(0);
    expect(run.stdout).toContain('Skipped (checked out): doit/c');
    expect(run.stdout).toContain('Deleted 2 local and 2 remote branches.');
    expect(branches(clone)).toEqual(['doit/c', 'main']);
    expect(branches(origin)).toEqual(['doit/b', 'main']);
  });

  it('reports none when nothing is merged', () => {
    setUpMain();
    const marker = forbidPush();
    for (const args of [[], ['--apply']]) {
      const run = prune(clone, ...args);
      expect(run.stderr).toBe('');
      expect(run.code).toBe(0);
      expect(run.stdout).toContain('Local doit/* branches merged into main (0):\n  (none)\n');
      expect(run.stdout).toContain(
        'Remote doit/* branches on origin merged into origin/main (0):\n  (none)\n',
      );
    }
    expect(existsSync(marker)).toBe(false);
  });

  it('fails clearly outside a repo or without origin', () => {
    const plain = join(dir, 'plain');
    mkdirSync(plain);
    const outside = prune(plain);
    expect(outside.code).toBe(2);
    expect(outside.stderr).toContain('prune-merged-branches: not inside a git repository');

    setUpFixture();
    const before = { clone: refs(clone), origin: refs(origin) };
    const unknown = prune(clone, '--force');
    expect(unknown.code).toBe(2);
    expect(unknown.stderr).toBe(
      'prune-merged-branches: unknown argument --force. Usage: node tools/git/prune-merged-branches.js [--apply]\n',
    );
    expect(unknown.stdout).toBe('');
    expect(refs(clone)).toBe(before.clone);
    expect(refs(origin)).toBe(before.origin);

    git(clone, 'remote', 'set-url', 'origin', join(dir, 'missing.git'));
    const noOrigin = prune(clone, '--apply');
    expect(noOrigin.code).toBe(1);
    expect(noOrigin.stderr).toContain('prune-merged-branches: could not fetch origin');
    expect(refs(clone)).toBe(before.clone);
  });

  it('README documents the cleanup step', () => {
    const readme = readFileSync(join(REPO_ROOT, 'README.md'), 'utf8');
    const section = /^### Branch cleanup\n([\s\S]*?)(?=^#)/m.exec(readme)?.[1] ?? '';
    expect(section).toContain('node tools/git/prune-merged-branches.js\n');
    expect(section).toContain('node tools/git/prune-merged-branches.js --apply');
  });
});
