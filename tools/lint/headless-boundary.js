// Headless-boundary lint rules (REQ-059.2): engine, bots, advice and stats code must not
// use React, DOM or IndexedDB APIs, so it can run in Node without a browser.
import globals from 'globals';

/** Folders under src/ that must stay headless. */
export const HEADLESS_DIRS = ['engine', 'bots', 'advice', 'stats'];

export const HEADLESS_FILES = HEADLESS_DIRS.map((dir) => `src/${dir}/**`);

const BROWSER_ONLY_MESSAGE = 'Browser-only API in a headless module (REQ-059.2).';

/**
 * Every browser global that Node and plain ECMAScript do not provide, plus the storage and
 * navigator globals that some Node versions also expose.
 * @type {string[]}
 */
export const BROWSER_ONLY_GLOBALS = [
  ...new Set([
    ...Object.keys(globals.browser).filter(
      (name) => !(name in globals.node) && !(name in globals.builtin),
    ),
    'localStorage',
    'sessionStorage',
    'navigator',
  ]),
].sort();

export const FORBIDDEN_IMPORT_PATTERNS = [
  {
    group: ['react', 'react/*', 'react-dom', 'react-dom/*'],
    message: 'Headless modules must not import React (REQ-059.2).',
  },
  {
    group: ['idb', 'idb/*', 'idb-keyval', 'dexie', 'fake-indexeddb', 'fake-indexeddb/*'],
    message: 'Headless modules must not import IndexedDB libraries (REQ-059.2).',
  },
  {
    group: ['**/ui', '**/ui/**'],
    message: 'Headless modules must not import UI code from src/ui (REQ-059.2).',
  },
];

/** @type {import('eslint').Linter.Config} */
export const headlessBoundaryConfig = {
  name: 'headless-boundary',
  files: HEADLESS_FILES,
  rules: {
    'no-restricted-imports': ['error', { patterns: FORBIDDEN_IMPORT_PATTERNS }],
    'no-restricted-globals': [
      'error',
      ...BROWSER_ONLY_GLOBALS.map((name) => ({ name, message: BROWSER_ONLY_MESSAGE })),
    ],
    'no-restricted-properties': [
      'error',
      ...BROWSER_ONLY_GLOBALS.map((property) => ({
        object: 'globalThis',
        property,
        message: BROWSER_ONLY_MESSAGE,
      })),
    ],
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ImportExpression',
        message: 'Dynamic import() is not allowed in headless modules (REQ-059.2).',
      },
    ],
  },
};
