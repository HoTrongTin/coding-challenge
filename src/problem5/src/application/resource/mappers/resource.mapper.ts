import { ResourceEntity } from '../../../domain/resource/resource.entity';
import { ResourceResponseDto } from '../dtos/resource.response.dto';

export function toResourceResponseDto(entity: ResourceEntity): ResourceResponseDto {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description,
    type: entity.type,
    status: entity.status,
    quantity: entity.quantity,
    metadata: entity.metadata,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
