# Feature: Tracking (ingestão)

Recebe os eventos coletados pelo front e persiste em `visitors` + `events`.

- Rota: `POST /api/v1/events`
- Arquivos: `src/features/tracking/{tracking.routes,tracking.controller,tracking.service,tracking.constants}.js`

## Requisição

O front (via `fetch` ou `navigator.sendBeacon`) envia um lote:

```json
{
  "visitorId": "b3f1...",           // id anônimo persistido no localStorage do visitante
  "sessionId": "9ac2...",           // id da sessão (expira após ~30min de inatividade)
  "sentAt": 1784896976742,          // quando o lote foi enviado (ms)
  "events": [
    { "type": "session_start", "ts": 1784896976742, "path": "/" },
    { "type": "page_view",     "ts": 1784896976742, "path": "/" },
    { "type": "section_enter", "ts": 1784896976800, "path": "/", "section": "hero" },
    { "type": "section_exit",  "ts": 1784896981000, "path": "/", "section": "hero", "dwellMs": 4200 },
    { "type": "click",         "ts": 1784896982000, "path": "/", "label": "Agenda aberta" },
    { "type": "form_start",    "ts": 1784896983000, "path": "/" },
    { "type": "form_submit",   "ts": 1784896986000, "path": "/" },
    { "type": "heartbeat",     "ts": 1784896990000, "path": "/" },
    { "type": "session_end",   "ts": 1784896991000, "path": "/" }
  ]
}
```

> `sendBeacon` envia com `Content-Type: text/plain`. O app aceita isso e faz o
> `JSON.parse` no middleware — o front não precisa de headers especiais.

### Campos do evento

| Campo     | Vira coluna? | Observação                                                        |
|-----------|--------------|-------------------------------------------------------------------|
| `type`    | `type`       | Obrigatório. Precisa estar em `EVENT_TYPES` (senão é descartado). |
| `ts`      | `ts`         | Timestamp em ms. Sem valor → `Date.now()` no servidor.            |
| `path`    | `path`       | Rota da página no momento do evento.                              |
| `section` | `section`    | Id da seção (para `section_enter`/`section_exit`).                |
| `label`   | `label`      | Rótulo do clique/alvo (truncado em 255 chars).                    |
| `dwellMs` | `dwell_ms`   | Tempo na seção (aceita `dwellMs` ou `dwell_ms`).                  |
| _outros_  | `meta` JSONB | Qualquer campo extra é guardado em `meta` sem perda.              |

### Tipos aceitos (`EVENT_TYPES`)

`session_start`, `session_end`, `page_view`, `section_enter`, `section_exit`,
`click`, `form_start`, `form_submit`, `form_abandon`, `heartbeat`.

## Regras do service

1. Valida `visitorId`, `sessionId` e que `events` é um array não vazio
   (máx. `200` por requisição — `MAX_EVENTS_PER_REQUEST`).
2. Filtra eventos com `type` reconhecido; se sobrar zero → `422`.
3. **Numa transação:**
   - `findOrCreate` do visitante. Se já existir, atualiza `last_seen`.
   - Se o lote contém `session_start`, incrementa `sessions_count`.
   - `bulkCreate` dos eventos, mapeando campos conhecidos → colunas e o resto → `meta`.

## Respostas

- `202 Accepted` → `{ "ok": true, "data": { "accepted": 8 } }`
- `422 invalid_payload` / `invalid_events` → payload incompleto ou sem eventos válidos.
- `413 too_many_events` → lote acima do limite.

## Privacidade

Não há PII: o `visitorId` é anônimo (gerado no cliente). O front respeita
`navigator.doNotTrack` e não envia nada quando o usuário optou por não rastrear.
