const catchAsync = require("../../utils/catch-async");
const { ok } = require("../../utils/api-response");
const { numero, palavra } = require("../../utils/formato");
const leadsService = require("./leads.service");

// POST /api/v1/leads — recebe o que a pessoa escreveu no formulário.
const criar = catchAsync(async (req, res) => {
  const result = await leadsService.criar(req.body);
  return ok(res, result, 201, "Mensagem recebida e guardada. Você já pode vê-la na página de Clientes.");
});

// GET /api/v1/leads — lista as mensagens (para a página de Clientes).
const listar = catchAsync(async (req, res) => {
  const lista = await leadsService.listar({ limit: req.query.limit });
  const mensagem =
    lista.length === 0
      ? "Ainda não chegou nenhuma mensagem pelo formulário. Assim que alguém enviar, aparece aqui."
      : `Você tem ${numero(lista.length)} ${palavra(lista.length, "mensagem", "mensagens")} de contato.`;
  return ok(res, lista, 200, mensagem);
});

module.exports = { criar, listar };
