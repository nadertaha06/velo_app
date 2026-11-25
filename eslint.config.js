// https://docs.expo.dev/guides/using-eslint/
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  globalIgnores(['dist/*', '.expo/*', 'docs/*', 'src/api/schema.d.ts']),
  expoConfig,
  {
    files: ['jest.setup.js', '**/__tests__/**', '**/*.test.{ts,tsx}'],
    languageOptions: { globals: { jest: 'readonly', process: 'readonly' } },
  },
  {
    rules: {
      // Só o logger com máscara escreve no console (spec, seção 5).
      'no-console': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@react-native-async-storage/async-storage',
              message: 'Tokens e dados pessoais nunca vão para o AsyncStorage.',
            },
          ],
        },
      ],
    },
  },
]);
