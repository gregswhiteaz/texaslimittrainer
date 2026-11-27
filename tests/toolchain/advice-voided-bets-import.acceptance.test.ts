import { join } from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT, TOOLCHAIN_TIMEOUT_MS } from '../support/sandbox';

// TASK-10.17 A-5: advice may import the pure voidedBets helper from engine/hand; other engine values and the
// bots' own list stay as they were.

const VOIDED_BETS =
  "import { voidedBets } from '../engine/hand';\n\nexport const v = voidedBets;\n";
const APPLY_ACTION =
  "import { applyAction } from '../engine/hand';\n\nexport const a = applyAction;\n";

async function errorsOf(eslint: ESLint, code: string, file: string): Promise<string[]> {
  const [lint] = await eslint.lintText(code, { filePath: join(REPO_ROOT, file) });
  return (lint?.messages ?? []).filter((m) => m.severity === 2).map((m) => m.message);
}

describe('advice import of voidedBets', () => {
  it(
    'advice may import voidedBets from engine/hand but not other engine values',
    async () => {
      const eslint = new ESLint({ cwd: REPO_ROOT });
      expect(await errorsOf(eslint, VOIDED_BETS, 'src/advice/probe.ts')).toEqual([]);
      const blocked = await errorsOf(eslint, APPLY_ACTION, 'src/advice/probe.ts');
      expect(blocked.some((m) => m.includes('Advice code that bots use may import only'))).toBe(
        true,
      );
      expect((await errorsOf(eslint, VOIDED_BETS, 'src/bots/probe.ts')).length).toBeGreaterThan(0);
    },
    TOOLCHAIN_TIMEOUT_MS,
  );
});
