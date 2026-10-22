export class AppError extends Error {
  constructor(code, message, status = 400, details) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function errorBody(error) {
  const known = error instanceof AppError;
  return {
    code: known ? error.code : 'INTERNAL_ERROR',
    message: known ? error.message : 'Внутренняя ошибка сервера. Попробуйте ещё раз.',
    ...(known && error.details ? { details: error.details } : {}),
  };
}
