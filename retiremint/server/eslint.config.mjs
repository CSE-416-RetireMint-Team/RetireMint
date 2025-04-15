import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs', // IMPORTANT: enables CommonJS (require/module)
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Allow declaring variables in case blocks (but still not best practice)
      'no-case-declarations': 'off',
      'no-unused-vars': ['warn', { args: 'after-used', ignoreRestSiblings: true }],
    },
  },
  {
    files: ['**/__tests__/**/*.js', '**/*.test.js'],
    languageOptions: {
      globals: {
        ...globals.jest, // Enables describe/it/expect/etc
      },
    },
  },
];
