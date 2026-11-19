# fresh-eyes

A Claude Code plugin with one subagent and one skill:

- **The subagent** (`agents/fresh-eyes.md`) reviews a change in its own, fresh context. It gets only the task and the
  change, never the conversation that wrote the code, so it can't share the builder's assumptions. It checks every
  rule in the task, not just the tested ones, with file and line, and runs what it can to prove it. It changes nothing.
- **The skill** (`/fresh-eyes`) is the procedure: find the task and the diff, hand only those to the subagent, show
  what it found.

## Skills vs subagents

| | A skill | A subagent |
|---|---|---|
| What it is | Instructions, loaded into the conversation you're in | A separate Claude with its own context and tools |
| What it sees | Everything your session has seen | Only what it is handed |
| What comes back | Its work happens in your conversation | One report |
| Use it for | A procedure you want followed the same way every time | Work that should be independent, or would flood your context |

## Install

```
/plugin marketplace add AiFirstDevelopment/claude-code-shorts
/plugin install fresh-eyes@claude-code-shorts
```

Or copy `agents/fresh-eyes.md` into your project's `.claude/agents/`.

## Use

After Claude Code finishes a change:

```
/fresh-eyes
/fresh-eyes docs/TASK.md
```

A real run is in [`12-fresh-eyes`](../../12-fresh-eyes).
