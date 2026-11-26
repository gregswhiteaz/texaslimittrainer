import { afterAll } from 'vitest';

// TASK-11.13 (A-3, D-4): runs a Vitest file's local-time code in `zone`, so a UTC-date day key fails on a UTC
// machine. Node applies a runtime TZ change at once; the original zone is restored after the file.

export function pinTimeZone(zone: string): void {
  const saved = process.env.TZ;
  process.env.TZ = zone;
  if (Intl.DateTimeFormat().resolvedOptions().timeZone !== zone) {
    throw new Error('time zone ' + zone + ' not applied');
  }
  afterAll(() => {
    if (saved === undefined) delete process.env.TZ;
    else process.env.TZ = saved;
  });
}
