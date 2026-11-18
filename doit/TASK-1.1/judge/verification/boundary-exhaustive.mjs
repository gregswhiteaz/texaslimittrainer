// Judge probe: exhaustive boundary check via ESLint API. Usage: node boundary-exhaustive.mjs <repoRoot>
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const root = process.argv[2];
const { ESLint } = await import(pathToFileURL(join(root, 'node_modules/eslint/lib/api.js')).href);
const hb = await import(pathToFileURL(join(root, 'tools/lint/headless-boundary.js')).href);
const eslint = new ESLint({ cwd: root });
const lint = async (file, text) => (await eslint.lintText(text, { filePath: join(root, file) }))[0].messages;
let fails = [];
console.log('BROWSER_ONLY_GLOBALS length', hb.BROWSER_ONLY_GLOBALS.length);
// exhaustive: every global x every dir, also nested subfolder and .tsx
for (const d of hb.HEADLESS_DIRS) for (const g of hb.BROWSER_ONLY_GLOBALS) {
  const m = await lint(`src/${d}/deep/nested/p.ts`, `export const probe = ${g};\n`);
  if (!m.some((x) => x.ruleId === 'no-restricted-globals' && x.message.includes(`'${g}'`))) fails.push(`global ${d} ${g}`);
}
console.log('exhaustive globals checked', hb.HEADLESS_DIRS.length * hb.BROWSER_ONLY_GLOBALS.length, 'fails', fails.length);
const cases = [
  // [file, text, expectRule or null]
  ['src/engine/a.tsx', "import { useState } from 'react';\nexport const s = useState;\n", 'no-restricted-imports'],
  ['src/bots/a.ts', "import { jsx } from 'react/jsx-runtime';\nexport const j = jsx;\n", 'no-restricted-imports'],
  ['src/advice/a.ts', "import { openDB } from 'idb';\nexport const o = openDB;\n", 'no-restricted-imports'],
  ['src/stats/a.ts', "import Dexie from 'dexie';\nexport const D = Dexie;\n", 'no-restricted-imports'],
  ['src/stats/sub/a.ts', "import App from '../../ui/App';\nexport const A = App;\n", 'no-restricted-imports'],
  ['src/engine/a.ts', 'export const w = window.document;\n', 'no-restricted-globals'],
  ['src/engine/a.ts', 'export const l = globalThis.localStorage;\n', 'no-restricted-properties'],
  ['src/engine/a.ts', 'export const l = globalThis.indexedDB;\n', 'no-restricted-properties'],
  ['src/engine/a.ts', "export const l = () => import('react');\n", 'no-restricted-syntax'],
  ['src/engine/a.ts', "export { useState } from 'react';\n", 'no-restricted-imports'],
  // allowed
  ['src/engine/ok.ts', 'export const f = fetch;\nexport const e = Event;\nexport const g = globalThis;\nexport const c = crypto.randomUUID;\n', null],
  ['src/engine/ok.ts', "import { join } from 'node:path';\nexport const j = join;\n", null],
  ['src/ui/ok.ts', 'export const t = document.title;\n', null],
  ['tools/ok.ts', 'export const t = document.title;\n', null],
  ['src/engines/ok.ts', 'export const t = document.title;\n', null], // similar name, not headless
];
for (const [file, text, rule] of cases) {
  const m = await lint(file, text);
  const errs = m.filter((x) => x.severity === 2);
  const ok = rule ? errs.some((x) => x.ruleId === rule && /REQ-059\.2/.test(x.message)) : errs.length === 0;
  console.log(ok ? 'OK  ' : 'FAIL', file, JSON.stringify(text), '->', errs.map((x) => `${x.ruleId}: ${x.message}`).join(' | ') || '(no errors)');
  if (!ok) fails.push(`case ${file} ${text}`);
}
console.log('TOTAL FAILS', fails.length, fails.slice(0, 10));
