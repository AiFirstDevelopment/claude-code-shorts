// The same request, with the one-line CLAUDE.md in this folder: product.removed = true, kept and hidden.
// The code is as it wrote it; only this header was added.

import http from 'node:http';

function send(res, status, body) {
  const data = body === undefined ? '' : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(data);
}

const view = ({ id, name }) => ({ id, name });

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
        const product = { id: String(nextId++), name, removed: false };
        products.set(product.id, product);
        send(res, 201, view(product));
      });
      return;
    }

    const match = path.match(/^\/products\/([^/]+)$/);
    if (match) {
      // Removed products stay in the store (old orders point to them) but are hidden.
      const product = products.get(decodeURIComponent(match[1]));
      const found = product && !product.removed;
      if (req.method === 'GET') {
        return found ? send(res, 200, view(product)) : send(res, 404, { error: 'not found' });
      }
      if (req.method === 'DELETE') {
        if (!found) return send(res, 404, { error: 'not found' });
        product.removed = true;
        return send(res, 204);
      }
    }

    send(res, 404, { error: 'not found' });
  });
}

export function start(port) {
  return createServer().listen(port);
}
