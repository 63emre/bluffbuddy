// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**', 'node_modules/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      "prettier/prettier": ["error", { endOfLine: "auto" }],

      // ==========================================================
      // 🚨 MODULE BOUNDARY ENFORCEMENT (THE POLICE)
      // ==========================================================
      // These rules STRICTLY prevent developers from bypassing the
      // modular monolith architecture. Violations will break CI/CD.
      // 
      // GOLDEN RULE: Use @contracts for interfaces, @moduleName for modules
      // NEVER import ../otherModule/services/* directly!
      // ==========================================================
      'no-restricted-imports': ['error', {
        patterns: [
          // ============================================
          // GAME MODULE BOUNDARIES
          // ============================================
          {
            group: ['../game/services/*', '../game/gateways/*', '../game/mechanics/*'],
            message: '❌ FORBIDDEN: Import from @game or @contracts instead. Use DI_TOKENS for injection.',
          },
          {
            group: ['../../game/services/*', '../../game/gateways/*'],
            message: '❌ FORBIDDEN: Import from @game or @contracts instead. Use DI_TOKENS for injection.',
          },

          // ============================================
          // SOCIAL MODULE BOUNDARIES
          // ============================================
          {
            group: ['../social/services/*', '../social/gateways/*'],
            message: '❌ FORBIDDEN: Import from @social or @contracts instead. Use DI_TOKENS for injection.',
          },
          {
            group: ['../../social/services/*', '../../social/gateways/*'],
            message: '❌ FORBIDDEN: Import from @social or @contracts instead. Use DI_TOKENS for injection.',
          },

          // ============================================
          // INFRASTRUCTURE MODULE BOUNDARIES
          // ============================================
          {
            group: ['../infrastructure/services/*', '../infrastructure/adapters/*'],
            message: '❌ FORBIDDEN: Import from @infrastructure or @contracts instead. Use DI_TOKENS for injection.',
          },
          {
            group: ['../../infrastructure/services/*', '../../infrastructure/adapters/*'],
            message: '❌ FORBIDDEN: Import from @infrastructure or @contracts instead. Use DI_TOKENS for injection.',
          },

          // ============================================
          // DATABASE MODULE BOUNDARIES
          // ============================================
          {
            group: ['../database/services/*', '../database/repositories/*'],
            message: '❌ FORBIDDEN: Import from @database or @contracts instead. Use DI_TOKENS for injection.',
          },
          {
            group: ['../../database/services/*', '../../database/repositories/*'],
            message: '❌ FORBIDDEN: Import from @database or @contracts instead. Use DI_TOKENS for injection.',
          },

          // ============================================
          // AUTH MODULE BOUNDARIES
          // ============================================
          {
            group: ['../auth/services/*'],
            message: '❌ FORBIDDEN: Import from @auth or @contracts instead. Use DI_TOKENS for injection.',
          },
          {
            group: ['../../auth/services/*'],
            message: '❌ FORBIDDEN: Import from @auth or @contracts instead. Use DI_TOKENS for injection.',
          },

          // ============================================
          // RATING MODULE BOUNDARIES
          // ============================================
          {
            group: ['../rating/services/*'],
            message: '❌ FORBIDDEN: Import from @rating or @contracts instead. Use DI_TOKENS for injection.',
          },
          {
            group: ['../../rating/services/*'],
            message: '❌ FORBIDDEN: Import from @rating or @contracts instead. Use DI_TOKENS for injection.',
          },

          // ============================================
          // ECONOMY MODULE BOUNDARIES
          // ============================================
          {
            group: ['../economy/services/*', '../economy/controllers/*'],
            message: '❌ FORBIDDEN: Import from @economy or @contracts instead. Use DI_TOKENS for injection.',
          },
          {
            group: ['../../economy/services/*'],
            message: '❌ FORBIDDEN: Import from @economy or @contracts instead. Use DI_TOKENS for injection.',
          },

          // ============================================
          // DEEP RELATIVE IMPORT PREVENTION
          // ============================================
          {
            group: ['../../..', '../../../*', '../../../../*'],
            message: '❌ FORBIDDEN: Use path aliases (@shared, @game, @contracts, etc.) instead of deep relative imports.',
          },

          // ============================================
          // DIRECT CONTRACTS FILE IMPORT PREVENTION
          // (Force use of barrel export)
          // ============================================
          {
            group: ['../shared/contracts/interfaces/*', '../shared/contracts/di-tokens'],
            message: '⚠️  PREFER: Import from @contracts instead of direct file paths.',
          },
        ],
      }],
    },
  },

  // ==========================================================
  // 🔒 STRICTER RULES FOR MODULE FILES
  // Module.ts files need special attention as they define boundaries
  // ==========================================================
  {
    files: ['**/*.module.ts'],
    rules: {
      // Modules should not have complex logic
      'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
    },
  },

  // ==========================================================
  // 🔒 STRICTER RULES FOR SERVICE FILES
  // Services must use DI, not direct imports
  // ==========================================================
  {
    files: ['**/services/**/*.ts'],
    rules: {
      // Services should be reasonably sized
      'max-lines': ['warn', { max: 400, skipBlankLines: true, skipComments: true }],
    },
  },
);
