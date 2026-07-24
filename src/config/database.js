// Config do Sequelize — usada tanto pelo sequelize-cli (migrations) quanto
// pelo models/index.js. Exporta um objeto por ambiente.
require("dotenv").config();

function fromParts() {
  return {
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "portfolio_tracking",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    dialect: "postgres",
    logging: false,
    dialectOptions:
      String(process.env.DB_SSL || "false") === "true"
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
    define: { underscored: true, timestamps: true },
  };
}

function fromUrl(url) {
  return {
    url,
    dialect: "postgres",
    logging: false,
    dialectOptions:
      String(process.env.DB_SSL || "false") === "true"
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
    define: { underscored: true, timestamps: true },
  };
}

function build() {
  return process.env.DATABASE_URL
    ? fromUrl(process.env.DATABASE_URL)
    : fromParts();
}

module.exports = {
  development: build(),
  test: build(),
  production: build(),
};
