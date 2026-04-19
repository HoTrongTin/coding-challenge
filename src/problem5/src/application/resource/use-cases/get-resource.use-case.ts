import { IResourceRepository } from '../../../domain/resource/resource.repository';
import { ResourceNotFoundError } from '../../../domain/resource/resource.errors';
import { ResourceResponseDto } from '../dtos/resource.response.dto';
import { toResourceResponseDto } from '../mappers/resource.mapper';

export class GetResourceUseCase {
  constructor(private readonly repository: IResourceRepository) {}

  async execute(id: string): Promise<ResourceResponseDto> {
    const resource = await this.repository.findById(id);

    if (!resource) {
      throw new ResourceNotFoundError(id);
    }

    return toResourceResponseDto(resource);
  }
}
