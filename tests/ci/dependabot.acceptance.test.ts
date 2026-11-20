import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../support/sandbox';

// Asserts on YAML text without a YAML parser, like tests/ci/workflow.test.ts.
const config = readFileSync(join(REPO_ROOT, '.github/dependabot.yml'), 'utf8');
const readme = readFileSync(join(REPO_ROOT, 'README.md'), 'utf8');

const SCHEDULE = [
  '    schedule:',
  '      interval: weekly',
  '      day: monday',
  "      time: '06:00'",
  '      timezone: Etc/UTC',
].join('\n');

describe('Dependabot', () => {
  it('declares weekly github-actions and npm updates', () => {
    expect(config.startsWith('version: 2\nupdates:\n')).toBe(true);
    const entries = config.split(/^ {2}- /m).slice(1);
    expect(entries.map((entry) => entry.split('\n')[0])).toEqual([
      'package-ecosystem: github-actions',
      'package-ecosystem: npm',
    ]);
    for (const entry of entries) {
      expect(entry).toContain('\n    directory: /\n');
      expect(entry).toContain(SCHEDULE);
    }
    expect(entries[0]).toContain("    groups:\n      actions:\n        patterns: ['*']\n");
    expect(entries[1]).toContain(
      '    groups:\n      npm-minor-patch:\n        update-types: [minor, patch]\n',
    );
  });

  it('README documents the Dependabot schedule', () => {
    const section = /^### Dependency updates\n([\s\S]*?)(?=^#)/m.exec(readme)?.[1] ?? '';
    expect(section).toContain('Dependabot');
    expect(section).toContain('Monday');
    expect(section).toContain('GitHub Actions');
    expect(section).toContain('npm');
  });

  it('keeps @types/node and typescript on supported majors and groups typescript with typescript-eslint', () => {
    const entries = config.split(/^ {2}- /m).slice(1);
    expect(entries[0]).not.toContain('ignore:');
    expect(entries[1]).toContain(
      '      npm-minor-patch:\n        update-types: [minor, patch]\n        exclude-patterns: [typescript, typescript-eslint]\n',
    );
    expect(entries[1]).toContain(
      '      typescript:\n        patterns: [typescript, typescript-eslint]\n',
    );
    expect(entries[1]).toContain(
      "    ignore:\n      - dependency-name: '@types/node'\n        update-types: ['version-update:semver-major']\n",
    );
    expect(entries[1]).toContain(
      "      - dependency-name: typescript\n        update-types: ['version-update:semver-major']\n",
    );
  });
});
