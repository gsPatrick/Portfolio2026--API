// Inicializa o Sequelize, carrega todos os models desta pasta e aplica
// as associações. Exporta { sequelize, Sequelize, ...models }.
const fs = require("fs");
const path = require("path");
const { Sequelize, DataTypes } = require("sequelize");

const env = require("../config/env");
const configByEnv = require("../config/database");

const config = configByEnv[env.nodeEnv] || configByEnv.development;

const sequelize = config.url
  ? new Sequelize(config.url, config)
  : new Sequelize(config.database, config.username, config.password, config);

const db = {};

fs.readdirSync(__dirname)
  .filter((file) => file !== "index.js" && file.endsWith(".js"))
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

Object.values(db).forEach((model) => {
  if (typeof model.associate === "function") model.associate(db);
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
