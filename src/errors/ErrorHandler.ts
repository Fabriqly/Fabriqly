import { AppError } from './AppError';

export class ErrorHandler {
  static handle(error: unknown): AppError {
    // If it's already an AppError, return it
    if (error instanceof AppError) {
      return error;
    }

    // Handle Firebase errors
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as any;
      
      switch (firebaseError.code) {
        case 'permission-denied':
          return AppError.forbidden('Permission denied');
        case 'not-found':
          return AppError.notFound('Resource not found');
        case 'already-exists':
          return AppError.conflict('Resource already exists');
        case 'invalid-argument':
          return AppError.badRequest('Invalid argument provided');
        case 'unauthenticated':
          return AppError.unauthorized('Authentication required');
        default:
          return AppError.internal(`Firebase error: ${firebaseError.message}`);
      }
    }

    // Handle standard Error objects
    if (error instanceof Error) {
      return AppError.internal(error.message);
    }

    // Handle unknown errors
    return AppError.internal('Unknown error occurred');
  }

  static async handleAsync<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const appError = this.handle(error);
      
      // Log error with context
      console.error(`Error in ${context || 'operation'}:`, {
        message: appError.message,
        code: appError.code,
        statusCode: appError.statusCode,
        details: appError.details,
        stack: appError.stack
      });

      throw appError;
    }
  }
}
