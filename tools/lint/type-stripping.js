// Type-stripping lint rules: `npm run playtest` loads src/ and tools/ through Node's built-in type
// stripping, which rejects non-erasable TypeScript and JSON imports without an import attribute.

/** Files Node loads directly through the playtest loader. */
export const TYPE_STRIPPING_FILES = ['src/**/*.{ts,tsx}', 'tools/**/*.{ts,js}'];

/** Shared with the headless block, because flat config replaces `no-restricted-syntax` per file. */
export const TYPE_STRIPPING_RESTRICTED_SYNTAX = [
  {
    selector:
      ':matches(ImportDeclaration, ExportNamedDeclaration, ExportAllDeclaration)[source.value=/\\.json$/][attributes.length=0]',
    message:
      "JSON imports need `with { type: 'json' }`: Node type stripping (npm run playtest) rejects them without it.",
  },
  {
    selector: 'TSEnumDeclaration',
    message:
      'Enums are not erasable: Node type stripping (npm run playtest) rejects them. Use a union of literals or an as-const object.',
  },
];

/** @type {import('eslint').Linter.Config} */
export const typeStrippingConfig = {
  name: 'type-stripping',
  files: TYPE_STRIPPING_FILES,
  rules: {
    '@typescript-eslint/parameter-properties': ['error', { prefer: 'class-property' }],
    'no-restricted-syntax': ['error', ...TYPE_STRIPPING_RESTRICTED_SYNTAX],
  },
};
