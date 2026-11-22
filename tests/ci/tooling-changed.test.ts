import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { decide, isToolingPath } from '../../tools/ci/tooling-changed.js';
import { REPO_ROOT } from '../support/sandbox';

const SCRIPT = join(REPO_ROOT, 'tools/ci/tooling-changed.js');
const ZERO = '0'.repeat(40);
const UNKNOWN_SHA = 'f'.repeat(40);

let dir: string;
let origin: string;
let clone: string;
let env: NodeJS.ProcessEnv;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'tlh-tooling-changed-'));
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
  delete env.GITHUB_OUTPUT;
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function git(...args: string[]): string {
  const result = spawnSync('git', args, { cwd: clone, env, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`);
  return result.stdout.trim();
}

/** Writes the files, commits them and returns the new commit's SHA. */
function commit(files: Record<string, string>, message = 'change'): string {
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(clone, path)), { recursive: true });
    writeFileSync(join(clone, path), content);
  }
  git('add', '-A');
  git('commit', '-m', message);
  return git('rev-parse', 'HEAD');
}

/** A bare origin with `main` (holding `tools/a.js` and `src/b.ts`) and a clone of it. */
function setUpRepo(): string {
  spawnSync('git', ['init', '--bare', '--initial-branch=main', origin], { cwd: dir, env });
  spawnSync('git', ['clone', origin, clone], { cwd: dir, env });
  git('checkout', '-b', 'main');
  const base = commit({ 'tools/a.js': 'export const a = 1;\n', 'src/b.ts': 'export {};\n' });
  git('push', 'origin', 'main');
  return base;
}

function detect(args: string[]) {
  const output = join(dir, 'github-output');
  rmSync(output, { force: true });
  const result = spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: clone,
    env: { ...env, GITHUB_OUTPUT: output },
    encoding: 'utf8',
  });
  const lines = result.stdout.trimEnd().split('\n');
  let written = '';
  try {
    written = readFileSync(output, 'utf8');
  } catch {
    // Not written (usage error).
  }
  return { code: result.status, stdout: result.stdout, stderr: result.stderr, lines, written };
}

const push = (base: string, head: string) =>
  detect(['--event', 'push', '--base', base, '--head', head, '--default-branch', 'main']);

function expectDecision(result: ReturnType<typeof detect>, tooling: boolean): void {
  expect(result.code, result.stderr).toBe(0);
  expect(result.lines.at(-1), result.stdout).toBe(`tooling=${tooling}`);
  expect(result.written).toBe(`tooling=${tooling}\n`);
}

describe('tooling change detector', () => {
  it('decides tooling=true only for tooling changes and fails safe', () => {
    const base = setUpRepo();

    const product = commit({ 'src/bots/x.ts': 'export {};\n', 'tests/bots/x.test.ts': '\n' });
    const productOnly = push(base, product);
    expectDecision(productOnly, false);
    expect(productOnly.lines[0]).toBe('no tooling files among 2 changed file(s)');

    for (const path of [
      'tools/ci/x.js',
      '.github/workflows/ci.yml',
      'package-lock.json',
      'tests/ci/x.test.ts',
      'README.md',
      'index.html',
      'tests/engine/x.perf.test.ts',
    ]) {
      const before = git('rev-parse', 'HEAD');
      const head = commit({ [path]: `// ${path}\n` });
      const result = push(before, head);
      expectDecision(result, true);
      expect(result.lines.slice(0, -1), path).toEqual(['1 tooling file(s) changed', `  ${path}`]);
    }

    const beforeRename = git('rev-parse', 'HEAD');
    mkdirSync(join(clone, 'src'), { recursive: true });
    git('mv', 'tools/a.js', 'src/a.js');
    git('commit', '-m', 'rename');
    const renamed = push(beforeRename, git('rev-parse', 'HEAD'));
    expectDecision(renamed, true);
    expect(renamed.lines).toContain('  tools/a.js');

    const scheduled = detect(['--event', 'schedule', '--base', '']);
    expectDecision(scheduled, true);
    expect(scheduled.lines[0]).toBe('always run on schedule');
    const calls: string[][] = [];
    const recordingGit = (args: string[]) => {
      calls.push(args);
      return { status: 0, stdout: '' };
    };
    expect(decide({ event: 'schedule', base: '' }, recordingGit).tooling).toBe(true);
    expect(calls).toEqual([]);

    // A new branch (zero `before`) and a pull request are compared with where the branch left
    // main, so tooling commits that land on main afterwards do not count.
    git('checkout', '-b', 'feature', base);
    const feature = commit({ 'src/feature.ts': 'export {};\n' });
    git('checkout', 'main');
    const mainTooling = commit({ 'tools/later.js': '\n' });
    git('push', 'origin', 'main');
    expectDecision(push(ZERO, feature), false);
    expectDecision(push('', feature), false);
    expectDecision(push(mainTooling, feature), true);
    const pullRequest = detect([
      '--event',
      'pull_request',
      '--base',
      mainTooling,
      '--head',
      feature,
      '--default-branch',
      'main',
    ]);
    expectDecision(pullRequest, false);

    for (const args of [
      ['--event', 'push', '--base', UNKNOWN_SHA, '--head', feature],
      ['--event', 'push', '--base', 'not-a-sha', '--head', feature],
      ['--event', 'push', '--base', base, '--head', 'HEAD'],
      ['--event', 'push', '--base', ZERO, '--head', feature, '--default-branch', 'main;rm'],
      ['--event', 'push', '--base', ZERO, '--head', feature, '--default-branch', 'missing'],
      ['--event', 'release', '--base', base, '--head', feature],
    ]) {
      const result = detect(args);
      expectDecision(result, true);
      expect(result.lines[0], args.join(' ')).toMatch(/^::warning::/);
    }
    const failingDiff = (args: string[]) => ({ status: args[0] === 'diff' ? 128 : 0, stdout: '' });
    const failed = decide({ event: 'push', base, head: feature }, failingDiff);
    expect(failed.tooling).toBe(true);
    expect(failed.reason).toMatch(/^::warning::/);

    const missingEvent = detect(['--base', base]);
    expect(missingEvent.code).toBe(2);
    expect(missingEvent.stderr).toMatch(/^tooling-changed: /);
    expect(missingEvent.written).toBe('');
    expect(detect(['--event', 'push', '--bogus']).code).toBe(2);

    const beforeControl = git('rev-parse', 'HEAD');
    const control = commit({ 'tools/x\n::error::y.js': '\n' });
    const controlResult = push(beforeControl, control);
    expectDecision(controlResult, true);
    expect(controlResult.lines).toContain('  tools/x?::error::y.js');
    expect(controlResult.lines).not.toContain('::error::y.js');

    // A perf test file named like a workflow command still counts, and is listed indented.
    const beforeCommand = git('rev-parse', 'HEAD');
    const command = commit({ '::error::x.perf.test.ts': '\n' });
    const commandResult = push(beforeCommand, command);
    expectDecision(commandResult, true);
    expect(commandResult.lines).toEqual([
      '1 tooling file(s) changed',
      '  ::error::x.perf.test.ts',
      'tooling=true',
    ]);
    expect(isToolingPath('::error::x.perf.test.ts')).toBe(true);
    const workflowCommands = (lines: string[]) =>
      lines.filter((line) => line.startsWith('::') && !line.startsWith('::warning::'));
    expect(workflowCommands(commandResult.lines)).toEqual([]);
    expect(workflowCommands(controlResult.lines)).toEqual([]);
  });

  it('every repo file a tooling test reads is a tooling path', () => {
    const testFiles = ['tests/ci', 'tests/git', 'tests/toolchain'].flatMap((root) =>
      readdirSync(join(REPO_ROOT, root), { recursive: true, encoding: 'utf8' })
        .map((file) => join(root, file))
        .filter((file) => /\.tsx?$/.test(file)),
    );
    const read = new Set<string>();
    for (const file of testFiles) {
      const source = readFileSync(join(REPO_ROOT, file), 'utf8');
      for (const [, path = ''] of source.matchAll(/join\(REPO_ROOT, '([^']+)'\)/g)) read.add(path);
      for (const [, path = ''] of source.matchAll(/readFileSync\(\s*'([^'/][^']*)'/g))
        read.add(path);
      // A test that runs the build reads Vite's entry, `index.html`.
      if (/\['run', 'build'/.test(source)) read.add('index.html');
    }
    const speedLimits = readFileSync(
      join(REPO_ROOT, 'tests/ci/speed-limits.acceptance.test.ts'),
      'utf8',
    );
    const perfFiles = /const PERF_FILES = \[([^\]]+)\]/.exec(speedLimits)?.[1] ?? '';
    for (const [, path = ''] of perfFiles.matchAll(/'([^']+)'/g)) read.add(path);
    const sandbox = readFileSync(join(REPO_ROOT, 'tests/support/sandbox.ts'), 'utf8');
    const configFiles = /const CONFIG_FILES = \[([^\]]+)\]/.exec(sandbox)?.[1] ?? '';
    for (const [, path = ''] of configFiles.matchAll(/'([^']+)'/g)) read.add(path);

    expect(read).toContain('README.md');
    expect(read).toContain('index.html');
    expect(read).toContain('tests/engine/hand-evaluator.perf.test.ts');
    expect(read).toContain('vite.config.ts');
    expect(read).toContain('src/engine/bot-random.ts');

    // A directory literal stands for every file under it.
    const files = [...read].flatMap((path) =>
      statSync(join(REPO_ROOT, path)).isDirectory()
        ? readdirSync(join(REPO_ROOT, path), { recursive: true, encoding: 'utf8' })
            .map((child) => relative(REPO_ROOT, join(REPO_ROOT, path, child)))
            .filter((child) => statSync(join(REPO_ROOT, child)).isFile())
        : [path],
    );
    expect(files.filter((path) => !isToolingPath(path))).toEqual([]);
  });
});
