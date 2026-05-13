import nextConfig from 'eslint-config-next';

export default [
  ...nextConfig,
  {
    settings: {
      react: { version: '18' },
    },
    rules: {
      // Allow explicit `any` for 3rd-party API responses — warn instead of error
      '@typescript-eslint/no-explicit-any': 'warn',
      // Unused vars: ignore underscore-prefixed intentional ones
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // React 17+ doesn't need React in scope
      'react/react-in-jsx-scope': 'off',
    },
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'jest.config.*',
    ],
  },
];
