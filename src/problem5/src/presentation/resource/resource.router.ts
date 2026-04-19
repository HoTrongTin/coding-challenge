import { Router } from 'express';
import { prisma } from '../../infrastructure/database/prisma.client';
import { PrismaResourceRepository } from '../../infrastructure/repositories/prisma-resource.repository';
import { CreateResourceUseCase } from '../../application/resource/use-cases/create-resource.use-case';
import { ListResourcesUseCase } from '../../application/resource/use-cases/list-resources.use-case';
import { GetResourceUseCase } from '../../application/resource/use-cases/get-resource.use-case';
import { UpdateResourceUseCase } from '../../application/resource/use-cases/update-resource.use-case';
import { DeleteResourceUseCase } from '../../application/resource/use-cases/delete-resource.use-case';
import { ResourceController } from './resource.controller';
import { validate } from '../middlewares/validate.middleware';
import {
  createResourceSchema,
  updateWithIdSchema,
  listResourcesSchema,
  resourceIdSchema,
} from '../../application/resource/dtos/resource.schema';

// ── Dependency Injection ────────────────────────────────────────────────────
const repository = new PrismaResourceRepository(prisma);

const controller = new ResourceController(
  new CreateResourceUseCase(repository),
  new ListResourcesUseCase(repository),
  new GetResourceUseCase(repository),
  new UpdateResourceUseCase(repository),
  new DeleteResourceUseCase(repository),
);

// ── Routes ──────────────────────────────────────────────────────────────────
const router = Router();

router.post('/', validate(createResourceSchema), controller.create);
router.get('/', validate(listResourcesSchema), controller.list);
router.get('/:id', validate(resourceIdSchema), controller.getById);
router.put('/:id', validate(updateWithIdSchema), controller.update);
router.delete('/:id', validate(resourceIdSchema), controller.delete);

export default router;
