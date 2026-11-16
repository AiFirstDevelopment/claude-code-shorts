# free-disk-space: a Claude Code plugin

Out of disk space on your Mac? It measures where the space went, moves to the Trash only what rebuilds itself, and
asks you one at a time about big files that look safe but might not be.

## Install

```
/plugin marketplace add AiFirstDevelopment/claude-code-shorts
/plugin install free-disk-space@claude-code-shorts
```

Then:

```
/free-disk-space            # measure, show the plan, then act on your OK
/free-disk-space scan only  # just show the plan
```

## What it does

1. **Measures** free space and the usual space hogs: caches, Xcode build output, package caches, old `node_modules`,
   big files.
2. **Sorts** them: **safe** (rebuilds itself: caches, build output, `node_modules` in projects untouched for 30 days)
   and **ask** (big files that might be the only copy: downloads, videos, virtual machines, Docker images).
3. **Acts:** the safe list goes to the Trash on one OK; each "ask" item only on a yes for that item. It never uses
   `rm`, and never touches source code, Documents, Photos, or uncommitted work.
4. **Reports** what moved and the free space. Space comes back when the Trash is emptied, which it offers to do and
   waits for a clear yes.

## Nightly

On your yes it installs a nightly job ([`nightly/`](nightly)): at 3:00 it removes only caches that rebuild
themselves and tool logs older than a week, and logs one line to `~/Library/Logs/free-disk-space-nightly.log`.

The skill is [`skills/free-disk-space/SKILL.md`](skills/free-disk-space/SKILL.md). A real run is in
[`08-free-disk-space`](../../08-free-disk-space).
