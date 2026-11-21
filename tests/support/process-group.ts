import { spawn } from 'node:child_process';

export interface ProcessGroupResult {
  /** -1 when the command was killed by a signal or could not start. */
  exitCode: number;
  /** stdout followed by stderr. */
  output: string;
  timedOut: boolean;
}

/** SIGKILLs a process group silently (keeps CLI stdout clean); ignores ESRCH and EPERM. */
function killGroupQuietly(pid: number | undefined): void {
  if (pid === undefined) return;
  try {
    process.kill(-pid, 'SIGKILL');
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== 'ESRCH' && code !== 'EPERM') throw error;
  }
}

/**
 * Runs a command in its own process group and SIGKILLs the whole group at `timeoutMs`, and again
 * once it has closed, so no children (e.g. Vitest workers) outlive it. ESRCH (group gone) and EPERM
 * (macOS: zombie/exiting members remain; the signal still reached the others) are ignored.
 */
export function runProcessGroup(
  command: string,
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv; timeoutMs: number },
): Promise<ProcessGroupResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
    const timer = setTimeout(() => {
      timedOut = true;
      killGroupQuietly(child.pid);
    }, options.timeoutMs);
    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({ exitCode: -1, output: error.message, timedOut });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      killGroupQuietly(child.pid);
      resolve({ exitCode: code ?? -1, output: stdout + stderr, timedOut });
    });
  });
}
