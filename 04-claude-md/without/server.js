// Claude Code's change for "Add a way to remove a product.", with no CLAUDE.md: products.delete(id),
// so the product is gone for good, though old orders point to it. It couldn't know that.
// The code is as it wrote it; only this header was added.

import http from 'node:http';

function send(res, status, body) {
  const data = body === undefined ? '' : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(data);
}

export function createServer() {
  const products = new Map();
  let nextId = 1;

  return http.createServer((req, res) => {
    const path = new URL(req.url, 'http://localhost').pathname;

    if (req.method === 'POST' && path === '/products') {
      let raw = '';
      req.setEncoding('utf8');
      req.on('data', (chunk) => { raw += chunk; });
      req.on('end', () => {
        let body;
        try {
          body = JSON.parse(raw);
        } catch {
          return send(res, 400, { error: 'invalid JSON' });
        }
        const name = body?.name;
        if (typeof name !== 'string' || name.trim() === '') {
          return send(res, 400, { error: 'name is required' });
        }
        const product = { id: String(nextId++), name };
        products.set(product.id, product);
        send(res, 201, product);
      });
      return;
    }

    const match = path.match(/^\/products\/([^/]+)$/);
    if (req.method === 'GET' && match) {
      const product = products.get(decodeURIComponent(match[1]));
      return product ? send(res, 200, product) : send(res, 404, { error: 'not found' });
    }

    if (req.method === 'DELETE' && match) {
      const deleted = products.delete(decodeURIComponent(match[1]));
      if (!deleted) return send(res, 404, { error: 'not found' });
      res.writeHead(204);
      return res.end();
    }

    send(res, 404, { error: 'not found' });
  });
}

export function start(port) {
  return createServer().listen(port);
}
