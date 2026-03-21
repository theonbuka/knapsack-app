import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage/**', 'node_modules', 'android/**', '**/*.d.ts', 'eslint.config.js']),
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        __APP_VERSION__: 'readonly',
      },
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // ─── Disable Conflicting Rules ─────────────────
      'no-unused-vars': 'off',

      // ─── Base JS Quality Rules ─────────────────────
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',
      'no-duplicate-imports': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-loss-of-precision': 'error',
      'no-unsafe-negation': 'error',
      'no-unsafe-optional-chaining': 'error',
      'no-self-compare': 'error',
      'prefer-const': ['error', { destructuring: 'any' }],
      'require-yield': 'error',
      'use-isnan': 'error',
      'eqeqeq': ['error', 'smart'],
      'curly': ['error', 'multi-line'],
      'no-else-return': ['error', { allowElseIf: true }],
      'no-extra-boolean-cast': 'error',
      'no-multi-spaces': 'error',
      'no-useless-escape': 'error',
      'no-useless-return': 'error',
      'object-shorthand': ['error', 'always'],
      'no-param-reassign': ['error', { props: false }],
      'no-throw-literal': 'error',
      'prefer-template': 'warn',

      // ─── TypeScript Quality Rules ──────────────────
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^[A-Z_]|^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-misused-new': 'error',
      '@typescript-eslint/no-shadow': ['error', { hoist: 'all' }],
      '@typescript-eslint/no-var-requires': 'warn',

      // ─── React Specific Rules ──────────────────────
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
])
