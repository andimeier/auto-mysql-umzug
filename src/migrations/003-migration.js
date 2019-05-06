'use strict';


module.exports = {
  up: function (query, DataTypes) {
    return query.addColumn('basic_objects', 'name', {
      type: DataTypes.STRING,
      length: 20,
      after: 'createdAt'
    });
  },

  down: function () {
    return query.dropColumn('basic_objects', 'name');
  }
};