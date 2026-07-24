// Erro de aplicação com statusCode e code estáveis para o cliente.
class AppError extends Error {
  constructor(message, statusCode = 500, code = "internal_error") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
