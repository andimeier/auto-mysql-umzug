# auto-mysql-umzug

This lib is a small wrapper around the migration lib [umzug](https://www.npmjs.com/package/umzug). 
It's intention is to integrate *umzug* as easy as possible into a node backend.
The main use case is to provide an easy way to perform necessary database migrations automatically on 
startup of a node backend.

## Installation

Install it like this:

    npm install --save auto-msyql-umzug

## Basic usage

In your node backend application, call the *execute* method on startup and only after the method's returned promise
is resolved, continue starting up your application. 

The execute method will return a Promise. It resolves into a Boolean indicating if any migration had to be executed. So the possible resolutions of the returned Promise are:

* resolved: `true` ... database has not been up to date, at least one migration was actually executed
* resolved: `false` ... database has already been up to date, no migratio executed
* rejected ...  an error occurred

Usage example:

```js
// before starting the app, perform database migration steps, if any
const migrate = require("auto-mysql=umzug")({
    dbName: DB_DATABASE,
    dbUser: DB_USER,
    dbPass: DB_PASSWORD
  });
  
  // migrate db if it is not up to date
  migrate.execute()
    .then(() => {
      logger.info(`migration was successful`);
      startApp(); // at this point - after successful migration - start your application
    })
    .catch(err => {
      logger.error(`error at migration: ${err}`);

      // don't start application
      process.exit(1);
    });
```

## Configuration

You can pass a config object to the lib. It *must* contain the database credentials (`dbName`, `dbUser`, `dbPass` and optional additional options). Additionally, the option `migrationDir` can be included to

The database table in which the installed migrations are being tracked, is called `_migrations`.

The possible options are:

* `dbName` ... name of the database
* `dbUser` ... username of the database user. User must have the necessary privileges to alter the database. For instance, the user must be allowed to create the migrations metadata table - and every migration you will create.
* `dbPass` ... password of the database user
* `dbOptions` ... an object containing additional database options. These options are passed through to [Sequelize](https://github.com/sequelize/sequelize) backend, so all options which are understood by *Sequelize*'s options property for the constructor are possible.
* `migrationDir` ... folder containing the migration files associated with the software version (see [umzug](https://www.npmjs.com/package/umzug) for details on migration files). It can be an absolute or relative path. In case of a relative path, it will be resolved relative to the application's main folder (`path.dirname(require.main.filename)`).  set the name of the directory which contains the migration files. If not set, the default name for the migration folder is `migrations`.
* `migrationTable` ... name of the table which stores the executed migrations. Default is `_migrations`.

## Mysql driver

Since the used [Sequelize](https://github.com/sequelize/sequelize) driver for using the mysql database relies on [mysql2](https://www.npmjs.com/package/mysql2) as mysql lib, you should use *mysql2* as a Mysql module for your application too. In most cases, this should not really be a problem because *mysql2* is mostly compatible to [mysql](https://www.npmjs.com/package/mysql).
