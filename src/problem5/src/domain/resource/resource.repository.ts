import { ResourceEntity, ResourceStatus } from './resource.entity';
import { PaginatedResult } from '../../shared/utils/api-response';

export { PaginatedResult };

export interface CreateResourceData {
  name: string;
  description?: string | null;
  type: string;
  status?: ResourceStatus;
  quantity?: number;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateResourceData {
  name?: string;
  description?: string | null;
  type?: string;
  status?: ResourceStatus;
  quantity?: number;
  metadata?: Record<string, unknown> | null;
}

export interface ResourceFilters {
  search?: string;
  type?: string;
  status?: ResourceStatus;
  page: number;
  limit: number;
}


export interface IResourceRepository {
  create(data: CreateResourceData): Promise<ResourceEntity>;
  findAll(filters: ResourceFilters): Promise<PaginatedResult<ResourceEntity>>;
  findById(id: string): Promise<ResourceEntity | null>;
  update(id: string, data: UpdateResourceData): Promise<ResourceEntity>;
  softDelete(id: string): Promise<void>;
}
