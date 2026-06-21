import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

type UsersServiceMock = Pick<UsersService, 'findByEmail'> & {
  findByEmail: jest.Mock;
};

type JwtServiceMock = Pick<JwtService, 'signAsync'> & {
  signAsync: jest.Mock;
};

function buildUser(overrides: Partial<User> = {}): User {
  const user = new User();
  user.id = overrides.id ?? 1;
  user.email = overrides.email ?? 'admin@test.com';
  user.passwordHash = overrides.passwordHash ?? 'hash';
  user.isAdmin = overrides.isAdmin ?? true;
  user.createdAt = overrides.createdAt ?? new Date('2026-01-01T00:00:00Z');
  return user;
}

describe('AuthService', () => {
  let users: UsersServiceMock;
  let jwt: JwtServiceMock;
  let service: AuthService;

  beforeEach(() => {
    users = { findByEmail: jest.fn() };
    jwt = { signAsync: jest.fn() };
    service = new AuthService(
      users as unknown as UsersService,
      jwt as unknown as JwtService,
    );
  });

  describe('validateUser', () => {
    it('returns a safe user when credentials are valid', async () => {
      const hash = await bcrypt.hash('password', 10);
      const user = buildUser({ passwordHash: hash });
      users.findByEmail.mockResolvedValue(user);

      const result = await service.validateUser('admin@test.com', 'password');

      expect(users.findByEmail).toHaveBeenCalledWith('admin@test.com');
      expect(result).toEqual({
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
      });
      const keys = Object.keys(result as unknown as Record<string, unknown>);
      expect(keys).not.toContain('passwordHash');
    });

    it('throws UnauthorizedException when the password is wrong', async () => {
      const hash = await bcrypt.hash('password', 10);
      users.findByEmail.mockResolvedValue(buildUser({ passwordHash: hash }));

      let caught: unknown = null;
      try {
        await service.validateUser('admin@test.com', 'nope');
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException when the email is unknown', async () => {
      users.findByEmail.mockResolvedValue(null);

      let caught: unknown = null;
      try {
        await service.validateUser('ghost@test.com', 'password');
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('signs a token with sub/email/isAdmin and returns the expected shape', async () => {
      jwt.signAsync.mockResolvedValue('signed-token');
      const user = {
        id: 7,
        email: 'admin@test.com',
        isAdmin: true,
        createdAt: new Date('2026-01-01T00:00:00Z'),
      };

      const result = await service.login(user);

      expect(jwt.signAsync).toHaveBeenCalledTimes(1);
      expect(jwt.signAsync).toHaveBeenCalledWith({
        sub: 7,
        email: 'admin@test.com',
        isAdmin: true,
      });
      expect(result).toEqual({
        accessToken: 'signed-token',
        user: { id: 7, email: 'admin@test.com', isAdmin: true },
      });
    });
  });
});
