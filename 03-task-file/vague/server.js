// Written by Claude Code from the two-line TASK.md in this folder, with no tests in the folder.
// It works, but it guessed: POST /shorten (not /links), codes that can contain - and _, no visit stats.
// Against server.test.js: 2 passed, 3 failed. The code is as it wrote it; only this header was added.

import http from 'node:http';
import { randomBytes } from 'node:crypto';

// POST /shorten {"url": "https://..."} -> 201 {"code", "short"}
// GET /<code> -> 302 to the stored URL, 404 if unknown
export function start(port = 0) {
  const links = new Map();

  const send = (res, status, body, headers = {}) => {
    res.writeHead(status, { 'content-type': 'application/json', ...headers });
    res.end(body === undefined ? '' : JSON.stringify(body));
  };

  const newCode = () => {
    let code;
    do code = randomBytes(5).toString('base64url').slice(0, 6);
    while (links.has(code));
    return code;
  };

  const server = http.createServer((req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');

    if (req.method === 'POST' && pathname === '/shorten') {
      let raw = '';
      let tooBig = false;
      req.on('data', (chunk) => {
        raw += chunk;
        if (raw.length > 10_000) { tooBig = true; req.destroy(); }
      });
      req.on('end', () => {
        if (tooBig) return;
        let url;
        try { url = new URL(JSON.parse(raw).url); } catch {
          return send(res, 400, { error: 'body must be {"url": "<absolute http(s) URL>"}' });
        }
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          return send(res, 400, { error: 'only http and https URLs' });
        }
        const code = newCode();
        links.set(code, url.href);
        const host = req.headers.host ?? `localhost:${server.address().port}`;
        send(res, 201, { code, short: `http://${host}/${code}` });
      });
      return;
    }

    if (req.method === 'GET' && pathname.length > 1) {
      const target = links.get(pathname.slice(1));
      if (target) return send(res, 302, undefined, { location: target });
      return send(res, 404, { error: 'not found' });
    }

    send(res, 404, { error: 'not found' });
  });

  server.listen(port);
  return server;
}
