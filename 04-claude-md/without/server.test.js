import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { start } from './server.js';

let server;
let base;

before(async () => {
  server = start(0);
  await once(server, 'listening');
  base = `http://localhost:${server.address().port}`;
});

after(() => server.close());

async function req(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
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

test('DELETE /users/<id> removes the user and their orders', async () => {
  const uid = await createUser();
  await req('POST', `/users/${uid}/orders`, { item: 'book' });
  const r = await req('DELETE', `/users/${uid}`);
  assert.equal(r.status, 204);
  assert.equal((await req('GET', `/users/${uid}`)).status, 404);
  assert.equal((await req('GET', `/users/${uid}/orders`)).status, 404);
  assert.equal((await req('POST', `/users/${uid}/orders`, { item: 'x' })).status, 404);
});

test('DELETE leaves other users intact', async () => {
  const keep = await createUser('Keep', 'keep@example.com');
  const gone = await createUser();
  await req('DELETE', `/users/${gone}`);
  assert.equal((await req('GET', `/users/${keep}`)).status, 200);
});

test('DELETE unknown or already-deleted user is 404', async () => {
  assert.equal((await req('DELETE', '/users/nope')).status, 404);
  const uid = await createUser();
  await req('DELETE', `/users/${uid}`);
  assert.equal((await req('DELETE', `/users/${uid}`)).status, 404);
});

test('deleted ids are not reused', async () => {
  const a = await createUser();
  await req('DELETE', `/users/${a}`);
  const b = await createUser();
  assert.notEqual(a, b);
});

test('order without item is 400', async () => {
  const uid = await createUser();
  const r = await req('POST', `/users/${uid}/orders`, {});
  assert.equal(r.status, 400);
});
