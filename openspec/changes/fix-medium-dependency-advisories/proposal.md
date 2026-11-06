## Why

The locked dependency tree contains medium-severity Snyk advisory matches for `fast-uri@3.1.8` and `picomatch@2.3.1`. A full, unfiltered scan also identified `minimatch@3.1.5` through the development-only sample server. Updating the first two versions and removing that sample-server dependency path eliminates these known findings without changing the extension.

## What Changes

- Update the dependency resolutions for `fast-uri` and `picomatch` to versions that include the relevant security fixes.
- Replace the development sample server's `serve` dependency, which pulls in the affected `minimatch`, with a loopback-only Bun server.
- Verify the lockfile no longer resolves affected versions and run an unfiltered dependency audit.

## Capabilities

### New Capabilities

- `dependency-security`: Keep the audited development dependency tree clear of the reported vulnerable versions.

### Modified Capabilities

None.

## Impact

- `package.json` overrides and/or transitive dependency constraints, as appropriate to obtain fixed versions.
- The development sample server in `task/jsonServer.ts`.
- `bun.lock` dependency resolutions.
- Dependency audit and existing build/test validation.
