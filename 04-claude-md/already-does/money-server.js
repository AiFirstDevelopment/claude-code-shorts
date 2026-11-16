// "Add a price to products, and a cart: add products to it and get the total." with no CLAUDE.md:
// it chose integer cents (priceCents) on its own. The code is as it wrote it; only this header was added.

import http from 'node:http';

function send(res, status, body) {
  const data = body === undefined ? '' : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(data);
}

function readJson(req, res, handle) {
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
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      return send(res, 400, { error: 'body must be a JSON object' });
    }
    handle(body);
  });
}

// Money is held as integer cents so totals are exact.
const isCents = (v) => Number.isSafeInteger(v) && v >= 0;
const isQuantity = (v) => Number.isSafeInteger(v) && v > 0;

export function createServer() {
  const products = new Map();
  const carts = new Map();
  let nextProductId = 1;
  let nextCartId = 1;

  const cartView = (cart) => {
    const items = [...cart.items].map(([productId, quantity]) => {
      const { priceCents } = products.get(productId);
      return { productId, quantity, priceCents, lineTotalCents: priceCents * quantity };
    });
    const totalCents = items.reduce((sum, i) => sum + i.lineTotalCents, 0);
    return { id: cart.id, items, totalCents };
  };

  return http.createServer((req, res) => {
    const path = new URL(req.url, 'http://localhost').pathname;
    let m;

    if (req.method === 'POST' && path === '/products') {
      return readJson(req, res, (body) => {
        const { name, priceCents } = body;
        if (typeof name !== 'string' || name.trim() === '') {
          return send(res, 400, { error: 'name is required' });
        }
        if (!isCents(priceCents)) {
          return send(res, 400, { error: 'priceCents must be a non-negative integer' });
        }
        const product = { id: String(nextProductId++), name, priceCents };
        products.set(product.id, product);
        send(res, 201, product);
      });
    }

    if (req.method === 'GET' && (m = path.match(/^\/products\/([^/]+)$/))) {
      const product = products.get(decodeURIComponent(m[1]));
      return product ? send(res, 200, product) : send(res, 404, { error: 'not found' });
    }

    if (req.method === 'POST' && path === '/carts') {
      const cart = { id: String(nextCartId++), items: new Map() };
      carts.set(cart.id, cart);
      return send(res, 201, cartView(cart));
    }

    if (req.method === 'GET' && (m = path.match(/^\/carts\/([^/]+)$/))) {
      const cart = carts.get(decodeURIComponent(m[1]));
      return cart ? send(res, 200, cartView(cart)) : send(res, 404, { error: 'not found' });
    }

    if (req.method === 'POST' && (m = path.match(/^\/carts\/([^/]+)\/items$/))) {
      const cart = carts.get(decodeURIComponent(m[1]));
      if (!cart) return send(res, 404, { error: 'not found' });
      return readJson(req, res, (body) => {
        const { productId, quantity = 1 } = body;
        if (typeof productId !== 'string' || !products.has(productId)) {
          return send(res, 400, { error: 'unknown productId' });
        }
        if (!isQuantity(quantity)) {
          return send(res, 400, { error: 'quantity must be a positive integer' });
        }
        cart.items.set(productId, (cart.items.get(productId) ?? 0) + quantity);
        send(res, 200, cartView(cart));
      });
    }

    send(res, 404, { error: 'not found' });
  });
}

export function start(port) {
  return createServer().listen(port);
}
