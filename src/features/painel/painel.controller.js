const path = require("path");
const catchAsync = require("../../utils/catch-async");
const { ok } = require("../../utils/api-response");
const painelService = require("./painel.service");

// GET /api/v1/painel?days=30 — dados prontos para o painel desenhar.
const dados = catchAsync(async (req, res) => {
  const data = await painelService.montar({ days: req.query.days });
  return ok(res, data, 200, data.mensagemTopo);
});

// GET /painel — a tela (HTML) do painel.
const pagina = (req, res) => {
  res.sendFile(path.join(__dirname, "painel.html"));
};

// GET /clientes — a tela (HTML) das mensagens recebidas.
const paginaClientes = (req, res) => {
  res.sendFile(path.join(__dirname, "clientes.html"));
};

module.exports = { dados, pagina, paginaClientes };
