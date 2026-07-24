// Evento de rastreamento. Campos comuns viram colunas (para filtro/índice);
// o resto do payload fica em `meta` (JSONB), sem precisar migração por campo.
module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define(
    "Event",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      visitorId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "visitor_id",
      },
      sessionId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "session_id",
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      // timestamp do evento no cliente (epoch ms)
      ts: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      path: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      section: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      label: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      dwellMs: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "dwell_ms",
      },
      meta: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      tableName: "events",
      underscored: true,
      timestamps: true,
      updatedAt: false,
      indexes: [
        { fields: ["visitor_id"] },
        { fields: ["session_id"] },
        { fields: ["type"] },
        { fields: ["section"] },
        { fields: ["created_at"] },
      ],
    }
  );

  Event.associate = (models) => {
    Event.belongsTo(models.Visitor, {
      foreignKey: "visitor_id",
      targetKey: "visitorId",
      as: "visitor",
    });
  };

  return Event;
};
