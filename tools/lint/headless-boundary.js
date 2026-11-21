// Headless-boundary lint rules (REQ-059.2): engine, bots, advice, stats, playtest and table code
// must not use React, DOM or IndexedDB APIs, so it can run in Node without a browser.
import globals from 'globals';
import { TYPE_STRIPPING_RESTRICTED_SYNTAX } from './type-stripping.js';

/** Folders under src/ that must stay headless (REQ-059.2; 90% coverage threshold). */
export const HEADLESS_DIRS = ['engine', 'bots', 'advice', 'stats', 'playtest', 'table'];

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

const HEADLESS_RESTRICTED_PROPERTIES = BROWSER_ONLY_GLOBALS.map((property) => ({
  object: 'globalThis',
  property,
  message: BROWSER_ONLY_MESSAGE,
}));

const HEADLESS_RESTRICTED_SYNTAX = [
  {
    selector: 'ImportExpression',
    message: 'Dynamic import() is not allowed in headless modules (REQ-059.2).',
  },
  ...TYPE_STRIPPING_RESTRICTED_SYNTAX,
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
    'no-restricted-properties': ['error', ...HEADLESS_RESTRICTED_PROPERTIES],
    'no-restricted-syntax': ['error', ...HEADLESS_RESTRICTED_SYNTAX],
  },
};

/** Bot decision code: the seeded bot generator is the only source of randomness (REQ-028.1). */
export const BOT_DETERMINISM_FILES = ['src/bots/**', 'src/advice/**'];

const NON_DETERMINISTIC_MESSAGE =
  'Non-deterministic source in bot decision code; use the seeded bot generator (REQ-028.1).';

/**
 * Must come after headlessBoundaryConfig: it replaces that block's no-restricted-properties and
 * no-restricted-syntax options for these files, so the headless entries are repeated. It doesn't use
 * no-restricted-globals, whose headless options must stay as they are.
 * @type {import('eslint').Linter.Config}
 */
export const botDeterminismConfig = {
  name: 'bot-determinism',
  files: BOT_DETERMINISM_FILES,
  rules: {
    'no-restricted-properties': [
      'error',
      ...HEADLESS_RESTRICTED_PROPERTIES,
      { object: 'Math', property: 'random', message: NON_DETERMINISTIC_MESSAGE },
      ...['Date', 'crypto', 'performance'].flatMap((name) => [
        { object: name, message: NON_DETERMINISTIC_MESSAGE },
        { object: 'globalThis', property: name, message: NON_DETERMINISTIC_MESSAGE },
      ]),
    ],
    'no-restricted-syntax': [
      'error',
      ...HEADLESS_RESTRICTED_SYNTAX,
      { selector: "NewExpression[callee.name='Date']", message: NON_DETERMINISTIC_MESSAGE },
      { selector: "CallExpression[callee.name='Date']", message: NON_DETERMINISTIC_MESSAGE },
    ],
  },
};
