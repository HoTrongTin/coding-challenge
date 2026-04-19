import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateResourceUseCase } from '../../../src/application/resource/use-cases/update-resource.use-case';
import { IResourceRepository } from '../../../src/domain/resource/resource.repository';
import { ResourceEntity, ResourceStatus } from '../../../src/domain/resource/resource.entity';
import { ResourceNotFoundError } from '../../../src/domain/resource/resource.errors';

const makeEntity = (overrides = {}): ResourceEntity =>
  ({
    id: 'uuid-1',
    name: 'Original Name',
    description: null,
    type: 'storage',
    status: ResourceStatus.ACTIVE,
    quantity: 2,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  });

const mockRepo = (): IResourceRepository => ({
  create: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
});

describe('UpdateResourceUseCase', () => {
  let repo: IResourceRepository;
  let useCase: UpdateResourceUseCase;

  beforeEach(() => {
    repo = mockRepo();
    useCase = new UpdateResourceUseCase(repo);
  });

  it('updates and returns the updated resource', async () => {
    vi.mocked(repo.findById).mockResolvedValue(makeEntity());
    vi.mocked(repo.update).mockResolvedValue(makeEntity({ name: 'Updated Name' }));

    const result = await useCase.execute('uuid-1', { name: 'Updated Name' });

    expect(result.name).toBe('Updated Name');
    expect(repo.update).toHaveBeenCalledWith('uuid-1', { name: 'Updated Name' });
  });

  it('throws ResourceNotFoundError when resource does not exist', async () => {
    vi.mocked(repo.findById).mockResolvedValue(null);

    await expect(useCase.execute('missing-id', { name: 'X' })).rejects.toThrow(
      ResourceNotFoundError,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });
});
