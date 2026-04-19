import { ResourceStatus } from '../../../domain/resource/resource.entity';

export interface ResourceResponseDto {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: ResourceStatus;
  quantity: number;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
