import { IResourceRepository } from '../../../domain/resource/resource.repository';
import { ListResourcesDto } from '../dtos/resource.schema';
import { ResourceResponseDto } from '../dtos/resource.response.dto';
import { toResourceResponseDto } from '../mappers/resource.mapper';

export interface ListResourcesResult {
  data: ResourceResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListResourcesUseCase {
  constructor(private readonly repository: IResourceRepository) {}

  async execute(dto: ListResourcesDto): Promise<ListResourcesResult> {
    const page = Math.max(dto.page ?? 1, 1);
    const limit = Math.min(Math.max(dto.limit ?? 10, 1), 100);

    const result = await this.repository.findAll({
      search: dto.search,
      type: dto.type,
      status: dto.status,
      page,
      limit,
    });

    return {
      data: result.data.map(toResourceResponseDto),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
