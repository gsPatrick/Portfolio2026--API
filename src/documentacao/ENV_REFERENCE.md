# Referência de variáveis de ambiente

Todas são lidas em um único lugar: `src/config/env.js`. Não use `process.env`
espalhado pelo código.

| Variável         | Obrigatória | Padrão                 | Descrição                                                                 |
|------------------|-------------|------------------------|---------------------------------------------------------------------------|
| `NODE_ENV`       | não         | `development`          | Ambiente. Em `production` o stack de erro não vaza na resposta.           |
| `PORT`           | não         | `4000`                 | Porta HTTP da API.                                                        |
| `APP_API_PREFIX` | não         | `/api`                 | Prefixo das rotas. A versão `/v1` é acrescentada pela própria API.        |
| `CORS_ORIGIN`    | recomendada | (vazio = libera geral) | Origens permitidas, separadas por vírgula. Ex.: domínio do front.         |
| `DATABASE_URL`   | condicional | (vazio)                | URL única do Postgres. Se preenchida, **tem prioridade** sobre as partes. |
| `DB_HOST`        | condicional | `localhost`            | Host do Postgres (usado se `DATABASE_URL` vazia).                         |
| `DB_PORT`        | não         | `5432`                 | Porta do Postgres.                                                        |
| `DB_NAME`        | condicional | `portfolio_tracking`   | Nome do banco.                                                            |
| `DB_USER`        | condicional | `postgres`             | Usuário do banco.                                                         |
| `DB_PASSWORD`    | condicional | (vazio)                | Senha do banco.                                                           |
| `DB_SSL`         | não         | `false`                | `true` para exigir SSL (provedores gerenciados costumam pedir).          |

## Precedência do banco

`DATABASE_URL` preenchida → usa a URL e ignora `DB_*`.
`DATABASE_URL` vazia → monta a conexão a partir de `DB_HOST`/`DB_PORT`/`DB_NAME`/
`DB_USER`/`DB_PASSWORD`.

## CORS

- Vazio → `origin: true` (reflete qualquer origem). Bom para desenvolvimento.
- Preenchido → só as origens listadas passam. Use em produção, ex.:
  `CORS_ORIGIN=https://codebypatrick.dev`

## Exemplo de produção (provedor gerenciado)

```
NODE_ENV=production
PORT=4000
APP_API_PREFIX=/api
CORS_ORIGIN=https://codebypatrick.dev
DATABASE_URL=postgres://user:pass@host:5432/db
DB_SSL=true
```
