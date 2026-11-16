# Search: don't, don’t and dont are one word

**What:** BM25 tokenizing now drops a straight or curly apostrophe that sits inside a word, so "don't", "don’t" and "dont" all become the token `dont`.

**Why:** Searching for "dont" didn't find "don't" or "don’t", and the reverse searches failed too, because the apostrophe split the word into "don" and "t".

**How it was tested:** Three new tests under "apostrophes inside words":
- Single words come out as the right tokens.
- An apostrophe at the edge of a word still splits it.
- BM25 finds each spelling from each of the others.

The full suite (51 tests) passes and `tsc` is clean.

**Anything to look at:** Possessives change too: "invoice's" now becomes `invoice` instead of `invoice` plus a dropped `s`, which should help matching. It does change the tokens for any text that contains one. Miniflare also warns that the new test name has a curly quote, which isn't ASCII, in a header; the test still passes.
