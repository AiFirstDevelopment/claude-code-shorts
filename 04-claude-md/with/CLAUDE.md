# Project rules

- Only admins change links: any request that changes or removes a link needs the header
  x-admin-key equal to process.env.ADMIN_KEY, or it gets 403.
- Links are never deleted from storage: a removed link is marked removed, its code answers 410,
  and its stats still work.
- Every new endpoint gets a test in server.test.js.
