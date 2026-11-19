# Task

Build a command-line tool, check-links.js (Node 20, no packages), that finds the broken links in a Markdown file.

- `node check-links.js README.md` checks every http and https link in the file: [text](url) links and bare URLs
- a badge, [![alt](image-url)](link-url), is two links: the image and the link
- a link is broken if the answer is 400 or above, or the request fails, or it takes longer than the timeout
- it follows redirects
- if a server refuses a HEAD request, it tries GET before calling the link broken
- `--timeout <ms>` sets the timeout; the default is 10000
- each URL is checked once, even if it appears more than once
- it prints one line per broken link: the line number, the status or error, and the URL
- it exits with 1 if any link is broken; otherwise it prints "All N links OK" and exits with 0
- links inside code (fenced code blocks and `inline code`) are skipped: they're examples, not links
- a 401, 403 or 429 answer is listed as "blocked" (a site turning away scripts), not broken, and doesn't change the exit code
- HTML codes in links, like &amp; and &#x3D;, are decoded before the link is checked
