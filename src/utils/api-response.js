// Resposta HTTP padronizada, com uma "mensagem" em português amigável.
function ok(res, data = null, status = 200, mensagem = "Tudo certo.") {
  return res.status(status).json({ ok: true, mensagem, data });
}

function fail(res, mensagem, status = 400, code = "bad_request") {
  return res.status(status).json({ ok: false, mensagem, error: { message: mensagem, code } });
}

module.exports = { ok, fail };
