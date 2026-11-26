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
export const BOT_DETERMINISM_FILES = ['src/bots/**', 'src/advice/**', 'src/engine/bot-random.ts'];

const NON_DETERMINISTIC_MESSAGE =
  'Non-deterministic source in bot decision code; use the seeded bot generator (REQ-028.1).';

/**
 * A bare reference to one of these globals (`const c = crypto`, `const { random } = Math`, `f(crypto)`) would
 * escape the member-expression bans. Allowed: the object of a member expression (`Math.floor`), property and
 * key names (`o.crypto`, `{ crypto: 1 }`) and type names.
 */
const BARE_GLOBAL_REFERENCE = [
  'Identifier[name=/^(Math|Date|crypto|performance|globalThis)$/]',
  ':not(MemberExpression > .object)',
  ':not(MemberExpression[computed=false] > .property)',
  ':not(Property[computed=false] > .key)',
  ':not(PropertyDefinition[computed=false] > .key)',
  ':not(MethodDefinition[computed=false] > .key)',
  ':not(TSPropertySignature[computed=false] > .key)',
  ':not(TSMethodSignature[computed=false] > .key)',
  ':not(TSTypeReference > .typeName)',
  ':not(TSQualifiedName > .left)',
  ':not(TSQualifiedName > .right)',
  ':not(TSTypeQuery > .exprName)',
  // new Date() and Date() have their own selectors below.
  ':not(NewExpression > .callee)',
  ':not(CallExpression > .callee)',
].join('');

const BOT_DETERMINISM_RESTRICTED_SYNTAX = [
  ...HEADLESS_RESTRICTED_SYNTAX,
  { selector: "NewExpression[callee.name='Date']", message: NON_DETERMINISTIC_MESSAGE },
  { selector: "CallExpression[callee.name='Date']", message: NON_DETERMINISTIC_MESSAGE },
  { selector: BARE_GLOBAL_REFERENCE, message: NON_DETERMINISTIC_MESSAGE },
];

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
      { object: 'globalThis', property: 'Math', message: NON_DETERMINISTIC_MESSAGE },
    ],
    'no-restricted-syntax': ['error', ...BOT_DETERMINISM_RESTRICTED_SYNTAX],
  },
};

/** Bot code decides only from its seat's PlayerView, never from hidden hand state (REQ-025.1). */
export const BOT_BOUNDARY_FILES = ['src/bots/**'];

const BOT_BOUNDARY_MESSAGE =
  'Bot code may import only PlayerView-boundary types from the engine (PlayerView, SeatPolicy and other src/engine/player-view.ts types; Action, SeatNumber, Street from src/engine/hand.ts), so it cannot see hidden cards (REQ-025.1).';

const BOT_PACKAGE_MESSAGE =
  'Bot code may import only project modules by relative path (REQ-025.1).';

export const BOT_BOUNDARY_PATTERNS = [
  { regex: '^(?!\\.)', message: BOT_PACKAGE_MESSAGE },
  // A non-normalized path ('/./', '//', 'name/..') could reach an engine module past the patterns below.
  { regex: '/\\./|//|(^|/)[^./][^/]*/\\.\\.(/|$)', message: BOT_BOUNDARY_MESSAGE },
  { regex: '(^|/)engine/(?!(player-view|hand)$)[^/]+$', message: BOT_BOUNDARY_MESSAGE },
  { regex: '(^|/)engine/player-view$', allowTypeImports: true, message: BOT_BOUNDARY_MESSAGE },
  {
    regex: '(^|/)engine/hand$',
    allowImportNames: ['Action', 'SeatNumber', 'Street'],
    message: BOT_BOUNDARY_MESSAGE,
  },
  // golden.ts builds hands with createHand/applyAction, so it sits outside the advice boundary (TASK-6.27 D-3).
  { regex: '(^|/)advice/golden$', message: BOT_BOUNDARY_MESSAGE },
];

// Groups with allowImportNames ignore imports that have no specifiers, so side-effect imports need a selector.
const BOT_SIDE_EFFECT_IMPORT = {
  selector: 'ImportDeclaration[specifiers.length=0][source.value=/(^|\\/)engine\\//]',
  message: BOT_BOUNDARY_MESSAGE,
};

// A type-position import('…') is a TSImportType, which no-restricted-imports does not check (TASK-6.27).
// Same allow-list as BOT_BOUNDARY_PATTERNS: any engine/player-view type, and Action, SeatNumber, Street from
// engine/hand.
const BOT_TYPE_IMPORT_SYNTAX = [
  {
    selector:
      'TSImportType[source.value=/(^|\\/)engine\\//]:not([source.value=/(^|\\/)engine\\/(player-view|hand)$/]),' +
      'TSImportType[source.value=/\\/\\.\\/|\\/\\/|(^|\\/)[^.\\/][^\\/]*\\/\\.\\.(\\/|$)/]',
    message: BOT_BOUNDARY_MESSAGE,
  },
  {
    selector:
      "TSImportType[source.value=/(^|\\/)engine\\/hand$/]:not([qualifier.type='Identifier'][qualifier.name=/^(Action|SeatNumber|Street)$/])",
    message: BOT_BOUNDARY_MESSAGE,
  },
];

/**
 * Must come after botDeterminismConfig: it replaces that block's no-restricted-syntax options for these
 * files, so the determinism entries are repeated.
 * @type {import('eslint').Linter.Config}
 */
export const botSeatPolicyConfig = {
  name: 'bot-seat-policy',
  files: BOT_BOUNDARY_FILES,
  rules: {
    '@typescript-eslint/no-restricted-imports': ['error', { patterns: BOT_BOUNDARY_PATTERNS }],
    'no-restricted-syntax': [
      'error',
      ...BOT_DETERMINISM_RESTRICTED_SYNTAX,
      BOT_SIDE_EFFECT_IMPORT,
      ...BOT_TYPE_IMPORT_SYNTAX,
    ],
  },
};

export const ADVICE_BOUNDARY_FILES = ['src/advice/**'];

// golden.ts builds fixed golden-spot hands for tests with createHand/applyAction; bots may not import it.
export const ADVICE_BOUNDARY_IGNORES = ['src/advice/golden.ts'];

const ADVICE_BOUNDARY_MESSAGE =
  'Advice code that bots use may import only PlayerView-boundary engine types and the pure card, evaluator and random helpers, so bots cannot reach hidden cards through it (REQ-025.1).';

export const ADVICE_BOUNDARY_PATTERNS = [
  { regex: '/\\./|//|(^|/)[^./][^/]*/\\.\\.(/|$)', message: ADVICE_BOUNDARY_MESSAGE },
  {
    regex: '(^|/)engine/(?!(player-view|hand|cards|hand-evaluator|seeded-random)$)[^/]+$',
    message: ADVICE_BOUNDARY_MESSAGE,
  },
  { regex: '(^|/)engine/player-view$', allowTypeImports: true, message: ADVICE_BOUNDARY_MESSAGE },
  {
    regex: '(^|/)engine/hand$',
    allowImportNames: ['Action', 'SeatNumber', 'Street', 'STREET_BET_CAP'],
    message: ADVICE_BOUNDARY_MESSAGE,
  },
];

/**
 * TASK-6.27 D-3 (user answer Q-1, option (a)): bots may import src/advice, because every bot style builds on
 * the advice engine (REQ-026.1). This block keeps engine hand state out of the advice code bots can reach,
 * so that path cannot see hidden cards either (REQ-025.1); bots may not import advice/golden.
 * @type {import('eslint').Linter.Config}
 */
export const adviceHiddenStateConfig = {
  name: 'advice-hidden-state',
  files: ADVICE_BOUNDARY_FILES,
  ignores: ADVICE_BOUNDARY_IGNORES,
  rules: {
    '@typescript-eslint/no-restricted-imports': ['error', { patterns: ADVICE_BOUNDARY_PATTERNS }],
  },
};
