---
name: why-ci-failed
description: Find out why CI failed on a pull request, branch or run, without filling this conversation with logs. Use when the user says CI failed, a check is red, a GitHub Actions run failed, or asks why a build broke.
argument-hint: [run URL or id, PR number, or nothing for this branch's latest failed run]
---

# Why did CI fail?

1. Work out which run: the URL, id or pull request the user gave, else the latest failed run for the current branch.
2. Hand it to the `ci-failure` subagent with the repository and the run, and nothing else. Don't read the logs
   yourself: keeping them out of this conversation is the point.
3. Show its answer as it returned it. If it names a fix, offer to make it; don't make it unasked.
