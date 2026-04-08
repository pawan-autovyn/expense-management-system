import { NAVIGATION_ITEMS } from './navigation.constants';
import { Role } from '../../models/app.models';

describe('navigation constants', () => {
  it('keeps admin and manager navigation grouped by role', () => {
    const adminItems = NAVIGATION_ITEMS.filter((item) => item.roles.includes(Role.Admin));
    const managerItems = NAVIGATION_ITEMS.filter((item) =>
      item.roles.includes(Role.OperationManager),
    );

    expect(adminItems.every((item) => item.route.startsWith('/admin'))).toBeTrue();
    expect(managerItems.every((item) => item.route.startsWith('/manager'))).toBeTrue();
    expect(NAVIGATION_ITEMS.some((item) => item.badge === '4')).toBeTrue();
    expect(NAVIGATION_ITEMS.some((item) => item.badge === '3')).toBeTrue();
  });
});
