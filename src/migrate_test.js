'use strict';

// configs
var setup = rootRequire('utils/setup');
var config = rootRequire('config/config');
var settings = rootRequire('config/settings');
const migrate = rootRequire('utils/migrate')({
    dbName: 'hermes',
    dbUser: 'root',
    dbPass: 'root'
});

// first, migrate db if it is not up to date
migrate.execute()
    .then(x => {
        console.log(`sucessful migration: ${x}`);
    })
    .catch(x => {
        console.log(`ERROR: error at migration: ${x}`);
    })
    .then(() => {
        console.log('----> exiting after migration (debugging mode)');
        process.exit(0);
    });

