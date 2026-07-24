const { sequelize, Visitor, Event } = require("../../models");
const AppError = require("../../utils/app-error");
const {
  EVENT_TYPES,
  COLUMN_FIELDS,
  MAX_EVENTS_PER_REQUEST,
} = require("./tracking.constants");

// Separa os campos conhecidos (colunas) do resto (meta).
function toRow(visitorId, sessionId, event) {
  const { type, ts, path, section, label, dwellMs, dwell_ms } = event;

  const meta = {};
  Object.keys(event).forEach((key) => {
    if (
      ["type", "ts", "dwellMs", "dwell_ms", ...COLUMN_FIELDS].includes(key)
    ) {
      return;
    }
    meta[key] = event[key];
  });

  return {
    visitorId,
    sessionId,
    type,
    ts: Number(ts) || Date.now(),
    path: path || null,
    section: section || null,
    label: label != null ? String(label).slice(0, 255) : null,
    dwellMs: dwellMs != null ? Number(dwellMs) : dwell_ms != null ? Number(dwell_ms) : null,
    meta: Object.keys(meta).length ? meta : null,
  };
}

// Recebe um lote de eventos, garante o visitante e persiste tudo numa transação.
async function ingest(payload) {
  const { visitorId, sessionId, events } = payload || {};

  if (!visitorId || !sessionId) {
    throw new AppError("visitorId e sessionId são obrigatórios.", 422, "invalid_payload");
  }
  if (!Array.isArray(events) || events.length === 0) {
    throw new AppError("events deve ser um array não vazio.", 422, "invalid_payload");
  }
  if (events.length > MAX_EVENTS_PER_REQUEST) {
    throw new AppError(`Máximo de ${MAX_EVENTS_PER_REQUEST} eventos por requisição.`, 413, "too_many_events");
  }

  const valid = events.filter((e) => e && EVENT_TYPES.includes(e.type));
  if (valid.length === 0) {
    throw new AppError("Nenhum evento com tipo válido.", 422, "invalid_events");
  }

  const now = new Date();
  const hasSessionStart = valid.some((e) => e.type === "session_start");
  const rows = valid.map((e) => toRow(visitorId, sessionId, e));

  await sequelize.transaction(async (t) => {
    const [visitor, created] = await Visitor.findOrCreate({
      where: { visitorId },
      defaults: {
        visitorId,
        firstSeen: now,
        lastSeen: now,
        sessionsCount: hasSessionStart ? 1 : 0,
      },
      transaction: t,
    });

    if (!created) {
      visitor.lastSeen = now;
      if (hasSessionStart) visitor.sessionsCount += 1;
      await visitor.save({ transaction: t });
    }

    await Event.bulkCreate(rows, { transaction: t });
  });

  return { accepted: rows.length };
}

module.exports = { ingest };
