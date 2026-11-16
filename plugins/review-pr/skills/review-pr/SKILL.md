---
name: review-pr
description: Review a pull request or merge request from its link - read the description, the diff and the code around it, and report bugs, security problems, missing tests and mismatches with the description, worst first, with file and line. Use when the user pastes a GitHub pull request link (github.com/.../pull/N) or a GitLab merge request link (gitlab.../-/merge_requests/N), or asks to review a PR or MR.
argument-hint: [link to the pull request or merge request]
allowed-tools: Bash(gh pr view:*), Bash(gh pr diff:*), Bash(gh api:*), Bash(glab mr view:*), Bash(glab mr diff:*), Bash(curl -sL:*)
---

# Review a pull request

Review the pull request (GitHub) or merge request (GitLab) at the link the user gave. Read it; do not change it.

## 1. Get the description and the changes

Use the first of these that works, and say which one you used:

- **GitHub, with the `gh` tool** (works for private repositories once `gh auth login` has been run):
  `gh pr view <link> --json title,body,author,baseRefName,headRefName,files` and `gh pr diff <link>`.
- **GitLab, with the `glab` tool** (after `glab auth login`): `glab mr view <link>` and `glab mr diff <link>`.
- **A public GitHub pull request, with no tools signed in**: add `.diff` to the link and download it
  (`curl -sL <link>.diff`); read the description from the page.
- **The Claude in Chrome extension**, if it is connected and the user is signed in to GitHub or GitLab in Chrome:
  open the link in a new tab and read the description and the "Files changed" (GitHub) or "Changes" (GitLab) tab.

If none of these works, stop and tell the user exactly what to set up (one of the above), not a guess.

## 2. Read enough to judge it

- Read the description first: what is this change supposed to do?
- Read the whole diff. For any change whose effect depends on code you can't see in the diff (a function it calls, a
  caller of a function it changes), read that code too: with `gh api` (GitHub contents API), `glab`, or in the tab.
- Note the tests the change adds or changes, and what they would and wouldn't catch.

## 3. Report

Start with one sentence: what the change does, and whether it does what the description says.

Then the findings, **worst first**, each with:

- **where**: `path/to/file:line` (the line in the new version),
- **what**: the problem in one sentence,
- **why it matters**: the input or situation that goes wrong, concretely.

Look for, in this order: bugs (wrong results, crashes, broken edge cases), security problems (injection, secrets,
missing permission checks), changes the description doesn't mention or that contradict it, missing or weak tests for
what changed. Leave out style and formatting unless they hide a bug. If you're not sure something is a problem, say
so and say what would settle it. If you find nothing worth reporting, say that plainly.

End with the number of findings by kind.

## 4. Posting comments

Never post, approve, request changes or comment on the pull request unless the user asks. A comment goes out under
the user's name: when they ask, show the exact comments first and post only after they say yes.
