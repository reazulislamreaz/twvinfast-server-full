import { defineConfig, env } from 'prisma/config';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = env('DATABASE_URL');
if (!databaseUrl) {
  throw new Error('DATABASE_URL is missing in environment variables');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  engine: 'classic',
  datasource: {
    url: databaseUrl,
  },
});
