export enum ResourceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface ResourceEntity {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: ResourceStatus;
  quantity: number;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
