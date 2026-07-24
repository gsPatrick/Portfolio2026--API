"use strict";

/** Cria as tabelas de rastreamento: visitors e events. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("visitors", {
      visitor_id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      first_seen: { type: Sequelize.DATE, allowNull: false },
      last_seen: { type: Sequelize.DATE, allowNull: false },
      sessions_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("events", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      visitor_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: "visitors", key: "visitor_id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      session_id: { type: Sequelize.STRING, allowNull: false },
      type: { type: Sequelize.STRING, allowNull: false },
      ts: { type: Sequelize.BIGINT, allowNull: false },
      path: { type: Sequelize.STRING, allowNull: true },
      section: { type: Sequelize.STRING, allowNull: true },
      label: { type: Sequelize.STRING, allowNull: true },
      dwell_ms: { type: Sequelize.INTEGER, allowNull: true },
      meta: { type: Sequelize.JSONB, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("events", ["visitor_id"]);
    await queryInterface.addIndex("events", ["session_id"]);
    await queryInterface.addIndex("events", ["type"]);
    await queryInterface.addIndex("events", ["section"]);
    await queryInterface.addIndex("events", ["created_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("events");
    await queryInterface.dropTable("visitors");
  },
};
