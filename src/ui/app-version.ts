declare const __APP_VERSION__: string;

/** package.json's version, inlined at build time by vite.config.ts (TASK-12.1 A-4). */
export const APP_VERSION: string = __APP_VERSION__;

/** The version line shown on Settings, e.g. `Version 1.2.0`. */
export function versionText(version: string): string {
  return `Version ${version}`;
}
