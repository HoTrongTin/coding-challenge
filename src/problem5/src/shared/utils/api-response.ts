export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export function successResponse<T>(
  data: T,
  message?: string,
  meta?: Record<string, unknown>,
): ApiResponse<T> {
  return { success: true, data, message, meta };
}

export function errorResponse(message: string): ApiResponse<null> {
  return { success: false, data: null, message };
}
