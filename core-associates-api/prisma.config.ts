import { defineConfig, env } from 'prisma/config';
import { config } from 'dotenv';

// prisma.config.ts skips automatic .env loading; we load it manually here.
config();

export default defineConfig({
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    seed: 'ts-node src/prisma/seed.ts',
  },
});
