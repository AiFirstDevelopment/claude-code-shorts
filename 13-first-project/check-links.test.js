import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { execFile } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'check-links.js');

// ---- local test server -------------------------------------------------

let server;
let base; // e.g. http://127.0.0.1:54321
let deadUrl; // a port nothing listens on
let requests = []; // { method, url }
let tmp;

function routes(req, res) {
  const path = new URL(req.url, 'http://x').pathname;
  const send = (code, headers = {}) => { res.writeHead(code, headers); res.end(); };

  switch (path) {
    case '/ok': case '/ok2': case '/bare': case '/badge.svg': case '/q':
      return send(200);
    case '/404': return send(404);
    case '/500': return send(500);
    case '/400': return send(400);
    case '/401': return send(401);
    case '/403': return send(403);
    case '/429': return send(429);
    case '/redirect': return send(301, { Location: '/ok' });
    case '/redirect-chain': return send(302, { Location: '/redirect' });
    case '/redirect-broken': return send(301, { Location: '/404' });
    case '/no-head-405':
      return req.method === 'HEAD' ? send(405) : send(200);
    case '/no-head-501':
      return req.method === 'HEAD' ? send(501) : send(200);
    case '/no-head-then-404':
      return req.method === 'HEAD' ? send(405) : send(404);
    case '/slow':
      return setTimeout(() => send(200), 1500);
    default: return send(404);
  }
}

before(async () => {
  server = http.createServer((req, res) => {
    requests.push({ method: req.method, url: req.url });
    routes(req, res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;

  // Grab a free port, then close it so connections are refused.
  const tmpServer = http.createServer();
  await new Promise((r) => tmpServer.listen(0, '127.0.0.1', r));
  deadUrl = `http://127.0.0.1:${tmpServer.address().port}/gone`;
  await new Promise((r) => tmpServer.close(r));

  tmp = mkdtempSync(join(tmpdir(), 'check-links-'));
});

after(() => {
  server.closeAllConnections?.();
  server.close();
  rmSync(tmp, { recursive: true, force: true });
});

beforeEach(() => { requests = []; });

// ---- helpers -----------------------------------------------------------

let fileCount = 0;

// Runs check-links.js on the given Markdown. Must be async: the server
// lives in this process, so a sync spawn would block it.
function run(markdown, args = []) {
  const file = join(tmp, `doc${fileCount++}.md`);
  writeFileSync(file, markdown);
  return new Promise((resolve) => {
    execFile(process.execPath, [SCRIPT, file, ...args], { timeout: 30000 },
      (err, stdout, stderr) => {
        resolve({ code: err ? err.code : 0, stdout, stderr, out: stdout + stderr });
      });
  });
}

const hits = (path) => requests.filter((r) => r.url === path);
const lines = (out) => out.split('\n').filter((l) => l.trim());
const lineFor = (out, url) => lines(out).filter((l) => l.includes(url));

// ---- rules from TASK.md ------------------------------------------------

test('checks [text](url) links', async () => {
  const r = await run(`# Doc\n\nSee [the docs](${base}/ok).\n`);
  assert.equal(r.code, 0, r.out);
  assert.ok(hits('/ok').length >= 1, 'link was requested');
  assert.match(r.stdout, /All 1 links OK/);
});

test('checks bare URLs', async () => {
  const r = await run(`Visit ${base}/bare for more.\n`);
  assert.equal(r.code, 0, r.out);
  assert.ok(hits('/bare').length >= 1, 'bare URL was requested');
  assert.match(r.stdout, /All 1 links OK/);
});

test('ignores non-http links', async () => {
  const r = await run(`[mail](mailto:a@b.c) [rel](./other.md) [ftp](ftp://x.y/z) [ok](${base}/ok)\n`);
  assert.equal(r.code, 0, r.out);
  assert.match(r.stdout, /All 1 links OK/);
});

test('a badge is two links: the image and the link', async () => {
  const r = await run(`[![build](${base}/badge.svg)](${base}/ok)\n`);
  assert.equal(r.code, 0, r.out);
  assert.ok(hits('/badge.svg').length >= 1, 'image was requested');
  assert.ok(hits('/ok').length >= 1, 'link was requested');
  assert.match(r.stdout, /All 2 links OK/);
});

test('a badge with a broken image is reported', async () => {
  const r = await run(`[![build](${base}/404)](${base}/ok)\n`);
  assert.equal(r.code, 1, r.out);
  assert.equal(lineFor(r.stdout, `${base}/404`).length, 1);
});

test('status 400 and above is broken', async () => {
  for (const code of ['400', '404', '500']) {
    const url = `${base}/${code}`;
    const r = await run(`[x](${url})\n`);
    assert.equal(r.code, 1, `${code}: ${r.out}`);
    const [line] = lineFor(r.stdout, url);
    assert.ok(line, `${code} is reported`);
    assert.match(line, new RegExp(`\\b${code}\\b`), 'status is printed');
  }
});

test('a failed request is broken', async () => {
  const r = await run(`[gone](${deadUrl})\n`);
  assert.equal(r.code, 1, r.out);
  assert.equal(lineFor(r.stdout, deadUrl).length, 1, 'failure is reported');
});

test('a request slower than the timeout is broken', async () => {
  const url = `${base}/slow`;
  const r = await run(`[slow](${url})\n`, ['--timeout', '300']);
  assert.equal(r.code, 1, r.out);
  assert.equal(lineFor(r.stdout, url).length, 1, 'timeout is reported');
});

test('--timeout longer than the response time passes', async () => {
  const r = await run(`[slow](${base}/slow)\n`, ['--timeout', '5000']);
  assert.equal(r.code, 0, r.out);
  assert.match(r.stdout, /All 1 links OK/);
});

test('default timeout is long enough for a 1.5s response', async () => {
  // The 10000ms default itself is not waited out; this checks it isn't short.
  const r = await run(`[slow](${base}/slow)\n`);
  assert.equal(r.code, 0, r.out);
});

test('follows redirects', async () => {
  const r = await run(`[a](${base}/redirect) [b](${base}/redirect-chain)\n`);
  assert.equal(r.code, 0, r.out);
  assert.ok(hits('/ok').length >= 1, 'redirect target was requested');
  assert.match(r.stdout, /All 2 links OK/);
});

test('a redirect to a broken page is broken', async () => {
  const url = `${base}/redirect-broken`;
  const r = await run(`[x](${url})\n`);
  assert.equal(r.code, 1, r.out);
  assert.equal(lineFor(r.stdout, url).length, 1, 'original URL is reported');
});

test('falls back to GET when HEAD is refused', async () => {
  const r = await run(`[a](${base}/no-head-405) [b](${base}/no-head-501)\n`);
  assert.equal(r.code, 0, r.out);
  assert.ok(hits('/no-head-405').some((h) => h.method === 'GET'), 'GET was tried');
  assert.match(r.stdout, /All 2 links OK/);
});

test('broken when both HEAD and GET fail', async () => {
  const url = `${base}/no-head-then-404`;
  const r = await run(`[x](${url})\n`);
  assert.equal(r.code, 1, r.out);
  assert.match(lineFor(r.stdout, url)[0] ?? '', /\b404\b/);
});

test('each URL is checked once', async () => {
  const ok = `${base}/ok`;
  const bad = `${base}/404`;
  const r = await run(`[a](${ok})\n[b](${ok})\n${ok}\n[c](${bad})\n[d](${bad})\n`);
  assert.equal(hits('/ok').length, 1, 'OK URL requested once');
  assert.equal(hits('/404').length, 1, 'broken URL requested once');
  assert.equal(r.code, 1, r.out);
});

test('All N links OK counts each URL once', async () => {
  const r = await run(`[a](${base}/ok) [b](${base}/ok) [c](${base}/ok2)\n`);
  assert.equal(r.code, 0, r.out);
  assert.match(r.stdout, /All 2 links OK/);
});

test('prints one line per broken link with line number, status and URL', async () => {
  const md = [
    '# Title',                 // 1
    '',                        // 2
    `[fine](${base}/ok)`,      // 3
    `[bad](${base}/404)`,      // 4
    '',                        // 5
    `also ${base}/500 here`,   // 6
  ].join('\n');
  const r = await run(md);
  assert.equal(r.code, 1, r.out);

  const out = lines(r.stdout);
  assert.equal(out.length, 2, `exactly two lines:\n${r.stdout}`);

  const l404 = lineFor(r.stdout, `${base}/404`)[0];
  assert.match(l404, /\b4\b/, 'line number');
  assert.match(l404, /\b404\b/, 'status');

  const l500 = lineFor(r.stdout, `${base}/500`)[0];
  assert.match(l500, /\b6\b/, 'line number');
  assert.match(l500, /\b500\b/, 'status');

  assert.doesNotMatch(r.stdout, /\/ok\b/, 'working links are not printed');
  assert.doesNotMatch(r.stdout, /All \d+ links OK/);
});

test('exits 0 and prints "All N links OK" when nothing is broken', async () => {
  const r = await run(`[a](${base}/ok)\n${base}/bare\n[![b](${base}/badge.svg)](${base}/ok2)\n`);
  assert.equal(r.code, 0, r.out);
  assert.equal(r.stdout.trim(), 'All 4 links OK');
});

test('links in fenced code blocks are skipped', async () => {
  const md = [
    `[real](${base}/ok)`,
    '```',
    `[example](${base}/404)`,
    `${base}/500`,
    '```',
    '~~~js',
    `fetch("${base}/400")`,
    '~~~',
  ].join('\n');
  const r = await run(md);
  assert.equal(r.code, 0, r.out);
  assert.equal(hits('/404').length + hits('/500').length + hits('/400').length, 0);
  assert.match(r.stdout, /All 1 links OK/);
});

test('links in inline code are skipped', async () => {
  const r = await run(`Run \`curl ${base}/404\` or \`[x](${base}/500)\`, see [ok](${base}/ok).\n`);
  assert.equal(r.code, 0, r.out);
  assert.equal(hits('/404').length + hits('/500').length, 0);
  assert.match(r.stdout, /All 1 links OK/);
});

test('401, 403 and 429 are listed as blocked and do not fail', async () => {
  const urls = ['401', '403', '429'].map((c) => `${base}/${c}`);
  const r = await run(urls.map((u, i) => `[${i}](${u})`).join('\n') + '\n');
  assert.equal(r.code, 0, r.out);
  for (const u of urls) {
    const [line] = lineFor(r.stdout, u);
    assert.ok(line, `${u} is listed`);
    assert.match(line, /blocked/i);
  }
});

test('blocked links do not hide broken ones', async () => {
  const r = await run(`[a](${base}/403)\n[b](${base}/404)\n`);
  assert.equal(r.code, 1, r.out);
  assert.match(lineFor(r.stdout, `${base}/403`)[0] ?? '', /blocked/i);
  assert.doesNotMatch(lineFor(r.stdout, `${base}/404`)[0] ?? '', /blocked/i);
});

test('HTML entities in links are decoded before checking', async () => {
  const r = await run(`[a](${base}/q?a&#x3D;1&amp;b&#61;2)\n`);
  assert.equal(r.code, 0, r.out);
  assert.deepEqual(hits('/q?a=1&b=2').length, 1, `requests: ${JSON.stringify(requests)}`);
});
