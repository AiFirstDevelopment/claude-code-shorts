I found one small bug. Everything else on `/learn`, the 25 episode pages and the `/blog` tag filter worked.

**Bug (minor): a `?tag=` link only works with exact capital letters.**
- Steps: open `/blog?tag=Evals`, then `/blog?tag=evals`.
- Expected: both show the one Evals post.
- What happens: the lowercase link shows all 6 posts with "All" pressed, and `?tag=evals` stays in the address. The cause is the exact-match lookup at `scripts/blog.mjs:184`.

**What worked:**
- **Episode list and pages:** each series' episode count and length match the sum of its episodes, and so does the page total (25 episodes, 3 h 30 min). On every episode page, the heading matches the title in the list, previous and next go through the whole path in order, and the canonical link, structured data and social tags are correct. YouTube loads nothing until the play button is pressed. An episode address that doesn't exist gives the site's 404 page.
- **Tag filter:** each tag shows only the posts that carry it, and the tags cover every post. A filter survives a reload, opening a post and pressing Back, and opening a `?tag=` link directly. "All" brings every post back, and an unknown tag shows every post. All six post links answer 200.
- **Phone width (390 px):** no sideways scrolling and nothing cut off on `/learn`, an episode page or `/blog`.

**What I couldn't check:** the server on port 8811 only serves static files (a Python process), so the site's server code (Pages Functions) wasn't running. Every page logged a 404 for `/api/t/consent`, the visit-tracking call; that's the setup, not a site bug.

**Tests:** I added 7 tests in `tests/e2e/learn-blog-browser.spec.ts`, in the suite's existing style. I ran them headless against the suite's own `wrangler pages dev` server: 6 pass and 1 fails, the capital-letters test above, as it should until that's fixed.

Nothing is committed. The Playwright MCP left a `.playwright-mcp/` folder in the worktree; it's safe to delete, or it can go in `.gitignore`.
