# API de Rastreamento — Patrick.Developer

API de analytics/rastreamento da landing page. Recebe eventos do front (quem entrou,
por onde passou, quanto tempo ficou em cada seção, onde clicou, se usou o formulário) e
expõe leituras agregadas para um painel interno.

- **Stack:** Node.js + Express + Sequelize + PostgreSQL (JavaScript, sem TypeScript).
- **Padrão:** `routes → controller → service`, features isoladas em `src/features/*`.
- **Versão pública:** tudo sob `{{APP_API_PREFIX}}/v1` (padrão `/api/v1`).

## Estrutura

```
api/
├── app.js                      # entry point (Express, middlewares, listen)
├── .sequelizerc                # aponta config/models/migrations p/ o sequelize-cli
├── migrations/                 # migrations versionadas
├── scripts/smoke.js            # teste ponta a ponta (npm run smoke:test)
└── src/
    ├── config/
    │   ├── env.js              # leitura central de variáveis de ambiente
    │   └── database.js         # config do Sequelize (dev/test/prod) + instância
    ├── models/
    │   ├── index.js            # instancia Sequelize e aplica associações
    │   ├── visitor.js          # visitantes (1—N eventos)
    │   └── event.js            # eventos brutos
    ├── middlewares/
    │   ├── error-handler.js    # erro único e padronizado
    │   └── not-found.js        # 404 padronizado
    ├── routes/index.js         # agregador de versões/rotas
    ├── utils/
    │   ├── app-error.js        # erro operacional (statusCode, code)
    │   ├── catch-async.js      # wrapper async → next(err)
    │   └── api-response.js      # ok()/fail() padronizados
    ├── features/
    │   ├── health/             # GET /v1/ping
    │   ├── tracking/           # POST /v1/events (ingestão)
    │   ├── analytics/          # GET /v1/analytics/* (leitura)
    │   ├── leads/              # POST/GET /v1/leads (mensagens do formulário)
    │   └── painel/             # telas /painel e /clientes + GET /v1/painel
    └── documentacao/           # esta pasta
```

## Como rodar

```bash
cd api
cp .env.example .env       # ajuste as credenciais do Postgres
npm install
createdb portfolio_tracking   # ou crie via seu gerenciador
npm run migrate            # cria as tabelas
npm run dev                # sobe em http://localhost:4000/api/v1
npm run smoke:test         # valida ingestão + leitura ponta a ponta
```

## Endpoints

**Telas (HTML, abra no navegador):**

| Rota         | Descrição                                                    |
|--------------|-------------------------------------------------------------|
| `/painel`    | Painel visual: números, atividade por dia, seções, cliques  |
| `/clientes`  | Mensagens que chegaram pelo formulário (com botão de resposta) |

**API (JSON):**

| Método | Rota                         | Descrição                             |
|--------|------------------------------|---------------------------------------|
| GET    | `/api/v1/ping`               | Health-check (app + banco)            |
| POST   | `/api/v1/events`             | Ingestão de um lote de eventos        |
| GET    | `/api/v1/analytics/summary`  | Totais: visitantes, sessões, conversão|
| GET    | `/api/v1/analytics/sections` | Tempo/visitas por seção               |
| GET    | `/api/v1/analytics/clicks`   | Cliques mais frequentes por rótulo    |
| GET    | `/api/v1/analytics/sessions` | Últimas sessões (duração, conversão)  |
| GET    | `/api/v1/analytics/daily`    | Atividade por dia (visitas, envios)   |
| GET    | `/api/v1/painel`             | Tudo que o painel desenha, num JSON só|
| POST   | `/api/v1/leads`              | Salva o que a pessoa escreveu no form |
| GET    | `/api/v1/leads`              | Lista as mensagens recebidas          |

Detalhes de cada feature em [`features/Tracking.md`](./features/Tracking.md) e
[`features/Analytics.md`](./features/Analytics.md). Variáveis de ambiente em
[`ENV_REFERENCE.md`](./ENV_REFERENCE.md). Primeiros passos em
[`ONBOARDING.md`](./ONBOARDING.md).

## Formato de resposta

Sucesso: `{ "ok": true, "data": <payload> }`
Erro:    `{ "ok": false, "error": { "message": "...", "code": "..." } }`
