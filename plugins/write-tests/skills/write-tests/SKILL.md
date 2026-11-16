---
name: write-tests
description: Write the tests for the change in the working tree, in the project's own test framework and style, then prove each new test can fail by temporarily breaking the changed code. Use when the user asks to write tests, add tests for a change, or test what they just changed.
argument-hint: [optional: what the change is for]
---

# Write the tests for this change

## 1. Read the change and the existing tests

- `git diff` (and `git diff --staged`): what changed. If nothing is uncommitted, use the last commit (`git show`).
- Find the project's tests: the test command (package.json, Makefile, pyproject, the README), the folder, the
  framework, and how existing tests are named and written. New tests go in the same place, in the same style.

## 2. Write the tests

- One test for each thing the change does, named for the behavior ("a curly apostrophe matches a straight one"),
  not the function.
- Then the edges around it: empty input, the boundary values, bad input, and anything the change could have broken
  that worked before.
- Test what the code does (its output for an input), not how it is written inside.

## 3. Run them, then prove each one can fail

1. Run the test command. Every new test must pass on the code as it is.
2. For each new test, break the changed code on purpose, in the smallest way that should make that test fail
   (undo the change, flip a condition, return early), run the test, and confirm it fails. Then put the code back
   exactly as it was, and confirm the tests pass again.
3. A test that still passes with the code broken guards nothing: rewrite it so it fails, or remove it and say so.

Never leave a deliberate break in the code, and never change the code to make a test pass. If a test shows a real
bug in the change, stop and report it.

## 4. Report

List each new test, what it guards, and the break that made it fail. Then the test command's final result. Don't
commit unless the user asks.
