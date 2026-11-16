# commit-and-pr: a Claude Code plugin

Writes the commit message and the pull request description from your actual changes, in your repository's own
style, and shows you both before anything leaves your machine.

## Install

```
/plugin marketplace add AiFirstDevelopment/claude-code-shorts
/plugin install commit-and-pr@claude-code-shorts
```

Then, with changes in your working tree:

```
/commit-and-pr
```

Opening the pull request needs GitHub's command-line tool (`gh`), signed in once with `gh auth login`.

## What it does

1. Reads every change (`git diff`), and your last 15 commit messages (`git log`), so it writes in your style.
2. Writes the commit message: a subject under 72 characters saying what the change does, and a body saying why.
3. Writes the pull request description: what, why, how it was tested, and anything a reviewer should look at.
4. Shows you both, commits only the files that belong to the change, and pushes and opens the pull request only when
   you say so.

The skill is [`skills/commit-and-pr/SKILL.md`](skills/commit-and-pr/SKILL.md). A real run is in
[`06-commit-and-pr`](../../06-commit-and-pr).
