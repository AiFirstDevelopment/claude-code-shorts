#!/usr/bin/env node
// Finds the broken http(s) links in a Markdown file. Usage: node check-links.js FILE [--timeout ms]
import { readFileSync } from 'node:fs';

const BLOCKED = new Set([401, 403, 429]);
const CONCURRENCY = 8;

function parseArgs(argv) {
  let file, timeout = 10000;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--timeout') {
      timeout = Number(argv[++i]);
      if (!Number.isFinite(timeout) || timeout <= 0) usage('--timeout needs a positive number of ms');
    } else if (!file) file = argv[i];
    else usage(`unexpected argument: ${argv[i]}`);
  }
  if (!file) usage();
  return { file, timeout };
}

function usage(msg) {
  if (msg) console.error(msg);
  console.error('Usage: node check-links.js FILE.md [--timeout ms]');
  process.exit(2);
}

function decodeEntities(s) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code) => {
    if (code[0] === '#') {
      const n = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      try { return String.fromCodePoint(n); } catch { return m; }
    }
    return named[code.toLowerCase()] ?? m;
  });
}

// Drops trailing punctuation and a closing paren that doesn't belong to the URL.
function trimUrl(url) {
  for (;;) {
    if (/[.,;:!?*_'"]$/.test(url)) url = url.slice(0, -1);
    else if (url.endsWith(')') && count(url, '(') < count(url, ')')) url = url.slice(0, -1);
    else return url;
  }
}
const count = (s, ch) => s.split(ch).length - 1;

// Returns [{ url, line }] for each distinct URL, at its first line.
function extractLinks(markdown) {
  const found = new Map();
  let fence = null;
  markdown.split(/\r?\n/).forEach((raw, i) => {
    const fenceMatch = raw.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      if (fenceMatch && fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length) fence = null;
      return;
    }
    if (fenceMatch) { fence = fenceMatch[1]; return; }
    // Blank out inline code spans (`x`, ``x``).
    const line = raw.replace(/(`+)[\s\S]*?\1/g, m => ' '.repeat(m.length));
    for (const m of line.matchAll(/https?:\/\/[^\s<>"'`\[\]{}|\\^]+/g)) {
      const url = trimUrl(decodeEntities(trimUrl(m[0])));
      try { new URL(url); } catch { continue; }
      if (!found.has(url)) found.set(url, i + 1);
    }
  });
  return [...found].map(([url, line]) => ({ url, line }));
}

async function request(url, method, timeout) {
  const res = await fetch(url, {
    method,
    redirect: 'follow',
    signal: AbortSignal.timeout(timeout),
    headers: { 'user-agent': 'check-links/1.0', accept: '*/*' },
  });
  res.body?.cancel().catch(() => {});
  return res.status;
}

function describeError(err) {
  if (err.name === 'TimeoutError' || err.name === 'AbortError') return 'timeout';
  const cause = err.cause;
  return cause?.code || cause?.message || err.message;
}

// Returns { status } or { error }.
async function checkUrl(url, timeout) {
  try {
    const status = await request(url, 'HEAD', timeout);
    if (status < 400) return { status };
  } catch (err) {
    if (describeError(err) === 'timeout') return { error: 'timeout' };
  }
  try {
    return { status: await request(url, 'GET', timeout) };
  } catch (err) {
    return { error: describeError(err) };
  }
}

async function main() {
  const { file, timeout } = parseArgs(process.argv.slice(2));
  let text;
  try { text = readFileSync(file, 'utf8'); } catch (err) { console.error(`Cannot read ${file}: ${err.message}`); process.exit(2); }

  const links = extractLinks(text);
  const results = new Array(links.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, links.length) }, async () => {
    while (next < links.length) {
      const i = next++;
      results[i] = await checkUrl(links[i].url, timeout);
    }
  }));

  let broken = 0;
  links.forEach(({ url, line }, i) => {
    const { status, error } = results[i];
    if (error) { broken++; console.log(`${line}: ${error} ${url}`); }
    else if (BLOCKED.has(status)) console.log(`${line}: blocked (${status}) ${url}`);
    else if (status >= 400) { broken++; console.log(`${line}: ${status} ${url}`); }
  });

  if (broken) process.exit(1);
  console.log(`All ${links.length} links OK`);
  process.exit(0);
}

main();
