import { PrismaClient, Prisma, Status } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.resource.createMany({
    data: [
      {
        name: 'Server Node Alpha',
        description: 'Primary compute node for cluster A',
        type: 'compute',
        status: Status.ACTIVE,
        quantity: 5,
        metadata: { region: 'us-east-1', tier: 'premium' },
      },
      {
        name: 'Storage Block Beta',
        description: '2TB SSD storage block',
        type: 'storage',
        status: Status.ACTIVE,
        quantity: 10,
        metadata: { capacity: '2TB', format: 'SSD' },
      },
      {
        name: 'Network Switch Gamma',
        description: 'Managed 48-port gigabit switch',
        type: 'network',
        status: Status.INACTIVE,
        quantity: 2,
        metadata: Prisma.JsonNull,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
