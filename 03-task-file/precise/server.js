// Written by Claude Code from the seven-rule TASK.md in this folder, with no tests in the folder.
// Against server.test.js: 5 passed, 0 failed. The code is as it wrote it; only this header was added.

import http from 'node:http';
import { randomInt } from 'node:crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function send(res, status, body, headers = {}) {
  const data = body === undefined ? '' : JSON.stringify(body);
  res.writeHead(status, { ...(data && { 'content-type': 'application/json' }), ...headers });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) reject(new Error('too large'));
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function isHttpUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

export function start(port) {
  const links = new Map(); // code -> { url, visits }
  const codes = new Map(); // url -> code

  function newCode() {
    let code;
    do {
      code = Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
    } while (links.has(code));
    return code;
  }

  const server = http.createServer(async (req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');

    if (req.method === 'POST' && pathname === '/links') {
      let url;
      try {
        ({ url } = JSON.parse(await readBody(req)) ?? {});
      } catch {
        return send(res, 400, { error: 'invalid JSON' });
      }
      if (!isHttpUrl(url)) return send(res, 400, { error: 'url must be http or https' });
      let code = codes.get(url);
      if (!code) {
        code = newCode();
        codes.set(url, code);
        links.set(code, { url, visits: 0 });
      }
      return send(res, 201, { code });
    }

    if (req.method === 'GET') {
      const stats = pathname.match(/^\/links\/([A-Za-z0-9]{6})\/stats$/);
      if (stats) {
        const link = links.get(stats[1]);
        return link ? send(res, 200, { url: link.url, visits: link.visits }) : send(res, 404, { error: 'not found' });
      }
      const redirect = pathname.match(/^\/([A-Za-z0-9]{6})$/);
      const link = redirect && links.get(redirect[1]);
      if (link) {
        link.visits++;
        return send(res, 302, undefined, { location: link.url });
      }
    }

    send(res, 404, { error: 'not found' });
  });

  return server.listen(port);
}
