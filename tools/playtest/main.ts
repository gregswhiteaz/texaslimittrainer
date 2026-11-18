// Process entry for `npm run playtest` (TASK-1.6). All logic lives in src/playtest/cli.ts.
import process from 'node:process';
import { main } from '../../src/playtest/cli';

process.exitCode = main(process.argv.slice(2), {
  out: (text) => process.stdout.write(text),
  err: (text) => process.stderr.write(text),
});
