import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListResourcesUseCase } from '../../../src/application/resource/use-cases/list-resources.use-case';
import { IResourceRepository } from '../../../src/domain/resource/resource.repository';
import { ResourceEntity, ResourceStatus } from '../../../src/domain/resource/resource.entity';

const makeEntity = (id: string): ResourceEntity =>
  ({
    id,
    name: `Resource ${id}`,
    description: null,
    type: 'compute',
    status: ResourceStatus.ACTIVE,
    quantity: 1,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });

const mockRepo = (): IResourceRepository => ({
  create: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
});

describe('ListResourcesUseCase', () => {
  let repo: IResourceRepository;
  let useCase: ListResourcesUseCase;

  beforeEach(() => {
    repo = mockRepo();
    useCase = new ListResourcesUseCase(repo);
  });

  it('returns paginated resource list', async () => {
    vi.mocked(repo.findAll).mockResolvedValue({
      data: [makeEntity('1'), makeEntity('2')],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const result = await useCase.execute({});

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('applies default page=1 and limit=10', async () => {
    vi.mocked(repo.findAll).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });

    await useCase.execute({});

    expect(repo.findAll).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 10 }));
  });

  it('clamps limit to 100 maximum', async () => {
    vi.mocked(repo.findAll).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 100,
      totalPages: 0,
    });

    await useCase.execute({ limit: 999 });

    expect(repo.findAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }));
  });
});
