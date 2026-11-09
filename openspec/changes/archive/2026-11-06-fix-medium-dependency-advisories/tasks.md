## 1. Update Vulnerable Dependency Resolutions

- [x] 1.1 Update dependency constraints or overrides so `fast-uri` resolves outside the affected range and regenerate `bun.lock`.
- [x] 1.2 Update dependency constraints or overrides so `picomatch` resolves outside the affected range and regenerate `bun.lock`.
- [x] 1.3 Replace the `serve` dependency with a loopback-only Bun server for sample files.
- [x] 1.4 Regenerate `bun.lock`, review dependency changes for unrelated churn, and confirm the locked dependency versions are outside the affected ranges.

## 2. Verify Dependency Security and Build

- [x] 2.1 Run an authenticated `snyk test --dev` without a HIGH-only threshold in a clean install and confirm the reported advisories are cleared.
- [x] 2.2 Run the production build and relevant tests to verify the dependency updates do not regress the project.
- [x] 2.3 Verify the development watcher serves sample files on loopback and rejects paths outside `samples/`.
