# ci-failure

A Claude Code plugin for the question "why did CI fail?", with one subagent and one skill:

- **The subagent** (`agents/ci-failure.md`) reads the failed job's logs and the code in its own, separate context,
  and hands back a few lines: the error, the cause with file and line, and whether it's the change, a flaky test or
  the CI environment. Thousands of lines of logs never enter your conversation.
- **The skill** (`/why-ci-failed`) is the procedure: work out which run, hand it to the subagent, show the answer.

## Skills vs subagents

| | A skill | A subagent |
|---|---|---|
| What it is | Instructions, loaded into the conversation you're in | A separate Claude with its own context window and tools |
| What it sees | Everything your conversation has seen | Not your conversation: only what it's handed and what it reads |
| What it costs your context | Everything it reads stays in your conversation | Only its final answer comes back |
| Use it for | A procedure you want followed the same way every time | Big, noisy reading (logs, searches) whose result is all you need |

They work together: `/why-ci-failed` is a skill whose procedure is to hand the job to the subagent.

## Install

```
/plugin marketplace add AiFirstDevelopment/claude-code-shorts
/plugin install ci-failure@claude-code-shorts
```

You need the [GitHub CLI](https://cli.github.com) (`gh`), signed in. Or copy `agents/ci-failure.md` into your
project's `.claude/agents/`.

## Use

In the repository, on the branch that failed:

```
/why-ci-failed
/why-ci-failed 1234
/why-ci-failed https://github.com/owner/repo/actions/runs/123456
```

A real run is in [`12-ci-failure`](../../12-ci-failure).
