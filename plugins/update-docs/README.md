# update-docs

A Claude Code skill that checks every claim in your README and doc comments against the code, fixes the ones that are
no longer true, and shows you the line of code that proves each fix.

## Install

```
/plugin marketplace add AiFirstDevelopment/claude-code-shorts
/plugin install update-docs@claude-code-shorts
```

## Use

Start Claude Code in your project's folder, then:

```
/update-docs                  # the whole project
/update-docs main..my-branch  # only what a branch changed
```

It edits the docs in place and doesn't commit, so you review the diff first. A real run is in
[`10-update-docs`](../../10-update-docs).
