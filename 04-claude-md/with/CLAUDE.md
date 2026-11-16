# Project rules

- Only admins delete accounts: the header x-admin-key must equal process.env.ADMIN_KEY, or the answer is 403.
- Accounts are never erased: a deleted account is marked deleted, its id answers 410, and its orders are kept.
- Every new endpoint gets a test in server.test.js.
