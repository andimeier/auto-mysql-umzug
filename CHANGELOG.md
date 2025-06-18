# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-06-18

### Breaking

- Update `umzug@3.8.2` (from version 2) and `sequelize@6.37.7` (from version 5). Please see their migration guides.

## [0.0.8] - 2019-07-02

### Changed

- While initializing the parameter `opt.logging` is no longer mandatory and now also accepts `false` and `true`.
  If `true`, it logs with `console.log`. Otherwise (`false` or not provided), logging is turned off.

## Fixed

- Inconsistent return value from `needsDowngrade()`
- The returned [`umzug.Migration`](https://github.com/sequelize/umzug/blob/master/src/migration.js) instances had an incorrect path
- `execute()` doesn't expect an object anymore, even if it were empty
- `needsDowngrade()` doesn't return all migration files every time anymore

## [0.0.6] - 2019-05-24

### Added

- Changelog file
- Options for a custom file pattern and logging to the initializer function
- Function `needsDowngrade` to check for a probably missed database downgrade

### Changed

- Function `execute` checks for a probably missed downgrade via `needsDowngrade` and rejects the promise if a downgrade is probably needed
- A parameter to function `execute` to disable downgrade checking: `options.ignoreMissingMigrations`
- No function now logs directly to `console.log`
- Readme to reflect changes and provide more details to the provided API

### Breaking Changes

- Renamed function `status` to `needsUpdate` and it now returns the files instead of logging them
- Function `execute` returns the executed migrations in the resolved promise, or an empty array if none were executed

## [0.0.5] - 2019-05-13

### Changed

- Updated Readme to describe the parameters passed to each migration methods

## [0.0.4] - 2019-05-10

### Changed

- Updated Readme

## [0.0.3] - 2019-05-07

### Changed

- Function `execute` returns a boolean, if at least one migration was executed

## [0.0.2] - 2019-05-06

Initial Release
