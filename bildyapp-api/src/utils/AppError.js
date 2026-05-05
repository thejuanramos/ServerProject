class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg) {
    return new AppError(msg || 'Bad Request', 400);
  }

  static unauthorized(msg) {
    return new AppError(msg || 'Unauthorized', 401);
  }

  static forbidden(msg) {
    return new AppError(msg || 'Forbidden', 403);
  }

  static notFound(msg) {
    return new AppError(msg || 'Not Found', 404);
  }

  static conflict(msg) {
    return new AppError(msg || 'Conflict', 409);
  }

  static internal(msg) {
    return new AppError(msg || 'Internal Server Error', 500);
  }
}

export default AppError;