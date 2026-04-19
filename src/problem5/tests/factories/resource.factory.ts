import { PrismaClient, Prisma, Status } from '@prisma/client';
import { faker } from '@faker-js/faker';

export class ResourceFactory {
  static async create(
    prisma: PrismaClient,
    overrides: Partial<Prisma.ResourceCreateInput> = {},
  ) {
    return prisma.resource.create({
      data: {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        type: faker.helpers.arrayElement(['compute', 'storage', 'network', 'database']),
        status: faker.helpers.arrayElement([Status.ACTIVE, Status.INACTIVE]),
        quantity: faker.number.int({ min: 1, max: 100 }),
        metadata: { manufacturer: faker.company.name() },
        ...overrides,
      },
    });
  }

  static async createMany(
    prisma: PrismaClient,
    count: number,
    overrides: Partial<Prisma.ResourceCreateInput> = {},
  ) {
    const promises = Array.from({ length: count }).map(() =>
      this.create(prisma, overrides),
    );
    return Promise.all(promises);
  }
}
