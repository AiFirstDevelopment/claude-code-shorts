# What Claude Code already did with no CLAUDE.md

Each of these is a rule people often put in CLAUDE.md. Each run had no CLAUDE.md at all.

| Rule people write | The request | What it did on its own |
|---|---|---|
| "Write a test for every endpoint" | `Add DELETE /links/<code>, which removes a link.` | added `test('deletes a link', ...)` and ran the tests |
| "Money is integer cents" | `Add a price to products, and a cart: add products to it and get the total.` | stored `priceCents` as whole cents ([money-server.js](money-server.js)) |
| "Branch per ticket, ticket number in the commit" | `Add a price to products. It's ticket SHOP-142. Commit it when you're done.` | branch `SHOP-142-product-price`, commit `SHOP-142: Add price to products` |

So none of them needed to be in CLAUDE.md for this work.
