// Each rule in TASK.md, checked against a small local web server, so the tests never touch the internet.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { execFile } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let server, base, hits = {};
before(async () => {
  server = http.createServer((req, res) => {
    hits[req.url] = (hits[req.url] ?? 0) + 1;
    if (req.url === '/ok') return res.end('ok');
    if (req.url === '/missing') { res.statusCode = 404; return res.end(); }
    if (req.url === '/moved') { res.writeHead(301, { location: '/ok' }); return res.end(); }
    if (req.url === '/no-head') { res.statusCode = req.method === 'HEAD' ? 405 : 200; return res.end(); }
    if (req.url === '/slow') return; // never answers
    if (req.url === '/bots-blocked') { res.statusCode = 403; return res.end(); }
    if (req.url === '/page?a=1&b=2') return res.end('ok');
    res.statusCode = 500; res.end();
  });
  await new Promise(r => server.listen(0, r));
  base = `http://localhost:${server.address().port}`;
});
after(() => server.closeAllConnections() || server.close());

// Writes a Markdown file, runs the tool on it, returns its output and exit code.
function check(markdown, ...args) {
  const file = join(mkdtempSync(join(tmpdir(), 'links-')), 'README.md');
  writeFileSync(file, markdown);
  return new Promise(resolve => execFile('node', ['check-links.js', file, ...args],
    (err, stdout) => resolve({ code: err ? err.code : 0, out: stdout })));
}

test('a good link passes', async () => {
  const r = await check(`[home](${base}/ok)`);
  assert.equal(r.code, 0);
  assert.match(r.out, /All 1 links OK/);
});

test('a 404 is broken, with its line number and status', async () => {
  const r = await check(`# Docs\n\nSee [the guide](${base}/missing).`);
  assert.equal(r.code, 1);
  assert.match(r.out, new RegExp(`3.*404.*${base}/missing`));
});

test('bare URLs are checked too', async () => {
  const r = await check(`Go to ${base}/missing now`);
  assert.equal(r.code, 1);
  assert.match(r.out, /404/);
});

test('a badge is two links', async () => {
  const r = await check(`[![build](${base}/ok)](${base}/missing)`);
  assert.equal(r.code, 1);
  assert.match(r.out, new RegExp(`404.*${base}/missing\\s*$`, 'm'));
});

test('redirects are followed', async () => {
  const r = await check(`[old](${base}/moved)`);
  assert.equal(r.code, 0);
});

test('a server that refuses HEAD is tried with GET', async () => {
  const r = await check(`[x](${base}/no-head)`);
  assert.equal(r.code, 0);
});

test('a link slower than the timeout is broken', async () => {
  const r = await check(`[slow](${base}/slow)`, '--timeout', '300');
  assert.equal(r.code, 1);
  assert.match(r.out, /slow/);
});

test('each URL is checked once', async () => {
  hits = {};
  await check(`[a](${base}/ok) [b](${base}/ok)\n${base}/ok`);
  assert.equal(hits['/ok'], 1);
});

test('links inside code are skipped', async () => {
  const r = await check('```js\nfetch("' + base + '/missing")\n```\nand `' + base + '/missing` too');
  assert.equal(r.code, 0);
});

test('a 403 is listed as blocked, not broken', async () => {
  const r = await check(`[npm](${base}/bots-blocked)`);
  assert.equal(r.code, 0);
  assert.match(r.out, /blocked.*bots-blocked/);
});

test('HTML codes in a link are decoded', async () => {
  const r = await check(`<a href="${base}/page?a&#x3D;1&amp;b&#x3D;2">x</a>`);
  assert.equal(r.code, 0);
});
