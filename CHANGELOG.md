# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Changelog file
- Options for a file pattern and logging to the initializer function
- Function `needsDowngrade` to check for a probably missed downgrade

### Changed
- Function `execute` to check for a probably missed downgrade via `needsDowngrade` and rejects the promise if a downgrade is probably needed
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


