// Process entry for `npm run chart:print` (TASK-7.19, TASK-7.27). All logic lives in src/advice/chart-print.ts.
import process from 'node:process';
import { chartPrintMain } from '../../src/advice/chart-print';

process.exitCode = chartPrintMain(process.argv.slice(2), {
  out: (text) => process.stdout.write(text),
  err: (text) => process.stderr.write(text),
});
