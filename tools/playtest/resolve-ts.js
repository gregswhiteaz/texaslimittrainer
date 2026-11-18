// Resolve hook for `npm run playtest` (TASK-1.6): lets Node's built-in type stripping load the
// project's extensionless relative imports (`from './deck'`) by trying the `.ts` sibling first.
// Usage: node --import ./tools/playtest/resolve-ts.js <entry>.ts
import { registerHooks } from 'node:module';
import { extname } from 'node:path';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if ((specifier.startsWith('./') || specifier.startsWith('../')) && extname(specifier) === '') {
      try {
        return nextResolve(`${specifier}.ts`, context);
      } catch {
        // Not a .ts sibling: resolve the specifier as written.
      }
    }
    return nextResolve(specifier, context);
  },
});
