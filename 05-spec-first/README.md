# A real run of the spec-first plugin

The plugin is in [`plugins/spec-first`](../plugins/spec-first), with how to install it and how a skill and a plugin
differ. This folder is one real run of it, on the URL shortener from [`01-walk-away`](../01-walk-away).

```sh
claude -p "/spec-first Add a way to change a link's url." --plugin-dir plugins/spec-first --permission-mode acceptEdits --allowedTools "Bash(npm test)"
```

1. **Rules and tests, then it stopped.** It added ten rules to [`run/TASK.md`](run/TASK.md), five marked
   `(assumed)` (PUT and 200, admins only, the key checked first, visit counts kept, 409 for a url that already has a
   code), wrote [`run/update.test.js`](run/update.test.js), ran it to show it failing, and waited.
2. **"Approved. Build it."** It created `.spec-lock`, added `PUT /links/<code>` to [`run/server.js`](run/server.js),
   and got 15 of 16 tests passing. Then it stopped: the failing test was wrong (it passed `undefined` for "no key",
   so the default admin key was sent). It did not edit the test; it said which test, why, and how to fix it.
3. **"I removed .spec-lock. Fix that test."** It fixed the test, ran the suite (16 of 16 pass) and removed the lock.

A separate check: with `.spec-lock` present, asked to add a comment to the test file, the hook blocked the edit, and
Claude Code reported it and did not try another way.

```sh
cd run && npm test    # 16 passed
```
