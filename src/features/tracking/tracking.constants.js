// Tipos de evento aceitos e campos que viram coluna (o resto vai para `meta`).
const EVENT_TYPES = [
  "session_start",
  "session_end",
  "page_view",
  "section_enter",
  "section_exit",
  "click",
  "form_start",
  "form_submit",
  "form_abandon",
  "heartbeat",
];

// Campos promovidos a coluna própria.
const COLUMN_FIELDS = ["path", "section", "label"];

// Limite de eventos por requisição (proteção simples).
const MAX_EVENTS_PER_REQUEST = 200;

module.exports = { EVENT_TYPES, COLUMN_FIELDS, MAX_EVENTS_PER_REQUEST };
