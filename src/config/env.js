// Centraliza a leitura de variáveis de ambiente. Evita process.env espalhado.
require("dotenv").config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  apiPrefix: process.env.APP_API_PREFIX || "/api",
  corsOrigin: (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  db: {
    url: process.env.DATABASE_URL || "",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    name: process.env.DB_NAME || "portfolio_tracking",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    ssl: String(process.env.DB_SSL || "false") === "true",
  },
};

module.exports = env;
