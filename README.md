# Portfolio 2026 — API

API de rastreamento (analytics) e captura de leads da landing page **Patrick.Developer**.
Recebe eventos de navegação do front (quem entrou, por onde passou, quanto tempo ficou,
onde clicou, origem/UTM, dispositivo, rolagem), guarda as mensagens do formulário e serve
um **painel visual** em português.

- **Stack:** Node.js + Express + Sequelize + PostgreSQL (JavaScript puro).
- **Padrão:** `routes → controller → service`, features isoladas em `src/features/*`.
- **Telas:** `/painel` (números, gráficos, origem, dispositivos) e `/clientes` (mensagens).

## Rodar

```bash
cp .env.example .env     # ajuste as credenciais do Postgres
npm install
npm run migrate          # cria as tabelas
npm run dev              # http://localhost:4000/painel
npm run seed:demo        # (opcional) dados de demonstração
npm run db:limpar        # zera tudo antes de ir ao ar
```

## Documentação

Tudo detalhado em [`src/documentacao/`](./src/documentacao):

- [README](./src/documentacao/README.md) — visão geral e endpoints
- [ONBOARDING](./src/documentacao/ONBOARDING.md) — passo a passo do zero
- [ENV_REFERENCE](./src/documentacao/ENV_REFERENCE.md) — variáveis de ambiente
- [features/Tracking](./src/documentacao/features/Tracking.md) — ingestão de eventos
- [features/Analytics](./src/documentacao/features/Analytics.md) — leituras e exportação
- [features/Leads](./src/documentacao/features/Leads.md) — mensagens do formulário

## Principais endpoints

| Método | Rota | Para quê |
|--------|------|----------|
| POST | `/api/v1/events` | ingestão de eventos do front |
| POST | `/api/v1/leads` | salvar mensagem do formulário |
| GET | `/api/v1/painel` | dados do painel num JSON só |
| GET | `/api/v1/analytics/export?days=90` | dump completo para análise |
| GET | `/painel` · `/clientes` | as telas (HTML) |
