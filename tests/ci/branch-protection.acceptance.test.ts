import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../support/sandbox';

const workflow = readFileSync(join(REPO_ROOT, '.github/workflows/ci.yml'), 'utf8');
const readme = readFileSync(join(REPO_ROOT, 'README.md'), 'utf8');

describe('branch protection', () => {
  it('README documents branch protection requiring the CI job', () => {
    const jobs = workflow.slice(workflow.indexOf('\njobs:\n'));
    expect([...jobs.matchAll(/^ {2}[\w-]+:$/gm)].map((match) => match[0])).toEqual([
      '  e2e:',
      '  checks:',
      '  coverage:',
      '  sweeps:',
      '  changes:',
      '  tooling:',
    ]);
    const contexts = [...jobs.matchAll(/^ {2}([\w-]+):\n {4}name: (.+)$/gm)]
      .filter((match) => match[1] !== 'changes')
      .flatMap(([, , name = '']) =>
        name.includes('${{ matrix.shard }}')
          ? [1, 2].map((shard) => name.replace('${{ matrix.shard }}', String(shard)))
          : [name],
      );
    expect(contexts).toEqual([
      'E2E (Chromium and WebKit)',
      'Lint, typecheck, build and playtest',
      'Unit tests with coverage',
      'Sweep tests (shard 1 of 2)',
      'Sweep tests (shard 2 of 2)',
      'Tooling tests',
    ]);

    const ci = /^## Continuous integration\n([\s\S]*?)(?=^## )/m.exec(readme)?.[1] ?? '';
    const section = /^### Branch protection\n([\s\S]*?)(?=^#)/m.exec(ci + '\n#')?.[1] ?? '';
    for (const text of [
      'gh api -X PUT repos/{owner}/{repo}/branches/main/protection',
      `"contexts": [${contexts.map((name) => `"${name}"`).join(', ')}]`,
      '"strict": false',
      '"enforce_admins": false',
      '"required_pull_request_reviews": null',
      "gh api repos/{owner}/{repo}/branches/main/protection --jq '.required_status_checks.contexts'",
      '403',
      'GitHub Pro',
      'public',
    ]) {
      expect(section).toContain(text);
    }
  });
});
