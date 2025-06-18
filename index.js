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
const { Umzug } = require('umzug');
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

/** @type {import("umzug").Umzug} */
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
 * @param {function|boolean} [opt.logging] - Your logger of choice. This is called like the inbuilt `console.log()` method.
 *      If it is strictly `true`, the inbuilt `console.log()` will be used, otherwise nothing will be logged
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
    if ('logging' in opt && typeof opt.logging !== 'function' && typeof opt.logging !== 'boolean') {
        throw new TypeError('Property "opt.logging" has to be a function or boolean');
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

        logging: opt.logging || (opt.logging === true && function () {
            console.log.apply(null, arguments);
        })
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
 * @return {Promise<import("umzug").MigrationMeta[]>} resolves on successful migrations with the executed migrations (or non if non were executed), rejects on error
 * @see needsDowngrade
 * @see umzug.up
 */
function execute(options) {
    let prom;
    if (options && options.ignoreMissingMigrations) {
        prom = umzug.up();
    } else {
        prom = needsDowngrade().then((result) => {
            if (!result.length) {
                return umzug.up();
            } else {
                return Promise.reject(
                    `There are recorded migrations but the corresponding files were not found. ` +
                    `You probably need to downgrade! Missing migration files: [${result
                        .map((m) => m.name)
                        .join(", ")}]`
                    );
            }
        });
    }
    return prom.then(fixMigrationPath);
}

/**
 * Returns the pending migrations (migrations that are defined in the migrations folder,
 * but are not applied yet according to the info from the migrations table)
 *
 * @return {Promise<import("umzug").MigrationMeta[]>} - The pending migrations
 */
function needsUpdate() {
    // directly return the pending migrations
    return umzug.pending().then(fixMigrationPath);
}

/**
 * Checks if there are registered migrations that do not exist on disk.
 * @return {Promise<import("umzug").MigrationMeta[]>} - the missing migrations as array in a resolved promise
 */
function needsDowngrade() {
    return umzug
        .executed()
        .then(fixMigrationPath)
        .then((migrations) => {
            if (migrations && migrations.length) {
                migrations = migrations.filter(
                    (m) => !m.path || !fs.existsSync(m.path)
                );
                return migrations;
            } else {
                return [];
            }
        });
}

/**
 * Fix the set path on Migration instances to point to the correct path
 * @param {import("umzug").MigrationMeta[]} migrations
 * @return {import("umzug").MigrationMeta[]}
 */
function fixMigrationPath(migrations) {
    if (!migrations) return migrations;
    if (!Array.isArray(migrations)) migrations = [migrations];

    return migrations.map((migration) => {
        // check if it has the required properties
        if (migration.file && migration.path)
            migration.path = path.resolve(migrationDir, migration.file);

        return migration;
    });
}

// directly return init func to pull JSDoc with it
module.exports = init;
