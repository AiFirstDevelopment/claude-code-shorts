#!/usr/bin/env node
// Finds broken http(s) links in a Markdown file. Node 20, no packages.
import { readFileSync } from 'node:fs';

const BLOCKED = new Set([401, 403, 429]);
const HEAD_REFUSED = new Set([405, 501]);
const CONCURRENCY = 10;

function parseArgs(argv) {
  let timeout = 10000;
  let file;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--timeout') {
      timeout = Number(argv[++i]);
      if (!Number.isFinite(timeout) || timeout <= 0) usage('--timeout needs a positive number of ms');
    } else if (!file) {
      file = argv[i];
    } else {
      usage(`unexpected argument: ${argv[i]}`);
    }
  }
  if (!file) usage();
  return { file, timeout };
}

function usage(msg) {
  if (msg) console.error(msg);
  console.error('usage: node check-links.js <file.md> [--timeout <ms>]');
  process.exit(2);
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      try { return String.fromCodePoint(n); } catch { return m; }
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

// Blank out `inline code` spans (any backtick-run length) so their URLs are ignored.
function stripInlineCode(line) {
  return line.replace(/(`+)[\s\S]*?\1/g, (m) => ' '.repeat(m.length));
}

// Drop trailing punctuation and unbalanced closing parens/brackets.
function trimUrl(url) {
  for (;;) {
    const last = url.at(-1);
    if (/[.,;:!?'"*_~]/.test(last)) {
      // Keep a ';' that ends an HTML entity like &amp;
      if (last === ';' && /&(#x[0-9a-f]+|#\d+|[a-z]+);$/i.test(url)) break;
      url = url.slice(0, -1);
    } else if (last === ')' && count(url, '(') < count(url, ')')) {
      url = url.slice(0, -1);
    } else {
      break;
    }
  }
  return url;
}

const count = (s, ch) => s.split(ch).length - 1;

// Returns Map<url, firstLineNumber>.
function extractLinks(markdown) {
  const links = new Map();
  let fence = null; // { char, len } while inside a fenced block
  markdown.split(/\r?\n/).forEach((raw, i) => {
    const fenceMatch = raw.match(/^ {0,3}(`{3,}|~{3,})/);
    if (fence) {
      if (fenceMatch && fenceMatch[1][0] === fence.char && fenceMatch[1].length >= fence.len
          && raw.trim() === fenceMatch[1].trim()) fence = null;
      return;
    }
    if (fenceMatch) {
      fence = { char: fenceMatch[1][0], len: fenceMatch[1].length };
      return;
    }
    const line = stripInlineCode(raw);
    for (const m of line.matchAll(/https?:\/\/[^\s<>"'`\[\]{}|\\^]+/gi)) {
      const url = decodeEntities(trimUrl(m[0]));
      if (!links.has(url)) links.set(url, i + 1);
    }
  });
  return links;
}

async function request(url, method, timeout) {
  const res = await fetch(url, {
    method,
    redirect: 'follow',
    signal: AbortSignal.timeout(timeout),
    headers: { 'user-agent': 'check-links' },
  });
  res.body?.cancel().catch(() => {});
  return res.status;
}

// Returns { status } or { error }.
async function check(url, timeout) {
  try {
    let status = await request(url, 'HEAD', timeout);
    if (HEAD_REFUSED.has(status)) status = await request(url, 'GET', timeout);
    return { status };
  } catch (err) {
    return { error: describe(err, timeout) };
  }
}

function describe(err, timeout) {
  if (err.name === 'TimeoutError' || err.name === 'AbortError') return `timeout after ${timeout}ms`;
  const cause = err.cause;
  return cause?.code || cause?.message || err.message;
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function main() {
  const { file, timeout } = parseArgs(process.argv.slice(2));
  let markdown;
  try {
    markdown = readFileSync(file, 'utf8');
  } catch (err) {
    console.error(`cannot read ${file}: ${err.message}`);
    process.exit(2);
  }

  const links = [...extractLinks(markdown)].map(([url, line]) => ({ url, line }));
  const results = await mapLimit(links, CONCURRENCY, async (l) => ({ ...l, ...(await check(l.url, timeout)) }));
  results.sort((a, b) => a.line - b.line);

  let broken = 0;
  let blocked = 0;
  for (const r of results) {
    if (r.error) {
      broken++;
      console.log(`${r.line}: ${r.error} ${r.url}`);
    } else if (BLOCKED.has(r.status)) {
      blocked++;
      console.log(`${r.line}: blocked (${r.status}) ${r.url}`);
    } else if (r.status >= 400) {
      broken++;
      console.log(`${r.line}: ${r.status} ${r.url}`);
    }
  }

  if (broken) process.exit(1);
  console.log(`All ${results.length - blocked} links OK`);
}

main();
