# auto-mysql-umzug

This lib is a small wrapper around the migration lib [umzug](https://www.npmjs.com/package/umzug). 
It's intention is to integrate *umzug* as easily as possible into a node backend.
The main use case is to provide an easy way to perform necessary database migrations automatically on 
startup of a node backend.

## Installation

Install it like this:

    npm install --save auto-msyql-umzug

## Basic usage

In your node backend application, call the `execute` method on startup and only after the method's returned promise
is resolved, continue starting up your application. 

The `execute` method will return a Promise. It resolves into an array indicating if any migration had to be executed. So the possible resolutions of the returned Promise are:

* resolved: Array of [`umzug.Migration`](https://github.com/sequelize/umzug/blob/master/src/migration.js) ... database has not been up to date, at least one migration was actually executed
* resolved: Empty array ... database has already been up to date, no migration executed
* rejected: ...  an error occurred

Usage example:

```js
// before starting the app, perform database migration steps, if any
const migrate = require('auto-mysql-umzug')({
    dbName: DB_DATABASE,
    dbUser: DB_USER,
    dbPass: DB_PASSWORD
  });
  
// migrate db if it is not up to date
migrate.execute()
  .then((executedMigrations) => {
    if (executedMigrations.length) {
      console.log('migration was successful');
    } else {
      console.log('no migration necessary');
    }

    startApp(); // at this point - after successful migration - start your application
  })
  .catch(err => {
    console.log(`error at migration: ${err}`);

    // don't start application
    process.exit(1);
  });
```

## Configuration

You can pass a config object to the lib. It *must* contain the database credentials (`dbName`, `dbUser`, `dbPass` and optional additional options).

The possible options are:

| Option | Type | Default | Required | Description |
|---|---|---|---|---|
| `dbName` | `string` | | &#10004; | Name of the database |
| `dbUser` | `string` | | &#10004; | Username of the database user. User must have the necessary privileges to alter the database. For instance, the user must be allowed to create the migrations metadata table - and every migration you will create. |
| `dbPass` | `string` | | &#10004; | Password of the database user |
| `dbOptions` | `object` | | &#10060; | An object containing additional database options. These options are passed through to [Sequelize](https://github.com/sequelize/sequelize) backend, so all options which are understood by *Sequelize*'s options property for the constructor are possible (see [here](http://docs.sequelizejs.com/class/lib/sequelize.js~Sequelize.html#instance-constructor-constructor)). |
| `migrationDir` | `string` | `"migrations"` | &#10060; | Folder containing the migration files associated with the software version (see [umzug](https://www.npmjs.com/package/umzug) for details on migration files). It can be an absolute or relative path. In case of a relative path, it will be resolved relative to the application's main folder (`path.dirname(require.main.filename)`).  set the name of the directory which contains the migration files. Default is `migrations`. |
| `migrationTable` | `string` | `"_migrations"` | &#10060; | Name of the table which stores the executed migrations. Default is `_migrations`. |
| `filePattern` | `RegExp` | `/\.js$/` | &#10060; | Regular expression to search for migration files in `migrationDir` |
| `logging` | `function` | `console.log` | &#10060; | Function that logs its arguments. It is called like the inbuilt function `console.log` |

## API after initialization

The initialization function returns an object with the functions `execute`, `needsUpdate`, `needsDowngrade`, and the initialized umzug library itself as `umzug`

### execute
##### Definition
```
execute(options?: object): Promise<umzug.Migration[]>
```
##### Parameters
| Parameter | Type | Default | Required | Description |
|---|---|---|---|---|
| `options.ignoreMissingMigrations` | `boolean` | `false` | &#10060; | If true, the function `needsDowngrade` is not called and therefore it is not checked, if there are missing but already executed migration files |
##### Returns
A promise that resolves into an array of the executed [`umzug.Migration`](https://github.com/sequelize/umzug/blob/master/src/migration.js), or an empty array if none were executed. If `options.ignoreMissingMigrations` is false and there are some missing migration files, then a rejected Promise is returned with a string stating that problem and it contains the filenames of the missing migration files. 
##### Description
Checks for any possible downgrades with the function `needsDowngrade` and then executes any possible migrations with [`umzug.up()`](https://www.npmjs.com/package/umzug#executing-pending-migrations).

### needsUpdate
##### Definition
```
needsUpdate(): Promise<umzug.Migration[]>
```
##### Returns
A promise that resolves into an array of the pending [`umzug.Migration`](https://github.com/sequelize/umzug/blob/master/src/migration.js), or an empty array if none are pending
##### Description
This is just a wrapper for [`umzug.pending()`](https://www.npmjs.com/package/umzug#getting-all-pending-migrations).

### needsDowngrade
##### Definition
```
needsDowngrade(): Promise<umzug.Migration[]>
```
##### Returns
A promise that resolves into an array of the missing but already executed [`umzug.Migration`](https://github.com/sequelize/umzug/blob/master/src/migration.js), or an empty array if no executed migration is missing
##### Description
This function retrieves all executed migrations and checks if they also exist on disk. Usually when there is at least one missing, a version downgrade of your application happened, as the newer migrations are not included in the earlier application version.
### umzug
This is the [umzug](https://www.npmjs.com/package/umzug) library on its own. The main intention is to enable an easier downgrade module that is specific to your application. So you don't need to initialize umzug separately, making this wrapper nearly useless.

## Migration files

The migrations folder (default: folder `migrations/`) contains the migration files. Each migration file is a Javascript file which ideally contains an up and a down method, which represent a function which achieves the task and a function that reverts a task. See [umzug:migration files:format](https://www.npmjs.com/package/umzug#format) for details.

Note that the migration files are executed in the order of their filenames (sorted alphabetically). So, make sure that you either use a fixed-length numeric prefix or a timestamp (in a specific format).

When missing migrations are detected, all missing migrations are executed in the alphabetic order of their filenames.

Examples of migration file filenames are:

    001-create-user-table.js
    002-add-some-columns.js
    003-other-things.js

or:

    2019-05-10_153731-create-user-table.js
    2019-05-12_164004-add-some-columns.js
    2019-05-13_081445-other-things.js

Whatever you choose, be sure to stick to your chosen nomenclature consistently to ensure that the sort order is as intended.

The arguments to the migration methods (`up()` and `down()`) are configured in this lib using Umzug's `migrations.params` property. All properties listed under `migrations.params` are passed to the migration files' methods. In this case, each migration method will be called with two parameters:

* `query` ... Sequelize's query object (which is what `Sequelize.getQueryInterface()` returns), see [Sequelize/QueryInterface](http://docs.sequelizejs.com/class/lib/query-interface.js~QueryInterface.html) for the API
* `DataTypes` ... Sequelize's constructor, see [Sequelize/DataTypes](http://docs.sequelizejs.com/variable/index.html#static-variable-DataTypes) for a description of Sequelize's data types



## Mysql driver

Since the used [Sequelize](https://github.com/sequelize/sequelize) driver for using the mysql database relies on [mysql2](https://www.npmjs.com/package/mysql2) as mysql lib, you should use *mysql2* as a Mysql module for your application too. In most cases, this should not really be a problem because *mysql2* is mostly compatible to [mysql](https://www.npmjs.com/package/mysql).
