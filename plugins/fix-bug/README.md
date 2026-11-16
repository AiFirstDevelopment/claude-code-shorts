# fix-bug: a Claude Code plugin

Describe a bug, or paste the error. It reproduces it with a failing test first, finds the cause, makes the smallest
fix, and proves it: the new test passes and the full suite still does.

## Install

```
/plugin marketplace add AiFirstDevelopment/claude-code-shorts
/plugin install fix-bug@claude-code-shorts
```

```
/fix-bug Searching a document in Greek finds nothing.
```

## What it does

1. **Reproduces** the bug with one failing test, and shows the real failure. No failing test, no fix.
2. **Finds the cause**: the line, and why.
3. **Fixes** it with the smallest change, then runs the new test and the full suite.
4. **Reports** the bug, the cause, the fix, the proof, and anything related it noticed.

The skill is [`skills/fix-bug/SKILL.md`](skills/fix-bug/SKILL.md). A real run is in [`09-fix-bug`](../../09-fix-bug).
