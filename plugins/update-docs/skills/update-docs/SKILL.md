---
name: update-docs
description: Bring a project's docs back in line with its code - check each factual claim in the README, other markdown docs and doc comments against the code, fix only the claims that are false or missing, and report each fix with the file and line of code that proves it. Use when the user asks to update, check or fix the docs or README, after a change that may have made the docs wrong, or before a release.
argument-hint: [optional: a branch, commit range or file to check; default is the whole project]
---

# Update the docs

The goal is docs that are **true**, not docs that are longer. Every change you make must point at code.

## 1. Decide what to check

- With an argument (a branch, commit range, or file), check the docs that describe what changed there: read the diff
  first, then every doc that mentions the changed functions, commands, settings, limits or files.
- With no argument, check the whole project: the README, other markdown docs (skip changelogs, journals and dated run
  logs: they record the past on purpose), and doc comments on exported functions.

## 2. Check each claim against the code

- Go through the docs one factual claim at a time: a command, a file path, a setting or environment variable, a
  default, a number (a limit, a size, a timeout, a count), a model name, an endpoint, a step in a flow.
- For each one, find the code that decides it and read it. Don't trust another doc, a comment or a name: the code is
  the source of truth. Run a command only if it's safe and fast (`--help`, a dry run, the test command).
- Mark each claim **true**, **false** (the code does something else), **gone** (the code no longer exists), or
  **missing** (the code does something important the docs never mention, such as a new required setting).

## 3. Fix only what's wrong

- Change the false and gone claims to what the code does now, in the doc's own voice and format. Add a missing one only
  if a reader would get stuck without it (a required setting, a new command), in the place they'd look for it.
- Don't rewrite true sentences, reorder sections, or add marketing. Small, exact edits, so the diff is easy to review.
- If the code looks wrong and the doc looks right, don't "fix" the doc: say so in the report. That may be a bug.

## 4. Report

- A list of every fix: what the doc said, what it says now, and the file and line of code that proves it.
- Anything you couldn't check (it needs credentials, a deployed service, or a person's knowledge), and any place where
  the code, not the doc, looks wrong.
- How many claims you checked and how many were already true. Don't commit unless asked.
