const AppError = require("../utils/app-error");

// Rota não encontrada → 404 com mensagem amigável.
module.exports = function notFound(req, res, next) {
  next(
    new AppError(
      `Não encontrei nada em "${req.method} ${req.originalUrl}". Confira o endereço.`,
      404,
      "nao_encontrado"
    )
  );
};
