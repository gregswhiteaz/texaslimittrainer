import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type SandboxScript = 'lint' | 'typecheck' | 'test' | 'test:unit';

export interface SandboxResult {
  exitCode: number;
  /** stdout followed by stderr. */
  output: string;
  timedOut: boolean;
}

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const CONFIG_FILES = [
  'package.json',
  'tsconfig.json',
  'eslint.config.js',
  'tools/lint/headless-boundary.js',
  'tools/lint/type-stripping.js',
  'tools/lint/sync-copies.js',
  '.prettierrc.json',
  '.prettierignore',
  'vite.config.ts',
  'tools/ci/sweep-shards.ts',
  'tools/ci/sweep-weights.json',
];

/** Timeout for every toolchain test that runs a real npm script. */
export const TOOLCHAIN_TIMEOUT_MS = 120_000;

const PROCESS_GROUP_CLI = join(REPO_ROOT, 'tests/support/process-group-cli.ts');
const RESOLVE_TS = join(REPO_ROOT, 'tools/playtest/resolve-ts.js');
/** Extra time the outer spawnSync allows the CLI to kill the group and report. */
const CLI_BACKSTOP_MS = 15_000;

const SCRUBBED_ENV_PREFIXES = ['VITEST', 'NODE_V8_COVERAGE', 'TEST'];

function writeFile(root: string, relativePath: string, content: string): void {
  const target = join(root, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
}

/** Environment for a nested npm run, without the variables that make Vitest think it is a worker. */
export function sandboxEnv(): NodeJS.ProcessEnv {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) => !SCRUBBED_ENV_PREFIXES.some((prefix) => key.startsWith(prefix)),
    ),
  );
}

/**
 * Runs `npm run <script>` in a throw-away copy of the project config plus the given probe files,
 * and removes the copy afterwards. At `timeoutMs` the whole npm process group is killed.
 */
export function runInSandbox(
  files: Record<string, string>,
  script: SandboxScript,
  args?: string[],
  options?: { timeoutMs?: number },
): SandboxResult {
  const timeoutMs = options?.timeoutMs ?? TOOLCHAIN_TIMEOUT_MS;
  const dir = mkdtempSync(join(tmpdir(), 'tlh-sandbox-'));
  try {
    for (const file of CONFIG_FILES) {
      mkdirSync(dirname(join(dir, file)), { recursive: true });
      copyFileSync(join(REPO_ROOT, file), join(dir, file));
    }
    symlinkSync(join(REPO_ROOT, 'node_modules'), join(dir, 'node_modules'), 'dir');
    for (const [relativePath, content] of Object.entries(files)) {
      writeFile(dir, relativePath, content);
    }
    const npmArgs = ['run', script, ...(args ? ['--', ...args] : [])];
    const result = spawnSync(
      process.execPath,
      ['--import', RESOLVE_TS, PROCESS_GROUP_CLI, String(timeoutMs), 'npm', ...npmArgs],
      {
        cwd: dir,
        encoding: 'utf8',
        timeout: timeoutMs + CLI_BACKSTOP_MS,
        maxBuffer: 64 * 1024 * 1024,
        env: sandboxEnv(),
      },
    );
    if (result.status === 0) {
      try {
        return JSON.parse(result.stdout) as SandboxResult;
      } catch {
        // Not the CLI's JSON: fall through and report what it printed.
      }
    }
    const timedOut = (result.error as NodeJS.ErrnoException | undefined)?.code === 'ETIMEDOUT';
    return { exitCode: -1, output: (result.stdout ?? '') + (result.stderr ?? ''), timedOut };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
