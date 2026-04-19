import { createApp } from './app';
import { prisma } from './infrastructure/database/prisma.client';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

async function main() {
  const app = createApp();

  const server = app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV ?? 'development'}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received — shutting down gracefully`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('Database connection closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});
