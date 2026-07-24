// Lead = uma mensagem de contato enviada pelo formulário do site,
// com exatamente o que a pessoa escreveu.
module.exports = (sequelize, DataTypes) => {
  const Lead = sequelize.define(
    "Lead",
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      visitorId: { type: DataTypes.STRING, allowNull: true, field: "visitor_id" },
      sessionId: { type: DataTypes.STRING, allowNull: true, field: "session_id" },
      nome: { type: DataTypes.STRING, allowNull: true },
      email: { type: DataTypes.STRING, allowNull: true },
      whatsapp: { type: DataTypes.STRING, allowNull: true },
      tipo: { type: DataTypes.STRING, allowNull: true },
      mensagem: { type: DataTypes.TEXT, allowNull: true },
      path: { type: DataTypes.STRING, allowNull: true },
      meta: { type: DataTypes.JSONB, allowNull: true },
    },
    {
      tableName: "leads",
      underscored: true,
      timestamps: true,
      updatedAt: false,
      indexes: [{ fields: ["created_at"] }, { fields: ["email"] }, { fields: ["visitor_id"] }],
    }
  );

  return Lead;
};
