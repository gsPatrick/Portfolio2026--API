# Onboarding

Guia rápido para rodar e entender a API do zero.

## 1. Pré-requisitos

- Node.js 18+ (testado no 24).
- PostgreSQL 13+ rodando localmente (ou uma `DATABASE_URL` remota).

## 2. Configuração

```bash
cd api
cp .env.example .env
```

Edite o `.env` com as credenciais do seu Postgres. Duas formas:

- **URL única:** preencha `DATABASE_URL` (tem prioridade).
- **Partes separadas:** deixe `DATABASE_URL` vazia e preencha `DB_HOST`, `DB_PORT`,
  `DB_NAME`, `DB_USER`, `DB_PASSWORD`.

## 3. Banco e migrations

```bash
createdb portfolio_tracking   # nome deve bater com DB_NAME/DATABASE_URL
npm install
npm run migrate               # cria tabelas visitors + events
```

Para desfazer a última migration: `npm run migrate:undo`.

## 4. Subir a API

```bash
npm run dev     # node --watch, reinicia ao salvar
# ou
npm start
```

Saída esperada:

```
[db] conexão ok
[api] rodando em http://localhost:4000/api/v1
```

## 5. Validar

```bash
npm run smoke:test
```

Sobe o app numa porta efêmera, injeta um lote de eventos e confere que a leitura
de analytics contabiliza a conversão. Deve terminar com `SMOKE OK ✔`.

## 6. Conectar o front

No projeto Next (`frontend/`), defina em `.env.local`:

```
NEXT_PUBLIC_TRACK_URL=http://localhost:4000/api/v1/events
```

O cliente de tracking (`frontend/lib/track.js`) passa a enviar os lotes para cá.
Em produção, aponte para o domínio público da API e liste o domínio do front em
`CORS_ORIGIN`.

## Fluxo de uma requisição

```
front (lib/track.js)
   │  POST /api/v1/events  { visitorId, sessionId, sentAt, events[] }
   ▼
routes/index.js → features/tracking/tracking.routes.js
   ▼
tracking.controller.js  (catchAsync)
   ▼
tracking.service.js     (valida → upsert visitor → bulkCreate events, em transação)
   ▼
models (Sequelize) → PostgreSQL
```

Erros viram `next(err)` → `error-handler.js` → JSON padronizado.
