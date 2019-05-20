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

/** */
const Umzug = require('umzug');
const Sequelize = require('sequelize');
const path = require('path');
const fs = require('fs');

// default values for options

let migrationTableName = '_migrations';
let migrationDir = 'migrations'; // default

let dbOptions = {
    dialect: 'mysql',

    pool: {
        max: 5,
        min: 0,
        idle: 10000
    },
    logging: false
};

let umzug;
let sequelize;

/**
 * Initialize auto-mysql-umzug
 *
 * @param {object} opt - config object
 * @param {string} opt.dbName - The name of the database
 * @param {string} opt.dbUser - The user that can create tables and edit them and do whaterver you want to do in the
 *      migration files
 * @param {string} opt.dbPass - The password for the user
 * @param {string} [opt.migrationDir] - Optionally a different migration directory. Defaults to `migrations`
 * @param {string} [opt.migrationTable] - The table to store the executed migrations. Defaults to `_migrations`
 * @param {RegExp} [opt.filePattern] - The pattern to search for files in the migrations directory. Defaults to `/\.js$/`
 * @param {function} [opt.logging] - Your logger of choice. This is called like the inbuilt `console.log()` method.
 *      If not specified, the inbuilt `console.log()` will be used
 * @param {object} [opt.dbOptions] - Any options to pass to Sequelize's constructor
 */
function init(opt) {

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
    if (typeof opt.logging !== 'function') {
        throw new TypeError('Property "opt.logging" has to be a function');
    }

    // overwrite default options

    migrationDir = path.resolve(path.dirname(require.main.filename), (opt.migrationDir || migrationDir));

    dbOptions = Object.assign(dbOptions, (opt.dbOptions || {}));

    if (opt.migrationTable) {
        migrationTableName = opt.migrationTable;
    }

    // setup migrations storage backend

    sequelize = new Sequelize(opt.dbName, opt.dbUser, opt.dbPass, dbOptions);

    // setup Umzug

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
            path: migrationDir,
            pattern: opt.filePattern || /\.js$/
        },

        logging: opt.logging || function () {
            console.log.apply(null, arguments);
        }
    });


    return {
        execute,
        needsUpdate,
        needsDowngrade,
        umzug       // to ease making a project specific downgrade module
    };
}


/**
 * Execute all necessary db migrations
 * Also checks, if a possible downgrade is needed
 *
 * @param {object} [options] - Some options to configure
 * @param {boolean} [options.ignoreMissingMigrations] - If `true`, it won't check for missing but already executed migration files
 * @return {Promise<Migration[]>} resolves on successful migrations with the executed migrations (or non if non were executed), rejects on error
 * @see needsDowngrade
 * @see umzug.up
 */
function execute(options) {
    let prom;
    if (options.ignoreMissingMigrations) {
        prom = umzug.up();
    } else {
        prom = needsDowngrade()
            .then((result) => {
                if (result === false) {
                    return umzug.up();
                } else {
                    return Promise.reject(`There are recorded migrations but the corresponding files were not found. ` +
                        `You probably need to downgrade! Missing migration files: [${result.map((m) => m.file).join(', ')}]`);
                }
            });
    }
    return prom;
}


/**
 * Returns the pending migrations (migrations that are defined in the migrations folder,
 * but are not applied yet according to the info from the migrations table)
 *
 * @return {Promise<Migration[]>} - The pending migrations
 */
function needsUpdate() {
    // directly return the pending migrations
    return umzug.pending((migrations) => {
        if (!migrations || !migrations.length) {
            migrations = [];
        }
        return migrations;
    });
}

/**
 * Checks if there are registered migrations that do not exist on disk.
 * @return {Promise<Migration[]>} - the missing migrations as array in a resolved promise
 */
function needsDowngrade() {
    return umzug.executed()
        .then((migrations) => {
            if (migrations && migrations.length) {
                migrations = migrations.filter((m) => !fs.existsSync(m));
                return migrations.length ? migrations : false;
            } else {
                return [];
            }
        });
}

// directly return init func to pull JSDoc with it
module.exports = init;
