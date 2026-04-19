import { IResourceRepository } from '../../../domain/resource/resource.repository';
import { CreateResourceDto } from '../dtos/resource.schema';
import { ResourceResponseDto } from '../dtos/resource.response.dto';
import { toResourceResponseDto } from '../mappers/resource.mapper';

export class CreateResourceUseCase {
  constructor(private readonly repository: IResourceRepository) {}

  async execute(dto: CreateResourceDto): Promise<ResourceResponseDto> {
    const resource = await this.repository.create({
      name: dto.name,
      description: dto.description ?? null,
      type: dto.type,
      status: dto.status,
      quantity: dto.quantity ?? 0,
      metadata: dto.metadata ?? null,
    });

    return toResourceResponseDto(resource);
  }
}
