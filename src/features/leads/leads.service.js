const { Lead } = require("../../models");
const AppError = require("../../utils/app-error");

const CAMPOS = ["visitorId", "sessionId", "nome", "email", "whatsapp", "tipo", "mensagem", "path"];

function limpar(str, max) {
  if (str == null) return null;
  return String(str).trim().slice(0, max) || null;
}

// Guarda exatamente o que a pessoa escreveu no formulário.
async function criar(payload) {
  const body = payload || {};

  const nome = limpar(body.nome, 200);
  const email = limpar(body.email, 200);
  const whatsapp = limpar(body.whatsapp, 60);
  const mensagem = limpar(body.mensagem, 5000);

  // Pelo menos um jeito de responder a pessoa precisa vir preenchido.
  if (!email && !whatsapp && !nome) {
    throw new AppError("Preencha ao menos nome, e-mail ou WhatsApp.", 422, "contato_incompleto");
  }

  // Qualquer campo extra do formulário fica em `meta`, sem perder nada.
  const meta = {};
  Object.keys(body).forEach((k) => {
    if (!CAMPOS.includes(k)) meta[k] = body[k];
  });

  const lead = await Lead.create({
    visitorId: limpar(body.visitorId, 120),
    sessionId: limpar(body.sessionId, 120),
    nome,
    email,
    whatsapp,
    tipo: limpar(body.tipo, 120),
    mensagem,
    path: limpar(body.path, 300),
    meta: Object.keys(meta).length ? meta : null,
  });

  return { id: String(lead.id) };
}

// Lista as mensagens mais recentes para a página de Clientes.
async function listar({ limit = 100 } = {}) {
  const rows = await Lead.findAll({
    order: [["created_at", "DESC"]],
    limit: Math.min(Number(limit) || 100, 500),
    raw: true,
  });

  // findAll({raw:true}) devolve os nomes de ATRIBUTO (camelCase), não as colunas.
  return rows.map((r) => ({
    id: String(r.id),
    nome: r.nome,
    email: r.email,
    whatsapp: r.whatsapp,
    tipo: r.tipo,
    mensagem: r.mensagem,
    path: r.path,
    criadoEm: r.createdAt,
    visitante: r.visitorId ? String(r.visitorId).slice(0, 8) : null,
  }));
}

module.exports = { criar, listar };
