# write-tests: a Claude Code plugin

Writes the tests for your change, in your project's own style, and proves each one can fail: it breaks the changed
code for a moment, checks the test catches it, then puts the code back. It never changes your code to make a test
pass.

## Install

```
/plugin marketplace add AiFirstDevelopment/claude-code-shorts
/plugin install write-tests@claude-code-shorts
```

Then, with a change in your working tree (or just committed):

```
/write-tests
```

## What it does

1. Reads your change (`git diff`) and your existing tests, so new tests use the same framework, place and style.
2. Writes a test for each thing the change does, then the edge cases and bad input around it.
3. Runs them: all must pass. Then, for each one, breaks the changed code on purpose and checks the test fails, and
   puts the code back. A test that can't fail is rewritten or dropped.
4. Lists each test, what it guards, and the break that proved it.

The skill is [`skills/write-tests/SKILL.md`](skills/write-tests/SKILL.md). A real run is in
[`07-write-tests`](../../07-write-tests).
