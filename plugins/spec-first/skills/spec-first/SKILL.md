---
name: spec-first
description: Build a feature spec-first - write TASK.md as checkable rules (each a request and its answer, plus who is allowed to do what and what must never happen), write the tests that check every rule from the outside, stop for the user's OK, then lock the tests and build until they pass. Use when the user asks to build or add a feature, endpoint, function or behavior and wants it done to a spec, or says "spec first", "write the tests first" or "task file".
argument-hint: [what to build]
---

# Spec first

Build what the user asks for in three steps, and do not skip the stop in step 2.

## 1. The task file

Write (or extend) `TASK.md` in the project root. One line says what is being built; then a list of rules. Every
rule must be something a test can check:

- **A request and its answer.** `POST /links with {"url"} returns 201 and {"code"}`, not "creates links".
- **The format.** `codes are 6 letters or digits`, not "short codes".
- **The errors.** `a url that isn't http or https is 400`.
- **The edge cases.** `the same url always gets the same code`.
- **Who is allowed to do what**, if anyone is not: `only admins remove links: header x-admin-key = ADMIN_KEY, or 403`.
- **What must never happen**, if anything: `links are never deleted from storage`.

Where the user's request leaves a choice open (a status code, a format, who may do it), do not decide silently:
pick the most likely answer, write it as a rule, and mark it `(assumed)` so the user sees it in step 2.

## 2. The tests, then stop

Write the tests that check every rule, in the project's existing test framework and file layout (find them first;
if there are none, use the language's built-in runner, for example `node --test`). Test from the outside: send the
request, check the answer. Do not test private functions or how the code is written inside.

Every rule must have at least one test. Then show the user:

- the rules, with any `(assumed)` ones called out,
- each rule next to the name of the test that checks it,
- the command that runs the tests, and that they fail now because nothing is built yet (run it to show this).

**Stop here and ask the user to approve or change the rules and tests.** Do not write any of the feature until they
say so.

## 3. Lock the tests, then build

When the user approves:

1. Create an empty file `.spec-lock` in the project root. While it exists, this plugin's hook refuses any edit to a
   test file, so the tests cannot be changed to make them pass.
2. Build the feature. Run the tests, read what fails, fix the code, and run them again until every test passes.
3. If a test looks wrong, do not work around it: stop and tell the user which test and why. Only the user removes
   `.spec-lock` to change a test.
4. When all tests pass, delete `.spec-lock`, and report: the number of tests passed, the files changed, and any rule
   that was `(assumed)`.
