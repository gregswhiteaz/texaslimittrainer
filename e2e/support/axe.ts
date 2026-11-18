import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

const BLOCKING_IMPACTS = new Set(['serious', 'critical']);

/**
 * Runs axe with its default rule set and throws if any violation has serious or critical impact.
 * The message lists one `- <id> (<impact>): <help> — <first target>` line per violation.
 */
export async function expectNoSeriousAxeViolations(page: Page): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const blocking = violations.filter((v) => v.impact && BLOCKING_IMPACTS.has(v.impact));
  if (blocking.length === 0) {
    return;
  }
  const lines = blocking.map(
    (v) => `- ${v.id} (${v.impact}): ${v.help} — ${String(v.nodes[0]?.target[0] ?? '')}`,
  );
  throw new Error([`axe: ${blocking.length} serious/critical violation(s)`, ...lines].join('\n'));
}
