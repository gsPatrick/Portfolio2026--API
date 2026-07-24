const { fn, col, literal, Op } = require("sequelize");
const { sequelize, Event } = require("../../models");

// Converte "?days=30" em um timestamp (ms) de corte.
function sinceTs(days) {
  const n = Number(days) || 30;
  return Date.now() - n * 24 * 60 * 60 * 1000;
}

// Visão geral: totais de visitantes, sessões, eventos e conversões.
async function summary({ days = 30 } = {}) {
  const since = sinceTs(days);

  const [visitors, sessions, events, formStarts, formSubmits] = await Promise.all([
    Event.aggregate("visitor_id", "COUNT", { distinct: true, where: { ts: { [Op.gte]: since } } }),
    Event.aggregate("session_id", "COUNT", { distinct: true, where: { ts: { [Op.gte]: since } } }),
    Event.count({ where: { ts: { [Op.gte]: since } } }),
    Event.count({ where: { type: "form_start", ts: { [Op.gte]: since } } }),
    Event.count({ where: { type: "form_submit", ts: { [Op.gte]: since } } }),
  ]);

  // COUNT (bigint) pode voltar como string no driver do pg; normalizamos p/ número.
  const nVisitors = Number(visitors) || 0;
  const nSessions = Number(sessions) || 0;
  const conversionRate = nSessions ? Number((formSubmits / nSessions).toFixed(4)) : 0;

  return {
    rangeDays: Number(days) || 30,
    visitors: nVisitors,
    sessions: nSessions,
    events: Number(events) || 0,
    formStarts: Number(formStarts) || 0,
    formSubmits: Number(formSubmits) || 0,
    conversionRate,
  };
}

// Tempo por seção: soma de dwell e média por seção (usa section_exit).
async function sections({ days = 30 } = {}) {
  const since = sinceTs(days);

  const rows = await Event.findAll({
    attributes: [
      "section",
      [fn("COUNT", col("id")), "views"],
      [fn("SUM", col("dwell_ms")), "totalDwellMs"],
      [fn("AVG", col("dwell_ms")), "avgDwellMs"],
    ],
    where: {
      type: "section_exit",
      ts: { [Op.gte]: since },
      section: { [Op.ne]: null },
    },
    group: ["section"],
    order: [[literal("\"totalDwellMs\""), "DESC"]],
    raw: true,
  });

  return rows.map((r) => ({
    section: r.section,
    views: Number(r.views),
    totalDwellMs: Number(r.totalDwellMs) || 0,
    avgDwellMs: Math.round(Number(r.avgDwellMs) || 0),
  }));
}

// Cliques mais frequentes por rótulo.
async function clicks({ days = 30, limit = 20 } = {}) {
  const since = sinceTs(days);

  // Agrupa por botão + seção da página, guardando quando foi o último clique.
  const rows = await Event.findAll({
    attributes: [
      "label",
      "section",
      [fn("COUNT", col("id")), "count"],
      [fn("MAX", col("ts")), "lastTs"],
    ],
    where: {
      type: "click",
      ts: { [Op.gte]: since },
      label: { [Op.ne]: null },
    },
    group: ["label", "section"],
    order: [[literal("count"), "DESC"]],
    limit: Number(limit) || 20,
    raw: true,
  });

  return rows.map((r) => ({
    label: r.label,
    section: r.section || null,
    count: Number(r.count),
    ultimoClique: Number(r.lastTs) || null,
  }));
}

// Origem do tráfego: de onde vieram as visitas (UTM ou site de origem) e
// quantas delas converteram. Essencial para avaliar tráfego pago.
async function sources({ days = 30 } = {}) {
  const since = sinceTs(days);

  const rows = await sequelize.query(
    `WITH origem AS (
        SELECT session_id,
               COALESCE(
                 NULLIF(meta->'utm'->>'source', ''),
                 CASE
                   WHEN COALESCE(meta->>'referrer','') = '' THEN 'direto'
                   ELSE regexp_replace(meta->>'referrer', '^https?://(www\\.)?([^/]+).*$', '\\2')
                 END,
                 'direto'
               ) AS fonte
        FROM events
        WHERE type = 'session_start' AND ts >= :since
     ),
     conv AS (
        SELECT DISTINCT session_id FROM events WHERE type = 'form_submit' AND ts >= :since
     )
     SELECT o.fonte,
            COUNT(*)                       AS sessoes,
            COUNT(c.session_id)            AS conversoes
     FROM origem o
     LEFT JOIN conv c ON c.session_id = o.session_id
     GROUP BY o.fonte
     ORDER BY sessoes DESC`,
    { replacements: { since }, type: sequelize.QueryTypes.SELECT }
  );

  return rows.map((r) => {
    const sessoes = Number(r.sessoes) || 0;
    const conversoes = Number(r.conversoes) || 0;
    return {
      fonte: r.fonte,
      sessoes,
      conversoes,
      taxaConversao: sessoes ? Number((conversoes / sessoes).toFixed(4)) : 0,
    };
  });
}

// Quebra por dispositivo (celular / computador / tablet) com conversão.
async function devices({ days = 30 } = {}) {
  const since = sinceTs(days);

  const rows = await sequelize.query(
    `WITH aparelho AS (
        SELECT session_id,
               COALESCE(NULLIF(meta->>'device',''), 'desconhecido') AS dispositivo
        FROM events
        WHERE type = 'session_start' AND ts >= :since
     ),
     conv AS (
        SELECT DISTINCT session_id FROM events WHERE type = 'form_submit' AND ts >= :since
     )
     SELECT a.dispositivo,
            COUNT(*)            AS sessoes,
            COUNT(c.session_id) AS conversoes
     FROM aparelho a
     LEFT JOIN conv c ON c.session_id = a.session_id
     GROUP BY a.dispositivo
     ORDER BY sessoes DESC`,
    { replacements: { since }, type: sequelize.QueryTypes.SELECT }
  );

  return rows.map((r) => {
    const sessoes = Number(r.sessoes) || 0;
    const conversoes = Number(r.conversoes) || 0;
    return {
      dispositivo: r.dispositivo,
      sessoes,
      conversoes,
      taxaConversao: sessoes ? Number((conversoes / sessoes).toFixed(4)) : 0,
    };
  });
}

// Últimas sessões com duração, páginas e se converteram.
async function sessions({ limit = 30 } = {}) {
  const rows = await sequelize.query(
    `SELECT
        session_id                         AS "sessionId",
        MIN(visitor_id)                    AS "visitorId",
        MIN(ts)                            AS "startedAt",
        MAX(ts)                            AS "lastAt",
        (MAX(ts) - MIN(ts))                AS "durationMs",
        COUNT(*)                           AS "events",
        COUNT(DISTINCT path)               AS "pages",
        MAX(CASE WHEN type = 'session_start' THEN meta->>'device' END)   AS "device",
        MAX(CASE WHEN type = 'session_start' THEN meta->>'referrer' END) AS "referrer",
        MIN(CASE WHEN type = 'page_view' THEN path END)                  AS "entryPath",
        BOOL_OR(type = 'form_submit')      AS "converted"
     FROM events
     GROUP BY session_id
     ORDER BY MAX(ts) DESC
     LIMIT :limit`,
    {
      replacements: { limit: Number(limit) || 30 },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  return rows.map((r) => ({
    sessionId: r.sessionId,
    visitorId: r.visitorId,
    startedAt: Number(r.startedAt),
    lastAt: Number(r.lastAt),
    durationMs: Number(r.durationMs) || 0,
    events: Number(r.events),
    pages: Number(r.pages),
    device: r.device || "desconhecido",
    referrer: r.referrer || null,
    entryPath: r.entryPath || null,
    converted: Boolean(r.converted),
  }));
}

// Atividade por dia (últimos N dias), com dias sem tráfego preenchidos com zero.
// Agrupa no fuso de São Paulo para bater com o dia "de verdade" do Patrick.
async function daily({ days = 30 } = {}) {
  const dias = Number(days) || 30;
  const since = sinceTs(dias);

  const rows = await sequelize.query(
    `WITH intervalo AS (
        SELECT generate_series(
          (now() AT TIME ZONE 'America/Sao_Paulo')::date - (:dias - 1),
          (now() AT TIME ZONE 'America/Sao_Paulo')::date,
          interval '1 day'
        )::date AS dia
     ),
     agregado AS (
        SELECT (to_timestamp(ts / 1000) AT TIME ZONE 'America/Sao_Paulo')::date AS dia,
               COUNT(DISTINCT visitor_id) AS visitantes,
               COUNT(DISTINCT session_id) AS visitas,
               COUNT(*) FILTER (WHERE type = 'form_submit') AS envios
        FROM events
        WHERE ts >= :since
        GROUP BY 1
     )
     SELECT to_char(i.dia, 'YYYY-MM-DD')      AS dia,
            COALESCE(a.visitantes, 0)         AS visitantes,
            COALESCE(a.visitas, 0)            AS visitas,
            COALESCE(a.envios, 0)             AS envios
     FROM intervalo i
     LEFT JOIN agregado a ON a.dia = i.dia
     ORDER BY i.dia ASC`,
    { replacements: { dias, since }, type: sequelize.QueryTypes.SELECT }
  );

  return rows.map((r) => ({
    dia: r.dia,
    visitantes: Number(r.visitantes) || 0,
    visitas: Number(r.visitas) || 0,
    envios: Number(r.envios) || 0,
  }));
}

// Engajamento: rolagem média e duração média das visitas.
async function engagement({ days = 30 } = {}) {
  const since = sinceTs(days);

  const [scroll] = await sequelize.query(
    `SELECT ROUND(AVG((meta->>'maxScrollPct')::numeric)) AS media
     FROM events
     WHERE type = 'session_end' AND ts >= :since AND meta->>'maxScrollPct' IS NOT NULL`,
    { replacements: { since }, type: sequelize.QueryTypes.SELECT }
  );

  const [dur] = await sequelize.query(
    `SELECT ROUND(AVG(dur)) AS media FROM (
        SELECT (MAX(ts) - MIN(ts)) AS dur FROM events
        WHERE ts >= :since GROUP BY session_id
     ) t`,
    { replacements: { since }, type: sequelize.QueryTypes.SELECT }
  );

  return {
    rolagemMediaPct: Number(scroll && scroll.media) || 0,
    duracaoMediaMs: Number(dur && dur.media) || 0,
  };
}

// Dump completo para análise externa (o que você me envia depois).
async function exportar({ days = 90 } = {}) {
  const { Lead } = require("../../models");
  const dias = Number(days) || 90;

  const [resumo, porDia, secoes, cliques, origens, dispositivos, engaj, sessoes, leadsRows] =
    await Promise.all([
      summary({ days: dias }),
      daily({ days: dias }),
      sections({ days: dias }),
      clicks({ days: dias, limit: 100 }),
      sources({ days: dias }),
      devices({ days: dias }),
      engagement({ days: dias }),
      sessions({ limit: 200 }),
      Lead.findAll({ order: [["created_at", "DESC"]], limit: 500, raw: true }),
    ]);

  const leads = leadsRows.map((r) => ({
    nome: r.nome,
    email: r.email,
    whatsapp: r.whatsapp,
    tipo: r.tipo,
    mensagem: r.mensagem,
    criadoEm: r.createdAt,
  }));

  return {
    periodoDias: dias,
    resumo,
    engajamento: engaj,
    porDia,
    secoes,
    cliques,
    origens,
    dispositivos,
    sessoes,
    leads,
  };
}

// Visitas vindas de IA: classifica o referrer em ChatGPT / Perplexity / Gemini /
// Copilot / Claude etc. É como você vê quando uma IA te indicou.
async function aiVisits({ days = 30 } = {}) {
  const since = sinceTs(days);

  const rows = await sequelize.query(
    `WITH base AS (
        SELECT session_id,
               lower(regexp_replace(COALESCE(meta->>'referrer',''), '^https?://(www\\.)?([^/]+).*$', '\\2')) AS host
        FROM events
        WHERE type = 'session_start' AND ts >= :since
     ),
     mapeado AS (
        SELECT session_id,
               CASE
                 WHEN host LIKE '%chatgpt.com%' OR host LIKE '%chat.openai.com%' OR host = 'openai.com' THEN 'ChatGPT'
                 WHEN host LIKE '%perplexity.ai%' THEN 'Perplexity'
                 WHEN host LIKE '%gemini.google.com%' OR host LIKE '%bard.google.com%' THEN 'Gemini'
                 WHEN host LIKE '%copilot.microsoft.com%' OR host LIKE '%copilot.cloud.microsoft%' THEN 'Copilot'
                 WHEN host LIKE '%claude.ai%' THEN 'Claude'
                 WHEN host LIKE '%you.com%' THEN 'You.com'
                 WHEN host LIKE '%poe.com%' THEN 'Poe'
                 ELSE NULL
               END AS engine
        FROM base
     ),
     conv AS (
        SELECT DISTINCT session_id FROM events WHERE type = 'form_submit' AND ts >= :since
     )
     SELECT m.engine,
            COUNT(*)             AS sessoes,
            COUNT(c.session_id)  AS conversoes
     FROM mapeado m
     LEFT JOIN conv c ON c.session_id = m.session_id
     WHERE m.engine IS NOT NULL
     GROUP BY m.engine
     ORDER BY sessoes DESC`,
    { replacements: { since }, type: sequelize.QueryTypes.SELECT }
  );

  return rows.map((r) => {
    const sessoes = Number(r.sessoes) || 0;
    const conversoes = Number(r.conversoes) || 0;
    return {
      engine: r.engine,
      sessoes,
      conversoes,
      taxaConversao: sessoes ? Number((conversoes / sessoes).toFixed(4)) : 0,
    };
  });
}

module.exports = {
  summary,
  sections,
  clicks,
  sessions,
  daily,
  sources,
  devices,
  engagement,
  aiVisits,
  exportar,
};
