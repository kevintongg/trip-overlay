import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  prettier,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        AbortController: 'readonly',
        confirm: 'readonly',
        WebSocket: 'readonly',
        RealtimeIRL: 'readonly',

        // Vite globals
        import: 'readonly',
      },
    },
    plugins: {
      prettier: prettierPlugin,
      react: react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      '@typescript-eslint': typescript,
    },
    rules: {
      // Prettier integration
      'prettier/prettier': 'error',

      // React Rules
      'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform
      'react/prop-types': 'off', // Using TypeScript for type checking
      'react/jsx-uses-react': 'off', // Not needed with new JSX transform
      'react/jsx-uses-vars': 'error',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-pascal-case': 'error',
      'react/no-children-prop': 'error',
      'react/no-danger-with-children': 'error',
      'react/no-deprecated': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-find-dom-node': 'error',
      'react/no-is-mounted': 'error',
      'react/no-render-return-value': 'error',
      'react/no-string-refs': 'error',
      'react/no-unescaped-entities': 'error',
      'react/no-unknown-property': 'error',
      'react/require-render-return': 'error',

      // React Hooks Rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React Refresh
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Accessibility Rules
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/iframe-has-title': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/no-access-key': 'error',
      'jsx-a11y/no-distracting-elements': 'error',
      'jsx-a11y/no-redundant-roles': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/scope': 'error',

      // TypeScript Rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/prefer-const': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // Enhanced JavaScript Rules
      'no-console': 'off', // Allow console for debugging IRL streams
      'curly': ['error', 'all'], // Enforce braces for all control statements (user preference)
      'eqeqeq': ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-return-assign': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-with': 'error',
      'radix': 'error',
      'wrap-iife': ['error', 'any'],
      'no-delete-var': 'error',
      'no-label-var': 'error',
      'no-shadow': 'off', // Turned off in favor of TS version
      '@typescript-eslint/no-shadow': 'error',
      'no-undef-init': 'error',
      'arrow-spacing': 'error',
      'no-duplicate-imports': 'error',
      'no-var': 'error',
      'prefer-const': 'off', // Using TS version
      'prefer-template': 'error',
      'camelcase': ['error', { properties: 'never' }],

      // Additional modern best practices
      'object-shorthand': 'error',
      'prefer-destructuring': ['error', { object: true, array: false }],
      'prefer-spread': 'error',
      'prefer-rest-params': 'error',
      'no-param-reassign': 'error',
      'no-nested-ternary': 'error',
      'no-unneeded-ternary': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
