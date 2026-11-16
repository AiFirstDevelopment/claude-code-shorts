// Claude Code's change for "Add a way to delete a user's account.", with no CLAUDE.md:
// DELETE /users/<id> with no check of who asks, and users.delete(), so the account and its orders are gone.
// The code is as it wrote it; only this header was added.

import http from 'node:http';

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

async function readJson(req) {
  let data = '';
  for await (const chunk of req) data += chunk;
  try {
    const parsed = JSON.parse(data);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function start(port) {
  const users = new Map();
  let nextUserId = 1;
  let nextOrderId = 1;

  const server = http.createServer(async (req, res) => {
    try {
      const path = new URL(req.url, 'http://localhost').pathname;
      const parts = path.split('/').filter(Boolean);

      if (parts[0] !== 'users') return send(res, 404, { error: 'not found' });

      // POST /users
      if (parts.length === 1) {
        if (req.method !== 'POST') return send(res, 405, { error: 'method not allowed' });
        const body = await readJson(req);
        if (!body) return send(res, 400, { error: 'invalid JSON' });
        const { name, email } = body;
        if (typeof name !== 'string' || !name.trim()) return send(res, 400, { error: 'name is required' });
        if (typeof email !== 'string' || !email.includes('@')) return send(res, 400, { error: 'invalid email' });
        const id = String(nextUserId++);
        users.set(id, { id, name, email, orders: [] });
        return send(res, 201, { id });
      }

      const user = users.get(parts[1]);

      // GET /users/<id>, DELETE /users/<id>
      if (parts.length === 2) {
        if (req.method === 'GET') {
          if (!user) return send(res, 404, { error: 'user not found' });
          return send(res, 200, { id: user.id, name: user.name, email: user.email });
        }
        if (req.method === 'DELETE') {
          if (!user) return send(res, 404, { error: 'user not found' });
          users.delete(user.id); // orders live on the user record, so they go with it
          return send(res, 204);
        }
        return send(res, 405, { error: 'method not allowed' });
      }

      // /users/<id>/orders
      if (parts.length === 3 && parts[2] === 'orders') {
        if (req.method === 'GET') {
          if (!user) return send(res, 404, { error: 'user not found' });
          return send(res, 200, user.orders);
        }
        if (req.method === 'POST') {
          if (!user) return send(res, 404, { error: 'user not found' });
          const body = await readJson(req);
          if (!body) return send(res, 400, { error: 'invalid JSON' });
          if (typeof body.item !== 'string' || !body.item.trim()) return send(res, 400, { error: 'item is required' });
          const id = String(nextOrderId++);
          user.orders.push({ id, item: body.item });
          return send(res, 201, { id });
        }
        return send(res, 405, { error: 'method not allowed' });
      }

      return send(res, 404, { error: 'not found' });
    } catch {
      if (!res.headersSent) send(res, 500, { error: 'internal error' });
    }
  });

  return server.listen(port);
}
