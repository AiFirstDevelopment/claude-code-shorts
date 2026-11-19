// Covers the TASK.md rules that server.test.js does not check.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { start } from './server.js';

let clock = 1_000_000;
const server = await start(0, { now: () => clock });
const base = `http://localhost:${server.address().port}`;
after(() => server.close());

const post = (path, body, raw) => fetch(base + path, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: raw ?? JSON.stringify(body),
});
const pw = 'correct horse battery';
const wrongPw = 'wrong password!!';

test('emails are lower-cased, and the same email in another case is 409', async () => {
  const res = await post('/signup', { email: 'Ada@Example.COM', password: pw });
  assert.equal(res.status, 201);
  assert.equal((await res.json()).email, 'ada@example.com');
  assert.equal((await post('/signup', { email: 'ADA@example.com', password: pw })).status, 409);
  assert.equal((await post('/login', { email: 'ADA@EXAMPLE.COM', password: pw })).status, 200);
});

test('no response contains the password', async () => {
  const secret = 'a very secret passphrase';
  const email = 'secret@example.com';
  const responses = [
    await post('/signup', { email, password: secret }),
    await post('/signup', { email, password: secret }),
    await post('/login', { email, password: secret }),
    await post('/login', { email: 'nobody@example.com', password: secret }),
  ];
  assert.deepEqual(responses.map((r) => r.status), [201, 409, 200, 401]);
  const bodies = await Promise.all(responses.map((r) => r.text()));
  for (const body of bodies) assert.ok(!body.includes(secret));
  assert.deepEqual(Object.keys(JSON.parse(bodies[0])).sort(), ['email', 'id']);
  assert.deepEqual(Object.keys(JSON.parse(bodies[2])), ['token']);
});

test('the password limit is exactly 12 characters', async () => {
  assert.equal((await post('/signup', { email: 'len@example.com', password: '12345678901' })).status, 400);
  assert.equal((await post('/signup', { email: 'len@example.com', password: '123456789012' })).status, 201);
});

test('malformed signups are 400', async () => {
  assert.equal((await post('/signup', null, '{nope')).status, 400);
  assert.equal((await post('/signup', { email: 'x@example.com' })).status, 400);
  assert.equal((await post('/signup', { email: 5, password: pw })).status, 400);
  assert.equal((await post('/signup', { email: 'x@example.com', password: 123456789012 })).status, 400);
});

test('a wrong password and an unknown email get the same 401', async () => {
  await post('/signup', { email: 'same@example.com', password: pw });
  const wrong = await post('/login', { email: 'same@example.com', password: wrongPw });
  const unknown = await post('/login', { email: 'unknown@example.com', password: wrongPw });
  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  assert.equal(await wrong.text(), await unknown.text());
  assert.equal((await post('/login', null, 'garbage')).status, 401);
  assert.equal((await post('/login', { email: 'same@example.com' })).status, 401);
});

test('5 wrong passwords lock the email for 15 minutes', async () => {
  const email = 'lock@example.com';
  await post('/signup', { email, password: pw });
  // four misses then a success: the count starts again
  for (let i = 0; i < 4; i++) await post('/login', { email, password: wrongPw });
  assert.equal((await post('/login', { email, password: pw })).status, 200);
  for (let i = 0; i < 5; i++) {
    assert.equal((await post('/login', { email, password: wrongPw })).status, 401);
  }
  const locked = await post('/login', { email: 'LOCK@example.com', password: pw });
  assert.equal(locked.status, 429);
  assert.ok(locked.headers.get('retry-after'));
  clock += 15 * 60 * 1000 - 1;
  assert.equal((await post('/login', { email, password: pw })).status, 429);
  clock += 1;
  assert.equal((await post('/login', { email, password: pw })).status, 200);
});

test('an unknown email locks the same way as a known one', async () => {
  const email = 'ghost@example.com';
  for (let i = 0; i < 5; i++) {
    assert.equal((await post('/login', { email, password: wrongPw })).status, 401);
  }
  assert.equal((await post('/login', { email, password: wrongPw })).status, 429);
});

test('a burst of wrong passwords still locks, and racing signups make one user', async () => {
  const email = 'burst@example.com';
  await post('/signup', { email, password: pw });
  await Promise.all(Array.from({ length: 20 }, () => post('/login', { email, password: wrongPw })));
  assert.equal((await post('/login', { email, password: pw })).status, 429);
  const dup = await Promise.all(
    Array.from({ length: 5 }, () => post('/signup', { email: 'race@example.com', password: pw })),
  );
  assert.equal(dup.filter((r) => r.status === 201).length, 1);
});

test('other methods and paths are refused', async () => {
  assert.equal((await fetch(base + '/signup')).status, 405);
  assert.equal((await fetch(base + '/nope')).status, 404);
});
