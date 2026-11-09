## Context

The current Bun lockfile resolves `fast-uri@3.1.8` through `serve -> ajv` and `picomatch@2.3.1` through the Tailwind CLI's file-watching dependency chain. A full Snyk scan also identifies `minimatch@3.1.5` through `serve -> serve-handler`. `serve-handler` pins that version and calls the older function-style API; Snyk's listed `11.0.1` fix is a major-version change and cannot be safely forced without changing its caller. The `serve` CLI is used only by the development watcher to preview files in `samples/`.

## Goals / Non-Goals

**Goals:**

- Resolve `fast-uri` and `picomatch` to versions that are outside the affected advisory ranges.
- Remove the `serve` dependency path and preserve sample preview behavior with a small Bun server bound to loopback and restricted to regular files in `samples/`.
- Keep `package.json` and `bun.lock` consistent and reproducible with the repository's Bun workflow.
- Verify the resulting dependency tree with Snyk without a severity threshold.

**Non-Goals:**

- Upgrade unrelated dependencies or runtime/container images.
- Change extension behavior or add application-level security features.
- Claim the affected development-tool dependency code paths are exploitable in the published extension.

## Decisions

- Use the existing package manager and lockfile workflow to select fixed compatible versions. Prefer updating existing package overrides or dependency constraints where needed, then regenerate `bun.lock`. This is more reproducible than manually editing locked package records.
- Replace `serve` with Bun's native HTTP server rather than forcing an incompatible minimatch major version into `serve-handler`. Bind to `127.0.0.1` and serve only regular files in `samples/`.
- Keep dependency changes limited to the reported paths; review lockfile regeneration and avoid unrelated churn.
- Validate the resolved versions directly and run `snyk test --dev` without a severity threshold, plus the relevant build/test checks. This ensures medium findings are not hidden by the CI workflow's current `--severity-threshold=high` option.
- Add `dependency-security` requirements for fixed lockfile resolutions and preserved local sample-preview behavior.

## Risks / Trade-offs

- [The transitive parent pins an affected minimatch version] → Remove the development-only server dependency rather than forcing an incompatible minimatch major version; verify the sample server remains usable.
- [A custom local server could expose paths beyond the sample directory] → Bind only to loopback, restrict requests to direct regular files in `samples/`, and test traversal/unknown-path rejection.
- [Lockfile regeneration may cause unrelated version churn] → Review the diff and retain only changes required for the fixes.
- [Snyk's advisory database can change] → Record the scan result at implementation time and verify current advisories rather than assuming a clean scan from the earlier high-threshold result.

## Migration Plan

No runtime migration is required. Replace the development-only sample server, update dependency constraints/resolutions, and regenerate the lockfile. Rollback consists of reverting those dependency, server, and lockfile changes if validation fails.

## Open Questions

None.
