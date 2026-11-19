// Process entry for `npm run chart:print` (TASK-7.19). All formatting lives in src/advice/chart-print.ts.
import process from 'node:process';
import { formatChart } from '../../src/advice/chart-print';
import { SIX_MAX_CHART } from '../../src/advice/preflop';

process.stdout.write(formatChart(SIX_MAX_CHART));
