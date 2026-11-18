// Stub command for tests/ci/retry.test.ts (TASK-1.19).
// Usage: node flaky-command.js <stateFile> <failures> <fail|hang|hang-tree|hang-ignore-term>
// Counts its calls in <stateFile>; the first <failures> calls fail or hang, later calls succeed.
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { setInterval } from 'node:timers';

const [stateFile = '', failures = '0', mode = 'fail'] = process.argv.slice(2);
const calls = existsSync(stateFile) ? Number(readFileSync(stateFile, 'utf8')) : 0;
writeFileSync(stateFile, String(calls + 1));

function stayAlive() {
  setInterval(() => undefined, 1000);
}

if (calls >= Number(failures)) {
  process.stdout.write(`flaky: ok on call ${calls + 1}\n`);
} else if (mode === 'fail') {
  process.stdout.write(`flaky: failing call ${calls + 1}\n`);
  process.exitCode = 3;
} else if (mode === 'hang') {
  stayAlive();
} else if (mode === 'hang-tree') {
  const grandchild = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
    stdio: 'ignore',
  });
  writeFileSync(`${stateFile}.child`, String(grandchild.pid));
  stayAlive();
} else if (mode === 'hang-ignore-term') {
  process.on('SIGTERM', () => undefined);
  stayAlive();
} else {
  throw new Error(`unknown mode: ${mode}`);
}
