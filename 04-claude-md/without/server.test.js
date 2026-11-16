import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { start } from './server.js';

let server, base;

before(async () => {
  server = start(0);
  await once(server, 'listening');
  base = `http://localhost:${server.address().port}`;
});

after(() => server.close());

const post = (path, body) =>
  fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });

test('POST /orders creates an order', async () => {
  const res = await post('/orders', { customerId: 'c1', item: 'mug' });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.ok(body.id);
  assert.equal(body.status, 'placed');
});

test('GET /orders/<id> returns the order', async () => {
  const { id } = await (await post('/orders', { customerId: 'c2', item: 'hat' })).json();
  const res = await fetch(`${base}/orders/${id}`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { id, customerId: 'c2', item: 'hat', status: 'placed' });
});

test('unknown id is 404', async () => {
  assert.equal((await fetch(`${base}/orders/nope`)).status, 404);
  assert.equal((await post('/orders/nope/ship')).status, 404);
});

test('order without an item is 400', async () => {
  assert.equal((await post('/orders', { customerId: 'c3' })).status, 400);
  assert.equal((await post('/orders', { customerId: 'c3', item: '' })).status, 400);
  assert.equal((await post('/orders', '{bad json')).status, 400);
});

test('POST /orders/<id>/ship ships the order', async () => {
  const { id } = await (await post('/orders', { customerId: 'c4', item: 'sock' })).json();
  const res = await post(`/orders/${id}/ship`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { id, customerId: 'c4', item: 'sock', status: 'shipped' });
  const after = await (await fetch(`${base}/orders/${id}`)).json();
  assert.equal(after.status, 'shipped');
});

test('ids are unique', async () => {
  const a = await (await post('/orders', { customerId: 'c5', item: 'a' })).json();
  const b = await (await post('/orders', { customerId: 'c5', item: 'b' })).json();
  assert.notEqual(a.id, b.id);
});

test('POST /orders/<id>/cancel cancels a placed order', async () => {
  const { id } = await (await post('/orders', { customerId: 'c6', item: 'pen' })).json();
  const res = await post(`/orders/${id}/cancel`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { id, customerId: 'c6', item: 'pen', status: 'cancelled' });
  assert.equal((await (await fetch(`${base}/orders/${id}`)).json()).status, 'cancelled');
  assert.equal((await post(`/orders/${id}/cancel`)).status, 200);
  assert.equal((await post(`/orders/${id}/ship`)).status, 409);
});

test('cannot cancel a shipped order; unknown id is 404', async () => {
  const { id } = await (await post('/orders', { customerId: 'c7', item: 'cup' })).json();
  await post(`/orders/${id}/ship`);
  assert.equal((await post(`/orders/${id}/cancel`)).status, 409);
  assert.equal((await (await fetch(`${base}/orders/${id}`)).json()).status, 'shipped');
  assert.equal((await post('/orders/nope/cancel')).status, 404);
});
