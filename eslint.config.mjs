import nextConfig from 'eslint-config-next';

export default [
  { ignores: ['node_modules/**', '.next/**', 'out/**', '.claude/**'] },
  ...nextConfig,
  { settings: { react: { version: '18' } } },
];
