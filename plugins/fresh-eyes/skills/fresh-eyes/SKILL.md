---
name: fresh-eyes
description: Get a second opinion on a change from a reviewer that never saw it being written. Use when the user asks for a fresh-eyes review, a second opinion, or to check the work against the task before it ships.
argument-hint: [the task file, if not TASK.md]
---

# Fresh eyes

1. Find the task: the file the user names, else `TASK.md`, else the issue or request the change was for.
2. Find the change: `git diff` against the last commit before the work started (or `git diff main...`), and the list
   of files it touches.
3. Hand both to the `fresh-eyes` subagent, and nothing else: not your reasoning, not what you tried, not what you
   believe is right. Its value is that it doesn't know.
4. Show its report as it returned it. Don't argue with a finding or fix anything unless the user asks.
