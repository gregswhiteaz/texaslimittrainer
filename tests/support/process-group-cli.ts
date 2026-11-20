// Runs one command through runProcessGroup and prints the result as JSON, so synchronous callers
// (runInSandbox) get a whole-process-group kill on timeout (TASK-1.39).
// Usage: node --import <repo>/tools/playtest/resolve-ts.js <repo>/tests/support/process-group-cli.ts
//          <timeoutMs> <command> [args...]
import process from 'node:process';
import { runProcessGroup } from './process-group';

const [timeoutText = '', command, ...args] = process.argv.slice(2);
const timeoutMs = Number(timeoutText);
if (!Number.isInteger(timeoutMs) || timeoutMs <= 0 || !command) {
  process.stderr.write('usage: process-group-cli.ts <timeoutMs> <command> [args...]\n');
  process.exitCode = 2;
} else {
  const result = await runProcessGroup(command, args, {
    timeoutMs,
    cwd: process.cwd(),
    env: process.env,
  });
  process.stdout.write(JSON.stringify(result));
}
