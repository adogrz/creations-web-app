import nextPlugin from '@next/eslint-plugin-next'
import tsParser from '@typescript-eslint/parser'

export default [
  {
    ignores: [
      '.next/**',
      'generated/**',
      'node_modules/**',
      'dist/**',
      'build/**',
      'tsconfig.tsbuildinfo',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
]
