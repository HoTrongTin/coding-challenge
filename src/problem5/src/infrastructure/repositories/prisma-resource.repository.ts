import { PrismaClient, Resource, Status, Prisma } from '@prisma/client';
import {
  IResourceRepository,
  CreateResourceData,
  UpdateResourceData,
  ResourceFilters,
  PaginatedResult,
} from '../../domain/resource/resource.repository';
import { ResourceEntity, ResourceStatus } from '../../domain/resource/resource.entity';

export class PrismaResourceRepository implements IResourceRepository {
  constructor(private readonly prisma: PrismaClient) { }

  private toEntity(record: Resource): ResourceEntity {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      type: record.type,
      status: record.status as ResourceStatus,
      quantity: record.quantity,
      metadata: record.metadata as Record<string, unknown> | null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
    };
  }

  async create(data: CreateResourceData): Promise<ResourceEntity> {
    const record = await this.prisma.resource.create({
      data: {
        ...data,
        status: data.status as Status | undefined,
        quantity: data.quantity ?? 0,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
      },
    });

    return this.toEntity(record);
  }

  async findAll(filters: ResourceFilters): Promise<PaginatedResult<ResourceEntity>> {
    const { search, type, status, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ResourceWhereInput = {
      deletedAt: null,
      type: type,
      status: status as Status | undefined,
      OR: search
        ? [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    };

    const [records, total] = await this.prisma.$transaction([
      this.prisma.resource.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.resource.count({ where }),
    ]);

    return {
      data: records.map(this.toEntity.bind(this)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<ResourceEntity | null> {
    const record = await this.prisma.resource.findFirst({
      where: { id, deletedAt: null },
    });

    return record ? this.toEntity(record) : null;
  }

  async update(id: string, data: UpdateResourceData): Promise<ResourceEntity> {
    const record = await this.prisma.resource.update({
      where: { id },
      data: {
        ...data,
        status: data.status as Status | undefined,
        metadata:
          data.metadata === null
            ? Prisma.JsonNull
            : (data.metadata as Prisma.InputJsonValue | undefined),
      },
    });

    return this.toEntity(record);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.resource.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
