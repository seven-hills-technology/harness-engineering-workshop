import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../auth.types';
import { AdminGuard } from './admin.guard';

function buildContext(user: AuthenticatedUser | undefined): ExecutionContext {
  const request = user === undefined ? {} : { user };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => undefined,
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
    getArgs: () => [] as unknown as [],
    getArgByIndex: () => undefined,
    switchToRpc: () => ({}) as never,
    switchToWs: () => ({}) as never,
    getType: () => 'http',
  } as unknown as ExecutionContext;
}

describe('AdminGuard', () => {
  let guard: AdminGuard;

  beforeEach(() => {
    guard = new AdminGuard();
  });

  it('allows admin users', () => {
    const context = buildContext({
      id: 1,
      email: 'admin@test.com',
      isAdmin: true,
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws ForbiddenException for non-admin users', () => {
    const context = buildContext({
      id: 2,
      email: 'user@test.com',
      isAdmin: false,
    });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when request.user is missing', () => {
    const context = buildContext(undefined);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
