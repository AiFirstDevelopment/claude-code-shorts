// The tests cover the main path. The task has more rules than these tests check.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { start } from './server.js';

const server = await start(0);
const base = `http://localhost:${server.address().port}`;
after(() => server.close());

const post = (path, body) => fetch(base + path, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
});

test('signs up a user', async () => {
  const res = await post('/signup', { email: 'ada@example.com', password: 'correct horse battery' });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.email, 'ada@example.com');
  assert.ok(body.id);
});

test('the same email twice is 409', async () => {
  await post('/signup', { email: 'bob@example.com', password: 'correct horse battery' });
  const res = await post('/signup', { email: 'bob@example.com', password: 'correct horse battery' });
  assert.equal(res.status, 409);
});

test('a short password is 400', async () => {
  const res = await post('/signup', { email: 'cy@example.com', password: 'short' });
  assert.equal(res.status, 400);
});

test('logs in with the right password, not the wrong one', async () => {
  await post('/signup', { email: 'dee@example.com', password: 'correct horse battery' });
  const ok = await post('/login', { email: 'dee@example.com', password: 'correct horse battery' });
  assert.equal(ok.status, 200);
  assert.ok((await ok.json()).token);
  const bad = await post('/login', { email: 'dee@example.com', password: 'wrong password!!' });
  assert.equal(bad.status, 401);
});
