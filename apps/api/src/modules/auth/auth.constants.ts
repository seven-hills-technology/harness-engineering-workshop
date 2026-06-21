export const DEV_JWT_SECRET = 'workshop-dev-secret-change-me';

export const JWT_EXPIRES_IN = '8h';

export function resolveJwtSecret(): string {
  return process.env.JWT_SECRET ?? DEV_JWT_SECRET;
}
