import { describe, expect, it } from 'vitest';
import { SPEED_LIMITS_NOT_ENFORCED, speedLimitsEnforced } from './speed';

describe('speedLimitsEnforced', () => {
  it('enforces speed limits unless CI is exactly "true"', () => {
    expect(speedLimitsEnforced({ CI: 'true' })).toBe(false);
    expect(speedLimitsEnforced({})).toBe(true);
    expect(speedLimitsEnforced({ CI: 'false' })).toBe(true);
    expect(speedLimitsEnforced({ CI: '' })).toBe(true);
    expect(speedLimitsEnforced({ CI: '1' })).toBe(true);
    expect(SPEED_LIMITS_NOT_ENFORCED).toBe('speed limits not enforced (CI=true)');
  });
});
