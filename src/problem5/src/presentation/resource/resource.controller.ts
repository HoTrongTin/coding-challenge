import { Request, Response, NextFunction } from 'express';
import { CreateResourceUseCase } from '../../application/resource/use-cases/create-resource.use-case';
import { ListResourcesUseCase } from '../../application/resource/use-cases/list-resources.use-case';
import { GetResourceUseCase } from '../../application/resource/use-cases/get-resource.use-case';
import { UpdateResourceUseCase } from '../../application/resource/use-cases/update-resource.use-case';
import { DeleteResourceUseCase } from '../../application/resource/use-cases/delete-resource.use-case';
import { ListResourcesDto } from '../../application/resource/dtos/resource.schema';
import { successResponse } from '../../shared/utils/api-response';

export class ResourceController {
  constructor(
    private readonly createUseCase: CreateResourceUseCase,
    private readonly listUseCase: ListResourcesUseCase,
    private readonly getUseCase: GetResourceUseCase,
    private readonly updateUseCase: UpdateResourceUseCase,
    private readonly deleteUseCase: DeleteResourceUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resource = await this.createUseCase.execute(req.body);
      res.status(201).json(successResponse(resource, 'Resource created successfully'));
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as ListResourcesDto;
      const result = await this.listUseCase.execute(query);
      res.json(
        successResponse(result.data, 'Resources fetched successfully', {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        }),
      );
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resource = await this.getUseCase.execute(req.params['id'] as string);
      res.json(successResponse(resource, 'Resource fetched successfully'));
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resource = await this.updateUseCase.execute(req.params['id'] as string, req.body);
      res.json(successResponse(resource, 'Resource updated successfully'));
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.deleteUseCase.execute(req.params['id'] as string);
      res.json(successResponse(null, 'Resource deleted successfully'));
    } catch (error) {
      next(error);
    }
  };
}
