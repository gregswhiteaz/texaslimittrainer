import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type SandboxScript = 'lint' | 'typecheck' | 'test';

export interface SandboxResult {
  exitCode: number;
  /** stdout followed by stderr. */
  output: string;
}

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const CONFIG_FILES = [
  'package.json',
  'tsconfig.json',
  'eslint.config.js',
  'tools/lint/headless-boundary.js',
  'tools/lint/type-stripping.js',
  '.prettierrc.json',
  '.prettierignore',
  'vite.config.ts',
];

/** Timeout for every toolchain test that runs a real npm script. */
export const TOOLCHAIN_TIMEOUT_MS = 120_000;

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
 * and removes the copy afterwards.
 */
export function runInSandbox(
  files: Record<string, string>,
  script: SandboxScript,
  args?: string[],
): SandboxResult {
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
    const result = spawnSync('npm', ['run', script, ...(args ? ['--', ...args] : [])], {
      cwd: dir,
      encoding: 'utf8',
      timeout: TOOLCHAIN_TIMEOUT_MS,
      env: sandboxEnv(),
    });
    return { exitCode: result.status ?? -1, output: result.stdout + result.stderr };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
