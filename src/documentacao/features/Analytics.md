# Feature: Analytics (leitura)

Leituras agregadas sobre os eventos, para um painel interno. Somente `GET`.

- Rotas: `GET /api/v1/analytics/*`
- Arquivos: `src/features/analytics/{analytics.routes,analytics.controller,analytics.service}.js`

Todas respondem no formato `{ "ok": true, "data": ... }`.

## `GET /summary?days=30`

Totais no período (padrão 30 dias).

```json
{
  "rangeDays": 30,
  "visitors": 128,        // visitantes distintos
  "sessions": 173,        // sessões distintas
  "events": 5820,         // eventos brutos
  "formStarts": 22,       // quem começou o formulário
  "formSubmits": 9,       // quem enviou
  "conversionRate": 0.052 // formSubmits / sessions
}
```

## `GET /sections?days=30`

Tempo e visitas por seção (baseado em `section_exit` + `dwell_ms`),
ordenado pelo tempo total.

```json
[
  { "section": "hero",     "views": 173, "totalDwellMs": 726600, "avgDwellMs": 4200 },
  { "section": "servicos", "views": 140, "totalDwellMs": 512000, "avgDwellMs": 3657 }
]
```

## `GET /clicks?days=30&limit=20`

Cliques mais frequentes por **botão + seção da página**, com o horário do último clique.

```json
[
  { "label": "Agenda aberta", "section": "hero",    "count": 61, "ultimoClique": 1784896982000 },
  { "label": "WhatsApp",      "section": "contato", "count": 34, "ultimoClique": 1784890000000 }
]
```

## `GET /daily?days=30`

Atividade por dia (dias sem tráfego vêm com zero), no fuso de São Paulo.

```json
[
  { "dia": "2026-07-23", "visitantes": 4, "visitas": 4, "envios": 2 },
  { "dia": "2026-07-24", "visitantes": 1, "visitas": 1, "envios": 1 }
]
```

## `GET /sources?days=30`  — origem do tráfego (essencial p/ tráfego pago)

De onde vieram as visitas e quanto cada origem converte. Usa `utm_source` quando
existe (tráfego pago), senão o domínio do `referrer`, senão `direto`.

```json
[
  { "fonte": "instagram", "sessoes": 40, "conversoes": 5, "taxaConversao": 0.125 },
  { "fonte": "google",    "sessoes": 33, "conversoes": 2, "taxaConversao": 0.0606 },
  { "fonte": "direto",    "sessoes": 12, "conversoes": 1, "taxaConversao": 0.0833 }
]
```

## `GET /devices?days=30`

Quebra por aparelho (celular / computador / tablet), com conversão de cada um.

```json
[
  { "dispositivo": "celular",    "sessoes": 60, "conversoes": 6, "taxaConversao": 0.10 },
  { "dispositivo": "computador", "sessoes": 25, "conversoes": 4, "taxaConversao": 0.16 }
]
```

## `GET /export?days=90`  — dump completo para análise

Junta **tudo** num JSON só (resumo, engajamento, por dia, seções, cliques, origens,
dispositivos, sessões e as mensagens do formulário). É o arquivo que o Patrick baixa
pelo botão **Exportar** do painel e envia para uma análise de melhorias da página.

## O que é capturado para tráfego pago

O front (`frontend/lib/track.js`) já envia no `session_start`: `utm` (source/medium/
campaign/term/content), `referrer`, `entryPath`, `device` (celular/computador/tablet),
`screen`, `viewport`, `language`, `timezone`, `userAgent`. No `session_end` envia
`maxScrollPct` (até onde a pessoa rolou). Isso alimenta origem, dispositivos e
engajamento — o suficiente para avaliar campanhas e otimizar conversão.

## `GET /sessions?limit=30`

Últimas sessões, com duração e se converteram (SQL agregado por `session_id`).

```json
[
  {
    "sessionId": "9ac2...",
    "visitorId": "b3f1...",
    "startedAt": 1784896976742,
    "lastAt": 1784896991000,
    "durationMs": 14258,
    "events": 9,
    "pages": 1,
    "converted": true
  }
]
```

## Notas de implementação

- `days` é convertido em um corte `ts >= agora - days*24h` (ts em ms).
- `summary`, `sections` e `clicks` usam agregações do Sequelize; `sessions` usa uma
  query SQL crua por precisar de `BOOL_OR` e `MAX(ts)-MIN(ts)` por sessão.
- Esses endpoints são de leitura interna. Antes de expor publicamente, coloque
  atrás de autenticação (fora do escopo atual).
