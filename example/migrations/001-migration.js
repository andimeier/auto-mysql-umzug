'use strict';

module.exports = {
  up: function (query, DataTypes) {
    return query.createTable('basic_objects', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      createdAt: {
        type: DataTypes.DATE
      }
    });
  },

  down: function () {
    return query.dropTable('basic_objects');
  }
};