import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  js.configs.recommended,
  prettierConfig,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        confirm: 'readonly',
        WebSocket: 'readonly',
        RealtimeIRL: 'readonly',

        // Custom globals
        resetTripProgress: 'readonly',
        resetAutoStartLocation: 'readonly',
        resetTodayDistance: 'readonly',
        exportTripData: 'readonly',
        importTripData: 'readonly',
        toggleControls: 'readonly',
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'no-console': 'off', // Allow console for debugging IRL streams
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // Enforce braces for all control statements
      curly: ['error', 'all'],

      eqeqeq: ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-return-assign': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-with': 'error',
      radix: 'error',
      'wrap-iife': ['error', 'any'],

      'no-delete-var': 'error',
      'no-label-var': 'error',
      'no-shadow': 'error',
      'no-undef-init': 'error',

      'arrow-spacing': 'error',
      'no-duplicate-imports': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-template': 'error',

      'prettier/prettier': 'error',

      camelcase: ['error', { properties: 'never' }],
    },
  },
];
