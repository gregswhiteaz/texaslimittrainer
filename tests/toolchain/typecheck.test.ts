import { describe, expect, it } from 'vitest';
import { runInSandbox, TOOLCHAIN_TIMEOUT_MS } from '../support/sandbox';

describe('npm run typecheck', () => {
  it(
    'typecheck rejects implicit any because strict mode is on',
    () => {
      const result = runInSandbox(
        { 'src/ui/probe.ts': 'export function id(x) {\n  return x;\n}\n' },
        'typecheck',
      );

      expect(result.output).toContain('TS7006');
      expect(result.exitCode).not.toBe(0);
    },
    TOOLCHAIN_TIMEOUT_MS,
  );

  it(
    'typecheck exits non-zero on a type error and zero when it is fixed',
    () => {
      const broken = runInSandbox(
        { 'src/ui/probe.ts': "export const n: number = 'x';\n" },
        'typecheck',
      );
      expect(broken.output).toContain('TS2322');
      expect(broken.output).toContain('src/ui/probe.ts');
      expect(broken.exitCode).not.toBe(0);

      const fixed = runInSandbox(
        { 'src/ui/probe.ts': 'export const n: number = 1;\n' },
        'typecheck',
      );
      expect(fixed.exitCode, fixed.output).toBe(0);
    },
    TOOLCHAIN_TIMEOUT_MS,
  );
});
