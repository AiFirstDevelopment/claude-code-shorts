// Written by Claude Code from TASK.md, in one headless run, until npm test passed.
// The code is as it wrote it; the comments were added afterwards to explain it.

// Turns a page title into a URL slug: "What's new in 2026?" -> "whats-new-in-2026".
export function slugify(title) {
  return title
    .toLowerCase()                   // lowercase
    .replace(/[^a-z0-9\s-]/g, '')    // punctuation is removed (keep letters, digits, spaces, hyphens)
    .replace(/[\s-]+/g, '-')         // spaces become hyphens, and runs of them collapse to one
    .replace(/^-+|-+$/g, '')         // no hyphen at either end
}
