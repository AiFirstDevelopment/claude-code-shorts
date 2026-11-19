# The fresh-eyes review, as it came back

**Verdict: 2 rules broken, 1 partly broken, the rest met.** All 13 tests pass (`node --test`), but none cover the failures below; the reviewer found them by probing a running server. No files were changed.

Line references are to `server.js`.

| # | Rule | Verdict | Line | Proof |
|---|------|---------|------|-------|
| 1 | `node:http`, no packages, users in memory | met | 1-3, 54 | Only `node:` imports; `const users = new Map()` |
| 2 | Exports `start(port)` | met | 162 | `export function start(port, options)` |
| 3 | POST /signup returns 201 and `{id, email}` | partly broken | 94, 81-83 | Normal signup returns 201; a 1025-character password returns `400 "Password must be at most 1024 characters"`, a limit the task does not state |
| 4 | Emails stored lower case; same email in any case is 409 | met | 84, 86, 92 | `A@X.com` then `a@x.COM` returns 409; stored as `a@x.com` |
| 5 | Password shorter than 12 characters is 400 | broken | 78 | 11 ASCII characters returns 400, but a password of six emoji returns 201 |
| 6 | No response ever contains the password | met | 94, 141, every `send` | Every body is `{id, email}`, `{token}` or a fixed error string |
| 7 | Hashed with `crypto.scrypt` and a random salt | met | 16, 88-92 | `randomBytes(16)` salt, `scryptAsync(password, salt, 64)`; stored user is `{ id, email, salt, hash }` |
| 8 | Right email and password returns 200 and `{token}` | met | 139-141 | Probe returns 200; only key is `token` |
| 9 | Anything else is 401, same message either way | met | 14, 99-103, 130 | Wrong password, unknown email and malformed bodies all return `401 {"error":"Invalid email or password"}` |
| 10 | After 5 wrong passwords, login is 429 | broken | 100-103 | 8 wrong 2000-character passwords for a registered email, then a 9th, returns 401, not 429 |
| 11 | The 429 lasts 15 minutes | met | 13, 109-116, 128 | Still 429 at 14:59.999, 200 at 15:00; wrong attempts during the lock do not extend it |

Broken, worst first:

1. **Rule 10:** a wrong password longer than 1024 characters (or a non-string one) returns 401 at lines 100-103 before the failure counter is touched, so those attempts never lead to a 429.
2. **Rule 5:** line 78 uses `password.length`, which counts UTF-16 units, so a password of 6 emoji (6 characters, 12 units) is accepted.
3. **Rule 3:** lines 81-83 reject passwords over 1024 characters with 400, which the task does not allow for.

Not checked: whether a failure count below 5 should ever expire. The task is silent, and the code drops counters idle for 15 minutes (lines 63-68).
