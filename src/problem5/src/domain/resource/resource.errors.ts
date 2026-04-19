import { NotFoundError } from '../../shared/errors/app.errors';

export class ResourceNotFoundError extends NotFoundError {
  constructor(id: string) {
    super(`Resource with id "${id}" not found`);
    this.name = 'ResourceNotFoundError';
  }
}
