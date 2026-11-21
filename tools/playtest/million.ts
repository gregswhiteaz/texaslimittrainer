// Process entry for `npm run playtest:million` (TASK-1.17). All logic lives in src/playtest/shards.ts.
import { spawn } from 'node:child_process';
import os from 'node:os';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { millionMain, shardNodeArgs, type ShardRunner } from '../../src/playtest/shards';

const root = fileURLToPath(new URL('../..', import.meta.url));

const runShard: ShardRunner = (shard) =>
  new Promise((resolve) => {
    const child = spawn(process.execPath, shardNodeArgs(shard), {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', (chunk: string) => (stdout += chunk));
    child.stderr.setEncoding('utf8').on('data', (chunk: string) => (stderr += chunk));
    child.on('error', (error) => resolve({ code: null, stdout: '', stderr: error.message }));
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });

process.exitCode = await millionMain(
  process.argv.slice(2),
  {
    out: (text) => process.stdout.write(text),
    err: (text) => process.stderr.write(text),
  },
  runShard,
  Math.max(1, os.availableParallelism()),
);
