import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { errorResponse } from '../../shared/utils/api-response';

export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors
          .map((e) => `${e.path.slice(1).join('.')}: ${e.message}`)
          .join('; ');
        res.status(400).json(errorResponse(`Validation failed: ${messages}`));
        return;
      }
      next(error);
    }
  };
