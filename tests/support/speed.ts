/** Printed by speed tests when they measure but do not enforce their limits. */
export const SPEED_LIMITS_NOT_ENFORCED = 'speed limits not enforced (CI=true)';

/** False on CI (CI=true): shared runners vary too much for wall-clock limits. True otherwise. */
export function speedLimitsEnforced(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.CI !== 'true';
}
