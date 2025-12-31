import { env } from 'prisma/config';
export const jwtConstants = {
  secret: env('JWT_SECRET'),
};
