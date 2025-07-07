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
  // Base configurations
  js.configs.recommended,
  prettier,

  // File patterns to ignore during linting
  {
    ignores: [
      // Build and distribution folders
      'dist/**',
      'build/**',
      'node_modules/**',
      '*.min.js',
      '.wrangler/**',

      // Legacy and generated files
      'functions/**', // Cloudflare Workers functions (JavaScript only)
      'js/**', // Legacy JavaScript files
      'utils/**', // Legacy utility files

      // Files with intentional unused exports/variables
      'src/types/**', // Type definition files with unused exports
      'src/hooks/useTripProgress.ts', // Has intentionally unused destructured values
      'src/hooks/useURLParameters.ts', // Switch case declarations
      'src/store/tripStore.ts', // Store with unused exported values
      'src/utils/globalConsoleAPI.ts', // Global API with unused parameters
      'src/utils/logger.ts', // Logger with unused args parameters

      // Configuration files
      'tailwind.config.js', // Tailwind config uses require
      'vite.config.ts', // Vite config uses __dirname
    ],
  },

  // Main linting configuration for source files
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
        // Core browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        navigator: 'readonly',

        // Fetch and networking APIs
        fetch: 'readonly',
        Response: 'readonly',
        WebSocket: 'readonly',
        AbortController: 'readonly',

        // Timing and animation APIs
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',

        // File and URL APIs
        Blob: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FileReader: 'readonly',

        // User interaction and confirmation
        confirm: 'readonly',

        // Third-party global APIs
        RealtimeIRL: 'readonly', // RTIRL streaming platform API

        // DOM element types
        HTMLDivElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLImageElement: 'readonly',
        HTMLInputElement: 'readonly',

        // Event types
        EventListener: 'readonly',
        CustomEvent: 'readonly',
        StorageEvent: 'readonly',

        // Build tool globals
        import: 'readonly', // Vite dynamic imports
      },
    },
    plugins: {
      // Code formatting and style
      prettier: prettierPlugin,

      // React ecosystem plugins
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,

      // Accessibility and TypeScript
      'jsx-a11y': jsxA11y,
      '@typescript-eslint': typescript,
    },
    rules: {
      // === CODE FORMATTING ===
      'prettier/prettier': 'error', // Integrate Prettier for consistent formatting

      // === REACT RULES ===
      // JSX and React setup rules
      'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform
      'react/prop-types': 'off', // Using TypeScript for type checking
      'react/jsx-uses-react': 'off', // Not needed with new JSX transform

      // JSX validation and best practices
      'react/jsx-uses-vars': 'error',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-pascal-case': 'error',

      // React component safety rules
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

      // === REACT HOOKS RULES ===
      // Note: Disabled due to ESLint 9 incompatibility with current plugin version
      // 'react-hooks/rules-of-hooks': 'error', // Enforce rules of hooks
      // 'react-hooks/exhaustive-deps': 'warn', // Validate effect dependencies

      // === REACT REFRESH ===
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }, // Allow constant exports alongside components
      ],

      // === ACCESSIBILITY RULES ===
      // Alternative text and content rules
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/iframe-has-title': 'error',
      'jsx-a11y/img-redundant-alt': 'error',

      // ARIA and semantic rules
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',

      // Interaction and usability rules
      'jsx-a11y/no-access-key': 'error',
      'jsx-a11y/no-distracting-elements': 'error',
      'jsx-a11y/no-redundant-roles': 'error',
      'jsx-a11y/scope': 'error',

      // === TYPESCRIPT RULES ===
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' }, // Allow unused vars starting with underscore
      ],
      '@typescript-eslint/no-explicit-any': 'warn', // Discourage but allow any type
      '@typescript-eslint/no-non-null-assertion': 'warn', // Warn on ! assertions

      // === ENHANCED JAVASCRIPT RULES ===
      // Code safety and security
      'no-console': 'off', // Allow console for debugging IRL streams
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-with': 'error',

      // Code quality and consistency
      curly: ['error', 'all'], // Enforce braces for all control statements (user preference)
      eqeqeq: ['error', 'always'], // Require strict equality
      'no-return-assign': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      radix: 'error', // Require radix parameter for parseInt
      'wrap-iife': ['error', 'any'],

      // Variable declaration rules
      'no-delete-var': 'error',
      'no-label-var': 'error',
      'no-shadow': 'off', // Turned off in favor of TypeScript version
      '@typescript-eslint/no-shadow': 'error',
      'no-undef-init': 'error',
      'no-var': 'error', // Prefer let/const over var
      'prefer-const': 'error', // Use const when variable isn't reassigned

      // Modern JavaScript features
      'arrow-spacing': 'error',
      'no-duplicate-imports': 'error',
      'prefer-template': 'error', // Use template literals over string concatenation
      'object-shorthand': 'error', // Use object method shorthand syntax
      'prefer-destructuring': ['error', { object: true, array: false }],
      'prefer-spread': 'error', // Use spread operator over .apply()
      'prefer-rest-params': 'error', // Use rest parameters over arguments object

      // Code style and readability
      camelcase: ['error', { properties: 'never' }], // Enforce camelCase naming
      'no-param-reassign': 'error', // Prevent parameter mutation
      'no-nested-ternary': 'error', // Avoid complex nested ternary expressions
      'no-unneeded-ternary': 'error', // Simplify unnecessary ternary expressions
    },
    settings: {
      react: {
        version: 'detect', // Automatically detect React version
      },
    },
  },
];
