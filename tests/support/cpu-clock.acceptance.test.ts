import { describe, expect, it } from 'vitest';
import { cpuNowMs } from './speed';

function work(n: number): number {
  let sum = 0;
  for (let i = 0; i < n; i++) sum += Math.sqrt(i);
  return sum;
}

function minCpuMs(n: number, runs: number): number {
  let best = Infinity;
  let sink = 0;
  for (let r = 0; r < runs; r++) {
    const start = cpuNowMs();
    sink += work(n);
    best = Math.min(best, cpuNowMs() - start);
  }
  expect(sink).toBeGreaterThan(0);
  return best;
}

describe('cpuNowMs', () => {
  it('does not count time the process spends waiting', () => {
    const cell = new Int32Array(new SharedArrayBuffer(4));
    const wallStart = performance.now();
    const cpuStart = cpuNowMs();
    Atomics.wait(cell, 0, 0, 300);
    const cpuMs = cpuNowMs() - cpuStart;
    const wallMs = performance.now() - wallStart;
    expect(wallMs).toBeGreaterThanOrEqual(290);
    expect(cpuMs).toBeLessThan(50);
  });

  it('counts twice the work as about twice the time', () => {
    const N = 20_000_000;
    minCpuMs(N, 1);
    minCpuMs(2 * N, 1);
    const single = minCpuMs(N, 5);
    const double = minCpuMs(2 * N, 5);
    expect(double / single).toBeGreaterThanOrEqual(1.5);
  });
});
