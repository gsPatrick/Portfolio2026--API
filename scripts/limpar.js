/* eslint-disable no-console */
// Apaga TODOS os eventos e visitantes. Use para zerar antes de ir ao ar
// (ou para remover os dados de demonstração).
const { sequelize } = require("../src/models");

async function main() {
  await sequelize.authenticate();
  await sequelize.query('TRUNCATE TABLE "events", "visitors" RESTART IDENTITY CASCADE;');
  console.log("Banco de rastreamento zerado: 0 eventos, 0 visitantes.");
  await sequelize.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
