import { relative, sep } from 'node:path';
import type { TestSequencer, TestSpecification, Vitest } from 'vitest/node';
import sweepWeights from './sweep-weights.json' with { type: 'json' };

/** Seconds assumed for a file missing from the weights (about the median sweep file, TASK-1.53 A-3). */
export const DEFAULT_WEIGHT_SECONDS = 1;

/**
 * Splits files into `count` groups of near-equal summed weight: longest first, each into the
 * least-loaded group (lowest index on a tie). Each group is sorted by path.
 */
export function assignShards(
  files: readonly string[],
  weights: Readonly<Record<string, number>>,
  count: number,
): string[][] {
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError('shard count must be a positive integer');
  }
  const weightOf = (file: string): number => {
    const value: unknown = weights[file];
    return typeof value === 'number' && Number.isFinite(value) && value >= 0
      ? value
      : DEFAULT_WEIGHT_SECONDS;
  };
  const byPath = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
  const ordered = [...new Set(files)].sort((a, b) => weightOf(b) - weightOf(a) || byPath(a, b));

  const groups: string[][] = Array.from({ length: count }, () => []);
  const loads: number[] = new Array<number>(count).fill(0);
  for (const file of ordered) {
    let target = 0;
    for (let index = 1; index < count; index++) {
      if ((loads[index] ?? 0) < (loads[target] ?? 0)) target = index;
    }
    groups[target]?.push(file);
    loads[target] = (loads[target] ?? 0) + weightOf(file);
  }
  return groups.map((group) => group.sort(byPath));
}

/** Vitest sequencer whose `--shard` split is weighted by `sweep-weights.json`; sorting is Vitest's default. */
export class WeightedSequencer implements TestSequencer {
  private readonly ctx: Vitest;
  private readonly weights: Readonly<Record<string, number>>;

  constructor(ctx: Vitest, weights: Readonly<Record<string, number>> = sweepWeights) {
    this.ctx = ctx;
    this.weights = weights;
  }

  shard(specs: TestSpecification[]): TestSpecification[] {
    const { index, count } = this.ctx.config.shard ?? { index: 1, count: 1 };
    const pathOf = (spec: TestSpecification) =>
      relative(this.ctx.config.root, spec.moduleId).split(sep).join('/');
    const group = new Set(assignShards(specs.map(pathOf), this.weights, count)[index - 1]);
    return specs.filter((spec) => group.has(pathOf(spec)));
  }

  async sort(specs: TestSpecification[]): Promise<TestSpecification[]> {
    // Imported lazily so `vite build`/`vite dev` loading the config never pull in vitest/node.
    const { BaseSequencer } = await import('vitest/node');
    return new BaseSequencer(this.ctx).sort(specs);
  }
}
