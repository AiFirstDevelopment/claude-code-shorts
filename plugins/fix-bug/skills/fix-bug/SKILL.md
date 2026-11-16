---
name: fix-bug
description: Fix a bug the user describes or an error they paste - reproduce it with a failing test first, find the root cause in the code, make the smallest fix, and prove it with the new test passing and the full suite still green. Use when the user reports a bug, pastes an error or stack trace, or says something doesn't work.
argument-hint: [what's wrong, or the error message]
---

# Fix a bug

## 1. Reproduce it first

- Restate the bug in one sentence: what happens, and what should happen.
- Find the project's test command and test style. Write **one test that fails because of this bug**, in the project's
  own style, named for the expected behavior. Run it and show that it fails, with the real failure message.
- If you can't make it fail, you haven't found the bug yet. Don't guess at a fix: say what you tried.

## 2. Find the cause

- Follow the failing case into the code until you can point at the line (or lines) that cause it, and say **why** in
  one or two sentences. Name the cause, not the symptom.
- Check whether the same cause breaks anything else nearby, and say so.

## 3. Fix it, smallest change first

- Make the smallest change that fixes the cause. Don't refactor or "improve" anything else.
- Run the new test: it must pass now. Run the full suite: everything else must still pass.

## 4. Report

- The bug in one sentence, the cause (file and line), the fix (what changed), the test that proves it, and the full
  suite's result. Mention anything related you noticed but didn't change. Don't commit unless asked.
