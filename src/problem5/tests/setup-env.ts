import 'dotenv/config';

// This runs before any test files are imported, ensuring env vars are set early
if (!process.env.TEST_DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL environment variable is required');
}

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
