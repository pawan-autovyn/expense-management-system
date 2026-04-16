import { APP_SUBTITLE, APP_TITLE, STORAGE_KEYS } from './app.constants';

describe('app constants', () => {
  it('exports the expected branding and storage keys', () => {
    expect(APP_TITLE).toBe('ExpenseFlow');
    expect(APP_SUBTITLE).toBe('Enterprise expense workflow');
    expect(STORAGE_KEYS).toEqual({
      session: 'enterprise-expense-session',
      theme: 'enterprise-expense-theme',
      expenses: 'enterprise-expense-expenses',
      notifications: 'enterprise-expense-notifications',
    });
  });
});
