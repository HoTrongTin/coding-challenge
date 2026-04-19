import { IResourceRepository } from '../../../domain/resource/resource.repository';
import { ResourceNotFoundError } from '../../../domain/resource/resource.errors';
import { UpdateResourceDto } from '../dtos/resource.schema';
import { ResourceResponseDto } from '../dtos/resource.response.dto';
import { toResourceResponseDto } from '../mappers/resource.mapper';

export class UpdateResourceUseCase {
  constructor(private readonly repository: IResourceRepository) {}

  async execute(id: string, dto: UpdateResourceDto): Promise<ResourceResponseDto> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw new ResourceNotFoundError(id);
    }

    const updated = await this.repository.update(id, dto);

    return toResourceResponseDto(updated);
  }
}
