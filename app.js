const express = require("express");
const cors = require("cors");

const env = require("./src/config/env");
const routes = require("./src/routes");
const { sequelize } = require("./src/models");
const notFound = require("./src/middlewares/not-found");
const errorHandler = require("./src/middlewares/error-handler");

const app = express();

// CORS: se nenhuma origem for configurada, libera geral (útil em dev).
app.use(
  cors({
    origin: env.corsOrigin.length ? env.corsOrigin : true,
    methods: ["GET", "POST", "OPTIONS"],
  })
);

// Aceita JSON e também text/plain (sendBeacon envia como text/plain).
app.use(express.json({ limit: "256kb" }));
app.use(express.text({ type: ["text/plain"], limit: "256kb" }));
app.use((req, res, next) => {
  if (typeof req.body === "string" && req.body.length) {
    try {
      req.body = JSON.parse(req.body);
    } catch (_) {
      req.body = {};
    }
  }
  next();
});

// Rotas da API sob o prefixo (ex.: /api → /api/v1/...).
app.use(env.apiPrefix, routes);

// Tela do painel (HTML). Fica fora do prefixo para ter um endereço curto: /painel
const painelController = require("./src/features/painel/painel.controller");
app.get("/painel", painelController.pagina);
app.get("/clientes", painelController.paginaClientes);

// Raiz amigável: explica onde estão as coisas.
app.get("/", (req, res) => {
  res.json({
    ok: true,
    mensagem: "API de rastreamento do Patrick.Developer no ar. Abra /painel no navegador para ver os números.",
    links: {
      painel: "/painel",
      saude: `${env.apiPrefix}/v1/ping`,
      dadosDoPainel: `${env.apiPrefix}/v1/painel`,
    },
  });
});

// Fallbacks.
app.use(notFound);
app.use(errorHandler);

// Sobe o servidor só depois de garantir a conexão com o banco.
async function start() {
  try {
    await sequelize.authenticate();
    // eslint-disable-next-line no-console
    console.log("[db] conexão ok");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[db] falha ao conectar:", err.message);
  }

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[api] rodando em http://localhost:${env.port}${env.apiPrefix}/v1`);
  });
}

if (require.main === module) {
  start();
}

module.exports = app;
