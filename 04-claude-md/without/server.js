// Claude Code's change for "Add a way to cancel an order.", with no CLAUDE.md:
// POST /orders/<id>/cancel with no check of who asks: anyone can cancel anyone's order.
// (It did guess on its own that a shipped order can't be cancelled.) The code is as it wrote it; only this header was added.

import http from 'node:http';

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let data = '';
  for await (const chunk of req) data += chunk;
  if (!data) return {};
  return JSON.parse(data);
}

export function start(port) {
  const orders = new Map();
  let nextId = 1;

  const server = http.createServer(async (req, res) => {
    const path = new URL(req.url, 'http://localhost').pathname;
    try {
      if (req.method === 'POST' && path === '/orders') {
        let body;
        try {
          body = await readJson(req);
        } catch {
          return send(res, 400, { error: 'invalid JSON' });
        }
        if (!body || typeof body !== 'object' || body.item == null || body.item === '') {
          return send(res, 400, { error: 'item is required' });
        }
        const order = { id: String(nextId++), customerId: body.customerId, item: body.item, status: 'placed' };
        orders.set(order.id, order);
        return send(res, 201, { id: order.id, status: order.status });
      }

      let m = path.match(/^\/orders\/([^/]+)$/);
      if (req.method === 'GET' && m) {
        const order = orders.get(decodeURIComponent(m[1]));
        return order ? send(res, 200, order) : send(res, 404, { error: 'not found' });
      }

      m = path.match(/^\/orders\/([^/]+)\/ship$/);
      if (req.method === 'POST' && m) {
        const order = orders.get(decodeURIComponent(m[1]));
        if (!order) return send(res, 404, { error: 'not found' });
        if (order.status === 'cancelled') return send(res, 409, { error: 'order is cancelled' });
        order.status = 'shipped';
        return send(res, 200, order);
      }

      m = path.match(/^\/orders\/([^/]+)\/cancel$/);
      if (req.method === 'POST' && m) {
        const order = orders.get(decodeURIComponent(m[1]));
        if (!order) return send(res, 404, { error: 'not found' });
        if (order.status === 'shipped') return send(res, 409, { error: 'order already shipped' });
        order.status = 'cancelled';
        return send(res, 200, order);
      }

      send(res, 404, { error: 'not found' });
    } catch {
      send(res, 500, { error: 'internal error' });
    }
  });

  return server.listen(port);
}
