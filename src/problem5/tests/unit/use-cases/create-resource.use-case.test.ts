import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateResourceUseCase } from '../../../src/application/resource/use-cases/create-resource.use-case';
import { IResourceRepository } from '../../../src/domain/resource/resource.repository';
import { ResourceEntity, ResourceStatus } from '../../../src/domain/resource/resource.entity';

const makeEntity = (): ResourceEntity =>
  ({
    id: 'uuid-1',
    name: 'Server A',
    description: null,
    type: 'compute',
    status: ResourceStatus.ACTIVE,
    quantity: 1,
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

describe('CreateResourceUseCase', () => {
  let repo: IResourceRepository;
  let useCase: CreateResourceUseCase;

  beforeEach(() => {
    repo = mockRepo();
    useCase = new CreateResourceUseCase(repo);
  });

  it('calls repository.create with correct data', async () => {
    vi.mocked(repo.create).mockResolvedValue(makeEntity());

    await useCase.execute({ name: 'Server A', type: 'compute' });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Server A', type: 'compute' }),
    );
  });

  it('returns a resource response DTO', async () => {
    vi.mocked(repo.create).mockResolvedValue(makeEntity());

    const result = await useCase.execute({ name: 'Server A', type: 'compute' });

    expect(result).toMatchObject({ id: 'uuid-1', name: 'Server A', type: 'compute' });
    expect(typeof result.createdAt).toBe('string');
  });

  it('defaults quantity to 0 when not provided', async () => {
    vi.mocked(repo.create).mockResolvedValue(makeEntity());

    await useCase.execute({ name: 'Server A', type: 'compute' });

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ quantity: 0 }));
  });
});
