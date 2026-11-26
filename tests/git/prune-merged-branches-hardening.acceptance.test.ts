import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { REPO_ROOT } from '../support/sandbox';

vi.setConfig({ testTimeout: 30_000 });

const SCRIPT = join(REPO_ROOT, 'tools/git/prune-merged-branches.js');

let dir: string;
let origin: string;
let clone: string;
let env: NodeJS.ProcessEnv;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'tlh-prune-hardening-'));
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

function prune(cwd: string, PATH = env.PATH) {
  const options = { cwd, env: { ...env, PATH }, encoding: 'utf8' } as const;
  const result = spawnSync(process.execPath, [SCRIPT, '--apply'], options);
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

const refs = (cwd: string) => git(cwd, 'for-each-ref', '--format=%(refname) %(objectname)');
const branches = (cwd: string) =>
  git(cwd, 'for-each-ref', '--format=%(refname:short)', 'refs/heads/').split('\n').filter(Boolean);

const commit = (message: string) => git(clone, 'commit', '--allow-empty', '-m', message);

/** TASK-1.24 SPEC-04 fixture: `doit/a`, `doit/c` merged into `main`, `doit/b` one commit ahead; all pushed. */
function setUpFixture(): void {
  git(dir, 'init', '--bare', '--initial-branch=main', origin);
  git(dir, 'clone', origin, clone);
  git(clone, 'checkout', '-b', 'main');
  commit('initial');
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

/** Returns a PATH whose `git` shim moves origin's `doit/a` to `doit/b` right before any push. */
function moveDoitABeforePush(): string {
  const realGit = join(git(dir, '--exec-path').trim(), 'git');
  const shimDir = join(dir, 'shim');
  mkdirSync(shimDir);
  const shim = join(shimDir, 'git');
  writeFileSync(
    shim,
    [
      '#!/bin/sh',
      'for arg in "$@"; do',
      '  if [ "$arg" = push ]; then',
      `    '${realGit}' --git-dir='${origin}' update-ref refs/heads/doit/a refs/heads/doit/b || exit 99`,
      '    break',
      '  fi',
      'done',
      `exec '${realGit}' "$@"`,
      '',
    ].join('\n'),
  );
  chmodSync(shim, 0o755);
  return `${shimDir}${delimiter}${process.env.PATH ?? ''}`;
}

describe('prune-merged-branches hardening', () => {
  it('refuses to delete a remote branch that moved after listing', () => {
    setUpFixture();
    const run = prune(clone, moveDoitABeforePush());

    expect(run.code).toBe(1);
    expect(run.stderr).toContain('prune-merged-branches: refused to delete doit/a on origin');
    expect(run.stderr).not.toContain('doit/c');
    expect(run.stdout).not.toContain('Deleted ');
    expect(branches(origin)).toEqual(['doit/a', 'doit/b', 'main']);
    expect(git(origin, 'rev-parse', 'refs/heads/doit/a')).toBe(
      git(origin, 'rev-parse', 'refs/heads/doit/b'),
    );
    expect(branches(clone)).toEqual(['doit/b', 'main']);
  });

  it('exits 1 with missing ref and deletes nothing', () => {
    const cases = [
      {
        missing: 'main',
        setUp: () => {
          git(clone, 'checkout', 'doit/b');
          git(clone, 'branch', '-D', 'main');
        },
      },
      {
        missing: 'origin/main',
        setUp: () => {
          git(dir, `--git-dir=${origin}`, 'update-ref', '-d', 'refs/heads/main');
          git(clone, 'fetch', '--prune', 'origin');
        },
      },
    ];
    for (const { missing, setUp } of cases) {
      rmSync(dir, { recursive: true, force: true });
      mkdirSync(dir);
      setUpFixture();
      const marker = forbidPush();
      setUp();
      const before = { clone: refs(clone), origin: refs(origin) };

      const run = prune(clone);

      expect(run.code, missing).toBe(1);
      expect(run.stderr).toBe(`prune-merged-branches: missing ref ${missing}\n`);
      expect(run.stdout).toBe('');
      expect({ clone: refs(clone), origin: refs(origin) }).toEqual(before);
      expect(existsSync(marker)).toBe(false);
    }
  });
});
