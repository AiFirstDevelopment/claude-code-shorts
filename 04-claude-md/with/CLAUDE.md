# Project rules

- Only the customer who placed an order can cancel it: the header x-customer-id must match the order's customerId, or the answer is 403.
- A shipped order can never be cancelled: the answer is 409.
- Every new endpoint gets a test in server.test.js.
