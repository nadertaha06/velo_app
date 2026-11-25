// Ponta a ponta contra um backend de verdade (dev), com o código do app.
// Não entra no `npx jest` normal. Uso: ver e2e/README.md.
//
// Ambiente Node puro: `fetch`, `Request` e `Response` nativos do Node, para
// falar com o servidor de verdade. No preset do Expo, o `fetch` global é o
// `expo/fetch` com módulo nativo falso (sem rede) e o `Request` é o do Node:
// os dois não combinam. Do React Native, o app usa aqui só `Platform` e
// `AppState`, mockados no teste.
// Mantém o `fetch` nativo do Node (o Expo só troca o global sem esta chave).
process.env.EXPO_PUBLIC_USE_RN_FETCH = '1';

const base = require('./package.json').jest;

module.exports = {
  ...base,
  testEnvironment: 'node',
  setupFiles: ['./jest.setup.js'],
  roots: ['<rootDir>/e2e'],
  testMatch: ['**/*.e2e.test.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  testTimeout: 30000,
};
