// Visitante anônimo — identificado por um UUID gerado e persistido no front.
module.exports = (sequelize, DataTypes) => {
  const Visitor = sequelize.define(
    "Visitor",
    {
      visitorId: {
        type: DataTypes.STRING,
        primaryKey: true,
        field: "visitor_id",
      },
      firstSeen: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "first_seen",
      },
      lastSeen: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "last_seen",
      },
      sessionsCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "sessions_count",
      },
    },
    {
      tableName: "visitors",
      underscored: true,
      timestamps: true,
    }
  );

  Visitor.associate = (models) => {
    Visitor.hasMany(models.Event, {
      foreignKey: "visitor_id",
      sourceKey: "visitorId",
      as: "events",
    });
  };

  return Visitor;
};
