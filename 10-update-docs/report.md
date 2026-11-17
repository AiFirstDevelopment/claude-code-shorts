The docs were already accurate; I made two small fixes. I checked about 75 claims in `README.md` and `evals/README.md` and 73 were true, including every line link.

**Fixes**
1. `README.md:112` said the `stopped` event means "a later sentence failed its check". It now says "a later sentence failed its check, or the model failed partway". The code also sends `stopped` with reason `'trouble'` when the model dies mid-answer (`demo/src/app.ts:445`, `:692-693`, `:710`).
2. `evals/README.md:28`: the results table's "behaviour" row didn't mention cut-short answers. It now notes that they show `stopped:` and the reason (`evals/run.mjs:276`).

**Not changed, worth knowing**
- The results table in `evals/README.md` doesn't list the `first sentence ms`, `ms` and `$` columns (`evals/run.mjs:274`). I left it because a reader wouldn't get stuck without them.
- `README.md:68` says the daily job runs `purge`. It also runs `expire`, which removes records past `KEEP_MONTHS` (`demo/src/app.ts:937-941`). In this repo nothing is kept for consented visitors, so that omission is harmless.
- I didn't run `npm test` or the eval. The eval spends money, and deploying needs Cloudflare credentials.
- I didn't check `JOURNAL.md` or `evals/runs/`, because they're records of the past on purpose.
- I found no places where the code looks wrong.

Nothing is committed.
