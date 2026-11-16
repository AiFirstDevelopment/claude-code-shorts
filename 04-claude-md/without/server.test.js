import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { start } from './server.js';

let server;
let base;

before(async () => {
  server = start(0);
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

const post = (body) =>
  fetch(`${base}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

test('POST /products creates a product', async () => {
  const res = await post({ name: 'Widget' });
  assert.equal(res.status, 201);
  const product = await res.json();
  assert.equal(product.name, 'Widget');
  assert.ok(product.id !== undefined);
});

test('GET /products/<id> returns the created product', async () => {
  const created = await (await post({ name: 'Gadget' })).json();
  const res = await fetch(`${base}/products/${created.id}`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { id: created.id, name: 'Gadget' });
});

test('created products get distinct ids', async () => {
  const a = await (await post({ name: 'A' })).json();
  const b = await (await post({ name: 'B' })).json();
  assert.notEqual(a.id, b.id);
});

test('unknown id is 404', async () => {
  const res = await fetch(`${base}/products/does-not-exist`);
  assert.equal(res.status, 404);
});

test('product without a name is 400', async () => {
  assert.equal((await post({})).status, 400);
  assert.equal((await post({ name: '' })).status, 400);
  assert.equal((await post({ name: 42 })).status, 400);
});

test('invalid JSON is 400', async () => {
  assert.equal((await post('{not json')).status, 400);
  assert.equal((await post('null')).status, 400);
});

test('DELETE /products/<id> removes the product', async () => {
  const created = await (await post({ name: 'Doomed' })).json();
  const url = `${base}/products/${created.id}`;
  const res = await fetch(url, { method: 'DELETE' });
  assert.equal(res.status, 204);
  assert.equal((await fetch(url)).status, 404);
  assert.equal((await fetch(url, { method: 'DELETE' })).status, 404);
});

test('DELETE of an unknown id is 404', async () => {
  const res = await fetch(`${base}/products/does-not-exist`, { method: 'DELETE' });
  assert.equal(res.status, 404);
});
