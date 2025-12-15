import { ApiSuccessResponse, ApiErrorResponse, PaginationMeta } from '@/types/ApiResponse';
import { AppError } from '@/errors/AppError';

export class ResponseBuilder {
  static success<T>(
    data: T, 
    meta?: { 
      pagination?: PaginationMeta; 
      requestId?: string;
    }
  ): ApiSuccessResponse<T> {
    return {
      success: true,
      data,
      meta: {
        ...meta,
        timestamp: new Date().toISOString()
      }
    };
  }

  static error(
    error: AppError | Error | string,
    requestId?: string
  ): ApiErrorResponse {
    let code: string;
    let message: string;
    let details: unknown;

    if (error instanceof AppError) {
      code = error.code;
      message = error.message;
      details = error.details;
    } else if (error instanceof Error) {
      code = 'INTERNAL_ERROR';
      message = error.message;
    } else {
      code = 'INTERNAL_ERROR';
      message = error;
    }

    return {
      success: false,
      error: { code, message, details },
      meta: {
        timestamp: new Date().toISOString(),
        ...(requestId && { requestId })
      }
    };
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    requestId?: string
  ): ApiSuccessResponse<T[]> {
    const totalPages = Math.ceil(total / limit);
    
    const pagination: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    return this.success(data, { pagination, requestId });
  }

  static created<T>(data: T, requestId?: string): ApiSuccessResponse<T> {
    return this.success(data, { requestId });
  }

  static noContent(requestId?: string): ApiSuccessResponse<null> {
    return this.success(null, { requestId });
  }
}

