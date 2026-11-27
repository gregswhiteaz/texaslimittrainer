import type { TestSpecification, Vitest } from 'vitest/node';
import { describe, expect, it } from 'vitest';
import config from '../../vite.config';
import sweepWeights from '../../tools/ci/sweep-weights.json' with { type: 'json' };
import {
  assignShards,
  DEFAULT_WEIGHT_SECONDS,
  WeightedSequencer,
} from '../../tools/ci/sweep-shards';

// The spec's worked example: `e` has no weight, so it counts as DEFAULT_WEIGHT_SECONDS (1).
const WEIGHTS = { a: 5, b: 4, c: 3, d: 3 };
const FILES = ['a', 'b', 'c', 'd', 'e'];

describe('sweep shards', () => {
  it('assignShards is a deterministic weighted partition', () => {
    expect(DEFAULT_WEIGHT_SECONDS).toBe(1);
    const expected = [
      ['a', 'd'],
      ['b', 'c', 'e'],
    ];
    expect(assignShards(FILES, WEIGHTS, 2)).toEqual(expected);
    expect(assignShards([...FILES].reverse(), WEIGHTS, 2)).toEqual(expected);
    expect(assignShards([...FILES, 'c', 'a'], WEIGHTS, 2)).toEqual(expected);

    for (const bad of [-1, Number.NaN, '5']) {
      const weights = { ...WEIGHTS, e: bad } as unknown as Record<string, number>;
      expect(assignShards(FILES, weights, 2), String(bad)).toEqual(expected);
    }
    // `x` counted as 1 ties with `y` and goes first by path; kept as -1 or NaN it would not.
    for (const bad of [-1, Number.NaN, '5']) {
      const weights = { x: bad, y: 1 } as unknown as Record<string, number>;
      expect(assignShards(['x', 'y'], weights, 2), String(bad)).toEqual([['x'], ['y']]);
    }
    // A weight of 9 instead of the default 1 moves `e` first, so the default really is 1.
    expect(assignShards(FILES, { ...WEIGHTS, e: 9 }, 2)).not.toEqual(expected);

    for (const count of [0, 1.5, -1]) {
      expect(() => assignShards(FILES, WEIGHTS, count), String(count)).toThrow(RangeError);
    }
    expect(assignShards(FILES, WEIGHTS, 1)).toEqual([FILES]);
    expect(assignShards(['x'], {}, 3)).toEqual([['x'], [], []]);
  });

  it('the sequencer shards specs by weighted assignment', () => {
    expect(config.test?.sequence?.sequencer).toBe(WeightedSequencer);

    const specs = FILES.map((file) => ({ moduleId: `/r/${file}` }) as TestSpecification);
    const shardOf = (index: number) => {
      const ctx = { config: { root: '/r', shard: { index, count: 2 } } } as unknown as Vitest;
      return new WeightedSequencer(ctx, WEIGHTS).shard(specs).map((spec) => spec.moduleId);
    };
    expect(shardOf(2)).toEqual(['/r/b', '/r/c', '/r/e']);
    expect(shardOf(1)).toEqual(['/r/a', '/r/d']);
  });

  it('the sequencer defaults to the committed sweep weights', () => {
    const files = Object.keys(sweepWeights);
    const specs = files.map((file) => ({ moduleId: `/r/${file}` }) as TestSpecification);
    const ctx = { config: { root: '/r', shard: { index: 1, count: 3 } } } as unknown as Vitest;
    const firstShard = (sequencer: WeightedSequencer) =>
      sequencer.shard(specs).map((spec) => spec.moduleId.slice('/r/'.length));

    const committed = assignShards(files, sweepWeights, 3)[0];
    expect(firstShard(new WeightedSequencer(ctx))).toEqual(committed);
    expect(committed).not.toEqual(assignShards(files, {}, 3)[0]);
  });
});
