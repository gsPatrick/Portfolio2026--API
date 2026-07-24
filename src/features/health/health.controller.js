const catchAsync = require("../../utils/catch-async");
const { ok } = require("../../utils/api-response");
const { sequelize } = require("../../models");

// GET /api/v1/ping — checa app + conexão com o banco.
const ping = catchAsync(async (req, res) => {
  let db = "conectado";
  let mensagem = "A API está no ar e conversando com o banco de dados normalmente.";
  try {
    await sequelize.authenticate();
  } catch (err) {
    db = "sem conexão";
    mensagem = "A API está no ar, mas não consegui falar com o banco de dados agora.";
  }

  return ok(
    res,
    { status: "ok", banco: db, tempoNoArSeg: Math.round(process.uptime()) },
    200,
    mensagem
  );
});

module.exports = { ping };
