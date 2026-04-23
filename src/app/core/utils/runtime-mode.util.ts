export const isKarmaTestEnvironment = (): boolean =>
  typeof globalThis !== 'undefined' && '__karma__' in globalThis;
