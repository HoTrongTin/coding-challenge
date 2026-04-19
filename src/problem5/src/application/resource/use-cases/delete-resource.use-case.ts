import { IResourceRepository } from '../../../domain/resource/resource.repository';
import { ResourceNotFoundError } from '../../../domain/resource/resource.errors';

export class DeleteResourceUseCase {
  constructor(private readonly repository: IResourceRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new ResourceNotFoundError(id);
    }

    await this.repository.softDelete(id);
  }
}
