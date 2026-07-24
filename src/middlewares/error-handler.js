const env = require("../config/env");

// Middleware de erro único. Converte qualquer erro numa resposta clara em português.
module.exports = function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || "erro_interno";

  // Erros "operacionais" (que a gente lançou de propósito) já têm mensagem amigável.
  // Erros inesperados viram uma mensagem tranquila, sem detalhes técnicos.
  const mensagem = err.isOperational
    ? err.message
    : "Algo deu errado do nosso lado. Já estamos de olho — tente de novo em instantes.";

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error("[erro]", err);
  }

  const body = { ok: false, mensagem, error: { message: mensagem, code } };
  if (env.nodeEnv !== "production" && !err.isOperational) {
    body.error.stack = err.stack;
  }

  res.status(statusCode).json(body);
};
