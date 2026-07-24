const catchAsync = require("../../utils/catch-async");
const { ok } = require("../../utils/api-response");
const { numero, duracao, porcentagem, palavra } = require("../../utils/formato");
const analyticsService = require("./analytics.service");

// GET /api/v1/analytics/summary?days=30
const summary = catchAsync(async (req, res) => {
  const d = await analyticsService.summary({ days: req.query.days });
  let mensagem;
  if (d.visitors === 0) {
    mensagem = `Ainda não há visitas registradas nos últimos ${d.rangeDays} dias. Assim que alguém acessar sua página, os números aparecem aqui.`;
  } else {
    mensagem =
      `Nos últimos ${d.rangeDays} dias, ${numero(d.visitors)} ${palavra(d.visitors, "pessoa visitou", "pessoas visitaram")} sua página ` +
      `em ${numero(d.sessions)} ${palavra(d.sessions, "visita", "visitas")}. ` +
      `${numero(d.formSubmits)} ${palavra(d.formSubmits, "enviou", "enviaram")} o formulário — ` +
      `uma taxa de conversão de ${porcentagem(d.conversionRate)}.`;
  }
  return ok(res, d, 200, mensagem);
});

// GET /api/v1/analytics/sections?days=30
const sections = catchAsync(async (req, res) => {
  const lista = await analyticsService.sections({ days: req.query.days });
  let mensagem;
  if (lista.length === 0) {
    mensagem = "Ainda não temos tempo de leitura por seção. Isso aparece conforme as pessoas navegam pela página.";
  } else {
    const top = lista[0];
    mensagem = `A seção onde as pessoas mais param é "${top.section}", com ${duracao(top.avgDwellMs)} em média por visita.`;
  }
  return ok(res, lista, 200, mensagem);
});

// GET /api/v1/analytics/clicks?days=30&limit=20
const clicks = catchAsync(async (req, res) => {
  const lista = await analyticsService.clicks({ days: req.query.days, limit: req.query.limit });
  let mensagem;
  if (lista.length === 0) {
    mensagem = "Ainda não registramos cliques. Assim que as pessoas interagirem, os botões mais clicados aparecem aqui.";
  } else {
    const top = lista[0];
    mensagem = `O elemento mais clicado é "${top.label}", com ${numero(top.count)} ${palavra(top.count, "clique", "cliques")}.`;
  }
  return ok(res, lista, 200, mensagem);
});

// GET /api/v1/analytics/daily?days=30
const daily = catchAsync(async (req, res) => {
  const lista = await analyticsService.daily({ days: req.query.days });
  const totalVisitas = lista.reduce((soma, d) => soma + d.visitas, 0);
  const mensagem =
    totalVisitas === 0
      ? `Sem visitas registradas nos últimos ${lista.length} dias.`
      : `${numero(totalVisitas)} ${palavra(totalVisitas, "visita", "visitas")} distribuídas nos últimos ${lista.length} dias.`;
  return ok(res, lista, 200, mensagem);
});

// GET /api/v1/analytics/sources?days=30
const sources = catchAsync(async (req, res) => {
  const lista = await analyticsService.sources({ days: req.query.days });
  let mensagem;
  if (lista.length === 0) {
    mensagem = "Ainda não dá para saber a origem das visitas. Isso aparece conforme as pessoas chegam ao site.";
  } else {
    const top = lista[0];
    mensagem = `A maior parte das visitas veio de "${top.fonte}" (${numero(top.sessoes)} ${palavra(top.sessoes, "visita", "visitas")}, ${porcentagem(top.taxaConversao)} de conversão).`;
  }
  return ok(res, lista, 200, mensagem);
});

// GET /api/v1/analytics/devices?days=30
const devices = catchAsync(async (req, res) => {
  const lista = await analyticsService.devices({ days: req.query.days });
  let mensagem;
  if (lista.length === 0) {
    mensagem = "Ainda não temos dados de dispositivo.";
  } else {
    const top = lista[0];
    mensagem = `A maioria acessa por ${top.dispositivo} (${numero(top.sessoes)} ${palavra(top.sessoes, "visita", "visitas")}).`;
  }
  return ok(res, lista, 200, mensagem);
});

// GET /api/v1/analytics/export?days=90 — dump completo para análise.
const exportar = catchAsync(async (req, res) => {
  const data = await analyticsService.exportar({ days: req.query.days });
  return ok(res, data, 200, "Exportação completa pronta. Baixe e envie este arquivo para análise da página.");
});

// GET /api/v1/analytics/sessions?limit=30
const sessions = catchAsync(async (req, res) => {
  const lista = await analyticsService.sessions({ limit: req.query.limit });
  const convertidas = lista.filter((s) => s.converted).length;
  let mensagem;
  if (lista.length === 0) {
    mensagem = "Nenhuma visita ainda. Esta lista mostra as visitas mais recentes assim que elas acontecerem.";
  } else {
    mensagem =
      `Mostrando as ${numero(lista.length)} ${palavra(lista.length, "visita mais recente", "visitas mais recentes")}. ` +
      `${convertidas} ${palavra(convertidas, "delas terminou", "delas terminaram")} enviando o formulário.`;
  }
  return ok(res, lista, 200, mensagem);
});

module.exports = { summary, sections, clicks, sessions, daily, sources, devices, exportar };
