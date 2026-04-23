import { appConfig } from './app.config';

describe('appConfig', () => {
  it('configures router, animations, http, and zone change detection providers', () => {
    expect(appConfig.providers?.length).toBe(4);
  });
});
