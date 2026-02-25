module.exports = [
  {
    ignores: ['node_modules/**', '.expo/**', 'dist/**', '**/*.ts', '**/*.tsx'],
  },
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {},
  },
];
