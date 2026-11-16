Fixed: keyword search now finds Greek and Russian words; the full suite is green (49/49) and typecheck is clean.

- **Bug:** a keyword search for a Greek or Russian word matched nothing, so the question was answered from the wrong document (or not at all) instead of the page holding the word.
- **Cause:** `demo/src/retrieval.ts:37` — `words()` tokenized with `/[a-z0-9]+/g`, so any text outside ASCII Latin produced no tokens for BM25.
- **Fix:** that regex is now `/[\p{L}\p{N}]+/gu`, which keeps letters and digits of any script.
- **Test:** `finds a Greek or Russian word by keyword search alone` in `demo/tests/demo.test.ts`. It failed before the fix (a search for πληρωμή returned `english.pdf`) and passes now.

Noticed but not changed:
- A word with a combining accent (decomposed text, as some PDFs produce) still splits at the accent, and it won't match the same word typed precomposed.
- Accented Latin words such as "café" were also split by the old regex and now match whole.
- The stop-word list and the plural "s" stripping remain English-only.
- Chinese, Japanese and Thai are still not handled: they have no spaces between words, so a whole run becomes one token.

Not committed.