import { describe, expect, it } from 'vitest';
import { UsageError, formatPlan, parseOptions } from '../../tools/git/prune-merged-branches.js';

describe('prune-merged-branches helpers', () => {
  it('parseOptions and formatPlan', () => {
    expect(parseOptions([])).toEqual({ apply: false });
    expect(parseOptions(['--apply'])).toEqual({ apply: true });
    expect(() => parseOptions(['--force'])).toThrow(UsageError);
    expect(() => parseOptions(['x'])).toThrow(UsageError);
    expect(() => parseOptions(['--apply', 'x'])).toThrow(UsageError);

    const plan = {
      local: ['doit/TASK-1.1', 'doit/TASK-1.2'],
      remote: ['doit/TASK-1.1'],
      skipped: ['doit/TASK-1.24'],
    };
    expect(formatPlan({ apply: false, ...plan })).toBe(
      [
        'Dry run: nothing deleted. Re-run with --apply to delete these branches.',
        'Local doit/* branches merged into main (2):',
        '  doit/TASK-1.1',
        '  doit/TASK-1.2',
        'Remote doit/* branches on origin merged into origin/main (1):',
        '  doit/TASK-1.1',
        'Skipped (checked out): doit/TASK-1.24',
        '',
      ].join('\n'),
    );
    expect(formatPlan({ apply: true, local: [], remote: [], skipped: [] })).toBe(
      [
        'Deleting these branches.',
        'Local doit/* branches merged into main (0):',
        '  (none)',
        'Remote doit/* branches on origin merged into origin/main (0):',
        '  (none)',
        '',
      ].join('\n'),
    );
  });
});
