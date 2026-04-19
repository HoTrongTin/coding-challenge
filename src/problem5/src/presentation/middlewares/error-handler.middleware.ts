import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/errors/app.errors';
import { errorResponse } from '../../shared/utils/api-response';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.message));
    return;
  }

  console.error('[Unhandled Error]', err);
  res.status(500).json(errorResponse('Internal server error'));
};
