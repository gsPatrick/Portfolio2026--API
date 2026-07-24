"use strict";

// Tabela de "leads": o que a pessoa realmente escreveu no formulário de contato.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("leads", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      visitor_id: { type: Sequelize.STRING, allowNull: true },
      session_id: { type: Sequelize.STRING, allowNull: true },
      nome: { type: Sequelize.STRING, allowNull: true },
      email: { type: Sequelize.STRING, allowNull: true },
      whatsapp: { type: Sequelize.STRING, allowNull: true },
      tipo: { type: Sequelize.STRING, allowNull: true }, // o que a pessoa marcou (SaaS, automação...)
      mensagem: { type: Sequelize.TEXT, allowNull: true },
      path: { type: Sequelize.STRING, allowNull: true },
      meta: { type: Sequelize.JSONB, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    });

    await queryInterface.addIndex("leads", ["created_at"]);
    await queryInterface.addIndex("leads", ["email"]);
    await queryInterface.addIndex("leads", ["visitor_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("leads");
  },
};
