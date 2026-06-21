export type JwtPayload = {
  sub: number;
  email: string;
  isAdmin: boolean;
};

export type AuthenticatedUser = {
  id: number;
  email: string;
  isAdmin: boolean;
};

export type SafeUser = {
  id: number;
  email: string;
  isAdmin: boolean;
  createdAt: Date;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthenticatedUser;
};
