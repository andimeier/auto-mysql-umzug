'use strict';

module.exports = {
  up: function (query, DataTypes) {
    return query.sequelize.query(
      `Create table users ( id int );`,
      { raw: true });
  },

  down: function () {
    return query.sequelize.query(
      `drop table users;`,
      { raw: true });
  }
};