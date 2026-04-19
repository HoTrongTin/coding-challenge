import { z } from 'zod';
import { ResourceStatus } from '../../../domain/resource/resource.entity';

export const createResourceSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(255),
    description: z.string().max(1000).nullable().optional(),
    type: z.string().min(1, 'Type is required').max(100),
    status: z.nativeEnum(ResourceStatus).optional(),
    quantity: z.number().int().min(0).optional(),
    metadata: z.record(z.unknown()).nullable().optional(),
  }),
});

export type CreateResourceDto = z.infer<typeof createResourceSchema>['body'];

export const updateResourceSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).nullable().optional(),
    type: z.string().min(1).max(100).optional(),
    status: z.nativeEnum(ResourceStatus).optional(),
    quantity: z.number().int().min(0).optional(),
    metadata: z.record(z.unknown()).nullable().optional(),
  }),
});

export type UpdateResourceDto = z.infer<typeof updateResourceSchema>['body'];

export const listResourcesSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    type: z.string().optional(),
    status: z.nativeEnum(ResourceStatus).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export type ListResourcesDto = z.infer<typeof listResourcesSchema>['query'];

export const resourceIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid resource ID — must be a valid UUID'),
  }),
});

export const updateWithIdSchema = resourceIdSchema.merge(updateResourceSchema);
