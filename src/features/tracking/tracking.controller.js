const catchAsync = require("../../utils/catch-async");
const { ok } = require("../../utils/api-response");
const { numero, palavra } = require("../../utils/formato");
const trackingService = require("./tracking.service");

// POST /api/v1/events — recebe um lote de eventos do front.
const ingest = catchAsync(async (req, res) => {
  const result = await trackingService.ingest(req.body);
  const n = result.accepted;
  const mensagem = `Recebemos e guardamos ${numero(n)} ${palavra(n, "evento", "eventos")} desta visita.`;
  return ok(res, result, 202, mensagem);
});

module.exports = { ingest };
