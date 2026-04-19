import 'dotenv/config';
import { execSync } from 'child_process';

export default function setup() {
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL environment variable is required in .env');
  }

  const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

  console.log('⏳ Setting up test database...');

  // Push the Prisma schema to the test database (creates it if it doesn't exist)
  // --accept-data-loss ensures it resets data if the schema changed
  execSync('npx prisma db push --accept-data-loss --skip-generate', {
    env: {
      ...process.env,
      DATABASE_URL: TEST_DATABASE_URL,
    },
    stdio: 'ignore',
  });

  console.log('✅ Test database ready.');
}
