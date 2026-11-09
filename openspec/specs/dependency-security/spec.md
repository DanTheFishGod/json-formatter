## Purpose

Define dependency version and local preview-server security requirements.

## Requirements

### Requirement: fast-uri locked version is not affected by reported advisories
The Bun lockfile SHALL resolve `fast-uri` to a version outside the reported affected range `>=3.0.0 <3.1.9`.

#### Scenario: Locked fast-uri version is fixed
- **WHEN** the dependency lockfile is checked
- **THEN** every resolved `fast-uri` version is at least `3.1.9` or is otherwise outside the reported affected range

### Requirement: picomatch locked version is not affected by reported advisory
The Bun lockfile SHALL resolve `picomatch` to a version outside the reported affected range `<2.3.2` for the 2.x release line.

#### Scenario: Locked picomatch version is fixed
- **WHEN** the dependency lockfile is checked
- **THEN** every resolved `picomatch` 2.x version is at least `2.3.2`

### Requirement: minimatch advisory path is removed from development dependencies
The Bun lockfile SHALL NOT include `minimatch` versions affected by Snyk advisory `SNYK-JS-MINIMATCH-22111072` (`<11.0.1`).

#### Scenario: No affected minimatch version is locked
- **WHEN** the dependency lockfile is checked
- **THEN** it contains no `minimatch` resolution below `11.0.1`

### Requirement: Sample preview server is local and restricted to samples
The development sample preview server SHALL bind only to `127.0.0.1` and SHALL serve regular files from the repository's `samples/` directory.

#### Scenario: Sample files are served locally
- **WHEN** the development watcher starts the sample preview server
- **THEN** a sample file is available over HTTP on `127.0.0.1:8586`

#### Scenario: Paths outside samples are not served
- **WHEN** a request targets a path that does not resolve to a regular file directly under `samples/`
- **THEN** the server returns a not-found response and does not serve the requested path
