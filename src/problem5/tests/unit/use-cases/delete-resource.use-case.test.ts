import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteResourceUseCase } from '../../../src/application/resource/use-cases/delete-resource.use-case';
import { IResourceRepository } from '../../../src/domain/resource/resource.repository';
import { ResourceEntity, ResourceStatus } from '../../../src/domain/resource/resource.entity';
import { ResourceNotFoundError } from '../../../src/domain/resource/resource.errors';

const makeEntity = (): ResourceEntity =>
  ({
    id: 'uuid-1',
    name: 'Server A',
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

describe('DeleteResourceUseCase', () => {
  let repo: IResourceRepository;
  let useCase: DeleteResourceUseCase;

  beforeEach(() => {
    repo = mockRepo();
    useCase = new DeleteResourceUseCase(repo);
  });

  it('calls softDelete when resource exists', async () => {
    vi.mocked(repo.findById).mockResolvedValue(makeEntity());
    vi.mocked(repo.softDelete).mockResolvedValue();

    await useCase.execute('uuid-1');

    expect(repo.softDelete).toHaveBeenCalledWith('uuid-1');
  });

  it('throws ResourceNotFoundError when resource does not exist', async () => {
    vi.mocked(repo.findById).mockResolvedValue(null);

    await expect(useCase.execute('missing-id')).rejects.toThrow(ResourceNotFoundError);
    expect(repo.softDelete).not.toHaveBeenCalled();
  });
});
