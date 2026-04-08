import { APP_SUBTITLE, APP_TITLE, STORAGE_KEYS } from './app.constants';

describe('app constants', () => {
  it('exports the expected branding and storage keys', () => {
    expect(APP_TITLE).toBe('CoreWork EMS');
    expect(APP_SUBTITLE).toBe('Enterprise Expense Management');
    expect(STORAGE_KEYS).toEqual({
      session: 'aurora-ledger-session',
      theme: 'aurora-ledger-theme',
      expenses: 'aurora-ledger-expenses',
      notifications: 'aurora-ledger-notifications',
    });
  });
});
