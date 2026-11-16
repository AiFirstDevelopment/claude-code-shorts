---
name: commit-and-pr
description: Write the commit message and the pull request description from the changes in the working tree, in the repository's own style, then commit, and open the pull request when the user says so. Use when the user asks to commit, to write a commit message, to open a pull request, or to write a PR description.
argument-hint: [optional: a ticket number or a note on why]
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git branch:*), Bash(git add:*), Bash(git commit:*), Bash(npm test:*), Bash(npx vitest:*)
---

# Commit message and pull request description

## 1. Read what changed, and how this repository writes commits

- `git status` and `git diff` (and `git diff --staged`): every change, including new files.
- `git log -15 --format='%s%n%b'`: how this repository's commit messages look. Match it: the length of the subject,
  whether it starts with a ticket number or a type like `fix:`, whether there is a body. If the user gave a ticket
  number, use it the way the log does.
- Read enough of the changed code to say **why** the change was made, not just what lines moved.
- Run the project's tests (find the command in package.json, Makefile or the README) so the description can say
  what passed. If they can't be run, say so in the description.

## 2. The commit message

- **Subject:** one line, under 72 characters, in the log's style, saying what the change does
  (`Search: match words across -ing and -ed endings`, not `update retrieval.ts`).
- **Body**, if the change needs it: why it was needed, and anything a reviewer would otherwise have to work out.
- Nothing else: no credit lines, no tool names, no "Co-Authored-By", no "Generated with" line.

## 3. The pull request description

- **What:** one or two sentences on what the change does.
- **Why:** the problem it solves.
- **How it was tested:** the tests added or run, and what they show. If nothing was tested, say so.
- **Anything to look at:** a risky part, a choice a reviewer might question.
- Nothing else: no credit lines, no tool names, no "Generated with" line. The description is the author's.

## 4. Show, then act

Show the user the commit message and the description. Then:

- **Commit** only the files that belong to this change (`git add` them by name, never `git add -A` with unrelated
  files in the tree), with that message.
- **Push and open the pull request** only when the user says so, since that leaves their machine: on a new branch if
  they're on the main branch, with `gh pr create --title <subject> --body <description>`.
