'use strict';

// configs
const migrate = require('../index')({
    dbName: 'test',
    dbUser: 'root',
    dbPass: 'root'
});

// first, migrate db if it is not up to date
migrate.execute()
    .then(() => {
        console.log(`migration was sucessful`);
        process.exit(0);
    })
    .catch(err => {
        console.log(`ERROR: error at migration: ${err}`);
        process.exit(1);
    });

