# The answer, through the ci-failure subagent

`/why-ci-failed https://github.com/vitejs/vite/actions/runs/44071914318`

**Run 44071914318** (CI, PR branch `fix/lockfile-hash-patches-mtime`, commit df48940): all 6 `Build&Test` jobs fail at step "Test unit" on every OS and Node version; Lint passes.

**Error:** 1 of 79 test files fails, in the test this PR adds, `hash changes when a patch file is edited in place`, at `lockfileHash.spec.ts:46`:
`AssertionError: expected 'e3b0c442' not to be 'e3b0c442'`

**Cause:** the PR's own test fixture is incomplete, so the new code is never reached.
- `e3b0c442` is the hash of an empty string, which means `getLockfileHash` found no lockfile at all.
- The new fixture `yarn-patches/` contains only `patches/foo+1.0.0.patch` and no lockfile.
- With no lockfile, `content` is `''` and the `if (lockfilePath)` block at `packages/vite/src/node/optimizer/index.ts:1354` is skipped, so the new patch-file mtime loop (lines 1372-1378) never runs.
- Adding a `yarn.lock` alone would not fix it: that format has `checkPatchesDir: false` (`index.ts:1297-1299`).

**Kind:** the change itself. It is deterministic, not flaky or environmental; the identical assertion appears in five jobs' logs.

**Next step:**
- Add a lockfile whose format has `checkPatchesDir: 'patches'` to the fixture, e.g. `bun.lock` or `node_modules/.package-lock.json`. A `node_modules/` path may need a `.gitignore` exception, as the `yarn-state` fixture has.
- Once the loop runs, the test may become timing-sensitive: it compares `mtimeMs` across an immediate rewrite, which can be equal on coarse-timestamp filesystems. Setting the mtime explicitly with `fs.utimesSync` would avoid that. The subagent did not run this.

**Side note (node-20 job only):** the same test fails there, but the reporter then crashes with `TypeError: Map.groupBy is not a function` inside vitest 5.1.0, hiding the assertion. That is a secondary reporter crash, not the cause.
