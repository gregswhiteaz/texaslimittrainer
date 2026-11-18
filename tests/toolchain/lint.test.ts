import { describe, expect, it } from 'vitest';
import { runInSandbox, TOOLCHAIN_TIMEOUT_MS } from '../support/sandbox';

describe('npm run lint', () => {
  it(
    'lint exits non-zero on an ESLint rule violation and zero when it is fixed',
    () => {
      const broken = runInSandbox({ 'src/ui/probe.ts': 'export const x: any = 1;\n' }, 'lint');
      expect(broken.output).toContain('@typescript-eslint/no-explicit-any');
      expect(broken.exitCode).not.toBe(0);

      // The spec's fixed probe `export const x: number = 1;` trips
      // @typescript-eslint/no-inferrable-types (stylistic preset), so the annotation is dropped.
      const fixed = runInSandbox({ 'src/ui/probe.ts': 'export const x = 1;\n' }, 'lint');
      expect(fixed.exitCode, fixed.output).toBe(0);
    },
    TOOLCHAIN_TIMEOUT_MS,
  );

  it(
    'lint exits non-zero on a Prettier formatting violation',
    () => {
      const result = runInSandbox({ 'src/ui/probe.ts': 'export const x = {a:1}\n' }, 'lint');

      expect(result.output).toContain('src/ui/probe.ts');
      expect(result.output).toContain('Code style issues found');
      expect(result.exitCode).not.toBe(0);
    },
    TOOLCHAIN_TIMEOUT_MS,
  );
});
