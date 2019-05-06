'use strict';


module.exports = {
  up: function () {
    console.log('executing migration 004 (dummy)');
    return Promise.resolve();
  },

  down: function () {
    console.log('reverting migration 004 (dummy)');
    return Promise.resolve();
  }
};