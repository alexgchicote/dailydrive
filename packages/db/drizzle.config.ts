import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load .env.local specifically
dotenv.config({ path: '.env.local' });

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
  migrations: {
    prefix: 'supabase',
  },
});