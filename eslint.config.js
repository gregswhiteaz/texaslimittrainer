import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import {
  botDeterminismConfig,
  botSeatPolicyConfig,
  headlessBoundaryConfig,
} from './tools/lint/headless-boundary.js';
import { typeStrippingConfig } from './tools/lint/type-stripping.js';

export default defineConfig(
  {
    ignores: [
      'dist',
      'coverage',
      'playwright-report',
      'test-results',
      'backlog',
      'dreams',
      'doit',
      'reports',
      'research_notes',
      '.claude',
    ],
  },
  js.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  { files: ['src/ui/**/*.{ts,tsx}'], extends: [reactHooks.configs.flat.recommended] },
  typeStrippingConfig,
  headlessBoundaryConfig,
  botDeterminismConfig,
  botSeatPolicyConfig,
  prettier,
);
