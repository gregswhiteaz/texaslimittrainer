import { describe, expect, it } from 'vitest';
import { refusedBranches, remoteDeleteArgs } from '../../tools/git/prune-merged-branches.js';

describe('prune-merged-branches lease helpers', () => {
  it('builds leased delete args and parses refusals', () => {
    expect(
      remoteDeleteArgs([
        { name: 'doit/a', sha: 'a1' },
        { name: 'doit/c', sha: 'c3' },
      ]),
    ).toEqual([
      'push',
      '--porcelain',
      'origin',
      '--force-with-lease=refs/heads/doit/a:a1',
      '--force-with-lease=refs/heads/doit/c:c3',
      '--delete',
      'doit/a',
      'doit/c',
    ]);

    expect(
      refusedBranches(
        'To /tmp/o.git\n-\t:refs/heads/doit/c\t[deleted]\n!\t:refs/heads/doit/a\t[rejected] (stale info)\nDone\n',
      ),
    ).toEqual([{ name: 'doit/a', summary: '[rejected] (stale info)' }]);
    expect(refusedBranches('')).toEqual([]);
    // git 2.54 prints the source of a refused delete as `(delete)`.
    expect(
      refusedBranches(
        '!\t(delete):refs/heads/doit/a\t[rejected] (stale info)\n!\t(delete):refs/heads/doit/b\tx\n',
      ),
    ).toEqual([
      { name: 'doit/a', summary: '[rejected] (stale info)' },
      { name: 'doit/b', summary: 'x' },
    ]);
  });
});
