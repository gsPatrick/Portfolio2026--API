# Feature: Leads (mensagens do formulário)

Guarda **exatamente o que a pessoa escreveu** no formulário de contato do site e
mostra tudo na página `/clientes`. Complementa o Formspree e o WhatsApp — agora a
mensagem também fica no seu banco, sem depender de terceiros.

- Rotas: `POST /api/v1/leads` (salvar) e `GET /api/v1/leads` (listar)
- Tela: `/clientes`
- Arquivos: `src/features/leads/*`, model `src/models/lead.js`, tabela `leads`

## POST /api/v1/leads

Chamado automaticamente pelo front quando alguém envia o formulário
(`frontend/lib/leads.js` → derivado de `NEXT_PUBLIC_TRACK_URL`).

```json
{
  "nome": "Marina Alves",
  "email": "marina@empresa.com.br",
  "whatsapp": "(11) 98888-7777",
  "tipo": "SaaS ou plataforma",
  "mensagem": "Preciso de um sistema de agendamento...",
  "visitorId": "b3f1...",   // liga a mensagem à jornada de navegação (opcional)
  "sessionId": "9ac2...",
  "path": "/"
}
```

Regras:
- Precisa vir ao menos **nome, e-mail ou WhatsApp** (senão `422 contato_incompleto`).
- Campos são aparados/limitados (mensagem até 5.000 caracteres).
- Qualquer campo extra do formulário é guardado em `meta` (JSONB), sem perder nada.

Resposta: `201` → `{ "ok": true, "mensagem": "Mensagem recebida e guardada...", "data": { "id": "1" } }`

## GET /api/v1/leads?limit=200

Lista as mensagens mais recentes (padrão 100, máximo 500). Cada item:

```json
{
  "id": "1",
  "nome": "Marina Alves",
  "email": "marina@empresa.com.br",
  "whatsapp": "(11) 98888-7777",
  "tipo": "SaaS ou plataforma",
  "mensagem": "Preciso de um sistema de agendamento...",
  "path": "/",
  "criadoEm": "2026-07-24T13:10:58.927Z",
  "visitante": "b3f1a2c4"
}
```

## Tela /clientes

Lista cada mensagem em um cartão com nome, tipo, texto completo, e botões
**Responder no WhatsApp** (monta o link `wa.me` já com uma saudação) e
**Responder por e-mail**. Atualiza sozinha a cada 30 segundos.

## Privacidade / LGPD

Aqui há dados pessoais reais (nome, e-mail, telefone) — foram fornecidos pela
própria pessoa para ser contatada. Trate com cuidado: acesso restrito à página
`/clientes` (coloque atrás de autenticação antes de expor publicamente) e não
compartilhe a base.
