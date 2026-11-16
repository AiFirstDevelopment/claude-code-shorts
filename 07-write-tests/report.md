I added 7 tests in `demo/tests/retrieval.test.ts`, and each one failed at least once when I broke the code. The code is back exactly as you had it, and the full suite passes (`npm test`: 55/55, 3 files).

| Test | What it guards | Break that made it fail |
|---|---|---|
| an accented word is one token, its accents off | `résumé` → `resume`, `naïve façade` → `naive facade` | undo the change; drop the accent-mark removal; drop the NFD step |
| a capital accented letter matches its plain lower-case letter | `ÉCOLE Ångström` → `ecole angstrom` | same three breaks |
| a precomposed and a decomposed accent give the same token | `é` typed as one character and as `e` + accent mark give the same token | undo the change; drop the NFD step (it still passes with only the mark removal dropped, which is expected) |
| an accented plural loses its "s" like a plain one | `résumés cafés` → `resume cafe` | undo the change; drop the mark removal; drop NFD |
| a question without accents finds a chunk with them, and the other way round | search finds `résumé` from "resume" and "resume" from "résumé" | undo the change; drop the mark removal; drop NFD |
| gives nothing for empty, blank or punctuation-only text | empty and punctuation-only input give `[]` (worked before the change) | make no match return `['']` instead of `[]` |
| still lower-cases, splits on punctuation, drops stop words and a plain plural's "s" | tokenizing that worked before the change | turn off the stop-word filter |

I did the breaks by editing the file by hand, because a script to run them needed approval I couldn't give.

One limitation, not a regression: letters that don't decompose into a base letter plus an accent (`ß`, `ø`, `æ`, `ł`) still split words (`straße` → `stra`, `e`). The tests don't check these letters. Nothing is committed.