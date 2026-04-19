import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetResourceUseCase } from '../../../src/application/resource/use-cases/get-resource.use-case';
import { IResourceRepository } from '../../../src/domain/resource/resource.repository';
import { ResourceEntity, ResourceStatus } from '../../../src/domain/resource/resource.entity';
import { ResourceNotFoundError } from '../../../src/domain/resource/resource.errors';

const makeEntity = (): ResourceEntity =>
  ({
    id: 'uuid-1',
    name: 'Server A',
    description: 'A compute node',
    type: 'compute',
    status: ResourceStatus.ACTIVE,
    quantity: 3,
    metadata: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
  });

const mockRepo = (): IResourceRepository => ({
  create: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
});

describe('GetResourceUseCase', () => {
  let repo: IResourceRepository;
  let useCase: GetResourceUseCase;

  beforeEach(() => {
    repo = mockRepo();
    useCase = new GetResourceUseCase(repo);
  });

  it('returns the resource DTO when found', async () => {
    vi.mocked(repo.findById).mockResolvedValue(makeEntity());

    const result = await useCase.execute('uuid-1');

    expect(result.id).toBe('uuid-1');
    expect(result.name).toBe('Server A');
  });

  it('throws ResourceNotFoundError when resource does not exist', async () => {
    vi.mocked(repo.findById).mockResolvedValue(null);

    await expect(useCase.execute('missing-id')).rejects.toThrow(ResourceNotFoundError);
  });

  it('calls repository with the correct id', async () => {
    vi.mocked(repo.findById).mockResolvedValue(makeEntity());

    await useCase.execute('uuid-1');

    expect(repo.findById).toHaveBeenCalledWith('uuid-1');
  });
});
