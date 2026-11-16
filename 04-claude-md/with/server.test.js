import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { start } from './server.js';

let server;
let base;

const ADMIN_KEY = 'test-admin-key';

before(async () => {
  process.env.ADMIN_KEY = ADMIN_KEY;
  server = start(0);
  await once(server, 'listening');
  base = `http://localhost:${server.address().port}`;
});

after(() => server.close());

async function req(method, path, body, extraHeaders = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...extraHeaders },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : undefined };
}

async function createUser(name = 'Ada', email = 'ada@example.com') {
  const r = await req('POST', '/users', { name, email });
  assert.equal(r.status, 201);
  return r.body.id;
}

test('POST /users returns 201 and an id', async () => {
  const r = await req('POST', '/users', { name: 'Ada', email: 'ada@example.com' });
  assert.equal(r.status, 201);
  assert.ok(r.body.id !== undefined);
});

test('GET /users/<id> returns the user', async () => {
  const id = await createUser('Grace', 'grace@example.com');
  const r = await req('GET', `/users/${id}`);
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { id, name: 'Grace', email: 'grace@example.com' });
});

test('each user gets a distinct id', async () => {
  const a = await createUser();
  const b = await createUser();
  assert.notEqual(a, b);
});

test('unknown user id is 404', async () => {
  const r = await req('GET', '/users/does-not-exist');
  assert.equal(r.status, 404);
});

test('email without @ is 400', async () => {
  const r = await req('POST', '/users', { name: 'Bob', email: 'bob.example.com' });
  assert.equal(r.status, 400);
});

test('missing name is 400', async () => {
  const r = await req('POST', '/users', { email: 'x@example.com' });
  assert.equal(r.status, 400);
});

test('malformed JSON is 400', async () => {
  const r = await req('POST', '/users', '{not json');
  assert.equal(r.status, 400);
});

test('POST /users/<id>/orders returns 201 and an id', async () => {
  const uid = await createUser();
  const r = await req('POST', `/users/${uid}/orders`, { item: 'book' });
  assert.equal(r.status, 201);
  assert.ok(r.body.id !== undefined);
});

test('GET /users/<id>/orders lists only that user\'s orders', async () => {
  const u1 = await createUser();
  const u2 = await createUser();
  const o1 = (await req('POST', `/users/${u1}/orders`, { item: 'book' })).body.id;
  const o2 = (await req('POST', `/users/${u1}/orders`, { item: 'pen' })).body.id;
  await req('POST', `/users/${u2}/orders`, { item: 'lamp' });

  const r = await req('GET', `/users/${u1}/orders`);
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.body));
  assert.deepEqual(r.body, [
    { id: o1, item: 'book' },
    { id: o2, item: 'pen' },
  ]);
});

test('new user has an empty order list', async () => {
  const uid = await createUser();
  const r = await req('GET', `/users/${uid}/orders`);
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, []);
});

test('orders for unknown user are 404', async () => {
  assert.equal((await req('GET', '/users/nope/orders')).status, 404);
  assert.equal((await req('POST', '/users/nope/orders', { item: 'x' })).status, 404);
});

test('order without item is 400', async () => {
  const uid = await createUser();
  const r = await req('POST', `/users/${uid}/orders`, {});
  assert.equal(r.status, 400);
});

const admin = { 'x-admin-key': ADMIN_KEY };

test('DELETE /users/<id> with admin key returns 204, then the id answers 410', async () => {
  const uid = await createUser();
  await req('POST', `/users/${uid}/orders`, { item: 'book' });
  assert.equal((await req('DELETE', `/users/${uid}`, undefined, admin)).status, 204);
  assert.equal((await req('GET', `/users/${uid}`)).status, 410);
  assert.equal((await req('GET', `/users/${uid}/orders`)).status, 410);
  assert.equal((await req('POST', `/users/${uid}/orders`, { item: 'pen' })).status, 410);
  assert.equal((await req('DELETE', `/users/${uid}`, undefined, admin)).status, 410);
});

test('DELETE /users/<id> without or with wrong admin key is 403 and keeps the user', async () => {
  const uid = await createUser();
  assert.equal((await req('DELETE', `/users/${uid}`)).status, 403);
  assert.equal((await req('DELETE', `/users/${uid}`, undefined, { 'x-admin-key': 'wrong' })).status, 403);
  assert.equal((await req('GET', `/users/${uid}`)).status, 200);
});

test('DELETE is 403 for everyone when ADMIN_KEY is unset', async () => {
  const uid = await createUser();
  delete process.env.ADMIN_KEY;
  try {
    assert.equal((await req('DELETE', `/users/${uid}`)).status, 403);
  } finally {
    process.env.ADMIN_KEY = ADMIN_KEY;
  }
});

test('DELETE unknown user is 404', async () => {
  assert.equal((await req('DELETE', '/users/nope', undefined, admin)).status, 404);
});
