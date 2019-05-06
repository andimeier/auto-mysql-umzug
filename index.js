/**
 * the migrate module performs all actions with respect to database migrations.
 * It is intended to be called just before the application starts. 
 * This script will detect the current database status and apply any migrations
 * which are necessary (which are missing).
 * 
 * The applied migrations will be tracked in a database table called '_migrations'
 * 
 * To use it, simply call the execute method, something like this:
 *   migrate.execute().then(() => { startApplication() });
 */

const Umzug = require('umzug');
const Sequelize = require('sequelize');
const path = require('path');

let migrationTableName = '_migrations';
let migrationsDir = 'migrations'; // default

// TODO: mysql2 needed, ditch mysql instead (now both are in node_modules) 
// TODO: warn when executed migrations are there which are not known to the software (which
// indicates a db revert should be done)
// TODO: extract migrate as a npm module

let umzug;
let sequelize;

/**
 * initialize Sequelize
 * 
 * @param opt {object} config object, consisiting of: { dbName, dbUser, dbPass, dbType}
 *   dbType is the Sequelize DB type, it is optional, with 'mysql' as default
 */
function initSequelize(opt) {

    opt = opt || {};

    if (!opt.dbName) {
        throw new Error('missing mandatory config parameter dbName');
    }
    if (!opt.dbUser) {
        throw new Error('missing mandatory config parameter dbUser');
    }
    if (!opt.dbPass) {
        throw new Error('missing mandatory config parameter dbPass');
    }
    opt.migrationDir = path.resolve(path.dirname(require.main.filename), (opt.migrationDir || migrationsDir));

    let sequelizeOptions = {
        dialect: opt.dbType || 'mysql',

        pool: {
            max: 5,
            min: 0,
            idle: 10000
        },
        logging: false
    };

    if (opt.migrationTable) {
        migrationTableName = opt.migrationTable;
    }

    if ( opt.dbOptions) {
        sequelizeOptions = Object.assign(sequelizeOptions, opt.dbOptions);
    }

    sequelize = new Sequelize(opt.dbName, opt.dbUser, opt.dbPass, sequelizeOptions);

    // remember migration directory in module
    migrationDir = opt.migrationDir;

    umzug = new Umzug({
        storage: 'sequelize',
        storageOptions: {
            sequelize,
            tableName: migrationTableName
        },
        // see: https://github.com/sequelize/umzug/issues/17
        migrations: {
            params: [
                sequelize.getQueryInterface(), // queryInterface
                sequelize.constructor, // DataTypes
                function () {
                    throw new Error('Migration tried to use old style "done" callback. Please upgrade to "umzug" and return a promise instead.');
                }
            ],
            path: opt.migrationDir,
            pattern: /\.js$/
        },
    
        logging: function () {
            console.log.apply(null, arguments);
        },
    });
}



/**
 * execute all necessary db migrations
 * 
 * @return {Promise} resolves on successful (or empty) migrations, rejects on error
 */
function execute() {
    return umzug.pending().then(function (migrations) {
        // "migrations" will be an Array with the names of
        // pending migrations.
        if (migrations && migrations.length) {
            console.log('database is not up to date, will be migrated now ...');
        }
        return umzug.up();
    })
        .then(function (migrations) {
            // "migrations" will be an Array of all executed/reverted migrations.
            if (migrations && migrations.length) {
                let listOfMigrations = migrations.map(m => `  * ${m.file}`).join('\n');
                console.log(`the following migrations have been executed:\n${listOfMigrations}`);
            } else {
                console.log('database structure is up to date, no migrations executed.');
            }
        });
}


/**
 * shows the pending migrations (migrations that are defined in the migrations folder,
 * but are not applied yet according to the info from the migrations table)
 * 
 * @return {Promise} resolves usually ;)
 */
function status() {
    return umzug.pending()
        .then(function (migrations) {
            // "migrations" will be an Array with the names of
            // pending migrations.
            console.log(`pending migrations: ${migrations.map(m => m.file).join(' + ')}`);
        });
}


module.exports = (config) => {

    initSequelize(config);

    return {
        execute,
        status
    }
};