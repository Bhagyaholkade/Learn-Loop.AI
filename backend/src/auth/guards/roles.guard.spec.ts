import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RolesGuard } from './roles.guard';
import { UserRole } from '../../users/entities/user.entity';

function contextFor(user?: { role?: UserRole }): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows any user when the route has no @Roles()', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(guard.canActivate(contextFor({ role: UserRole.STUDENT }))).toBe(true);
  });

  it('allows a user whose role is listed', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);

    expect(guard.canActivate(contextFor({ role: UserRole.ADMIN }))).toBe(true);
  });

  it('blocks a student from an admin-only route', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);

    expect(() =>
      guard.canActivate(contextFor({ role: UserRole.STUDENT })),
    ).toThrow(ForbiddenException);
  });

  it('blocks a request with no authenticated user', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);

    expect(() => guard.canActivate(contextFor(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
