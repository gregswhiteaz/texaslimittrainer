import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../support/sandbox';

const workflow = readFileSync(join(REPO_ROOT, '.github/workflows/ci.yml'), 'utf8');
const readme = readFileSync(join(REPO_ROOT, 'README.md'), 'utf8');

describe('branch protection', () => {
  it('README documents branch protection requiring the CI job', () => {
    const jobs = workflow.slice(workflow.indexOf('\njobs:\n'));
    expect([...jobs.matchAll(/^ {2}[\w-]+:$/gm)].map((match) => match[0])).toEqual(['  checks:']);
    const jobName = /^ {2}checks:\n {4}name: (.+)$/m.exec(workflow)?.[1];
    expect(jobName).toBe('Lint, typecheck, build, test and e2e');

    const ci = /^## Continuous integration\n([\s\S]*?)(?=^## )/m.exec(readme)?.[1] ?? '';
    const section = /^### Branch protection\n([\s\S]*?)(?=^#)/m.exec(ci + '\n#')?.[1] ?? '';
    for (const text of [
      'gh api -X PUT repos/{owner}/{repo}/branches/main/protection',
      `"contexts": ["${jobName}"]`,
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
