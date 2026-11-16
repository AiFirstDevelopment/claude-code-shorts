// Tests for changing a link's url (PUT /links/<code>), from TASK.md.
// Each test sends real HTTP requests and checks the answer.

import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { start } from './server.js'

const KEY = 'test-admin-key'
let base, server
before(async () => { process.env.ADMIN_KEY = KEY; server = await start(0); base = `http://localhost:${server.address().port}` })
after(() => { server.close(); delete process.env.ADMIN_KEY })

const json = { 'content-type': 'application/json' }
const shorten = async (url) => (await (await fetch(`${base}/links`, { method: 'POST', headers: json, body: JSON.stringify({ url }) })).json()).code
const change = (code, body, key = KEY) => fetch(`${base}/links/${code}`, {
  method: 'PUT',
  headers: { ...json, ...(key != null && { 'x-admin-key': key }) },
  body: typeof body === 'string' ? body : JSON.stringify(body),
})
const stats = async (code) => (await fetch(`${base}/links/${code}/stats`)).json()
const visit = (code) => fetch(`${base}/${code}`, { redirect: 'manual' })

test('PUT returns 200 and {code, url} with the new url', async () => {
  const code = await shorten('https://example.com/u1')
  const res = await change(code, { url: 'https://example.com/u1-new' })
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { code, url: 'https://example.com/u1-new' })
})

test('redirects to the new url under the same code', async () => {
  const code = await shorten('https://example.com/u2')
  await change(code, { url: 'https://example.com/u2-new' })
  const res = await visit(code)
  assert.equal(res.status, 302)
  assert.equal(res.headers.get('location'), 'https://example.com/u2-new')
})

test('visits are kept across a change', async () => {
  const code = await shorten('https://example.com/u3')
  await visit(code); await visit(code)
  await change(code, { url: 'https://example.com/u3-new' })
  assert.deepEqual(await stats(code), { url: 'https://example.com/u3-new', visits: 2 })
})

test('missing or wrong admin key is 403 and nothing changes', async () => {
  const code = await shorten('https://example.com/u4')
  assert.equal((await change(code, { url: 'https://example.com/u4-new' }, null)).status, 403)
  assert.equal((await change(code, { url: 'https://example.com/u4-new' }, 'wrong')).status, 403)
  assert.equal((await stats(code)).url, 'https://example.com/u4')
})

test('key is checked first: unknown code without key is 403', async () => {
  assert.equal((await change('zzzzzz', { url: 'https://example.com/x' }, 'wrong')).status, 403)
})

test('unset ADMIN_KEY makes every change 403', async () => {
  const code = await shorten('https://example.com/u5')
  delete process.env.ADMIN_KEY
  try {
    assert.equal((await change(code, { url: 'https://example.com/u5-new' }, '')).status, 403)
    assert.equal((await change(code, { url: 'https://example.com/u5-new' }, 'undefined')).status, 403)
  } finally { process.env.ADMIN_KEY = KEY }
  assert.equal((await stats(code)).url, 'https://example.com/u5')
})

test('unknown code is 404', async () => {
  assert.equal((await change('zzzzzz', { url: 'https://example.com/x' })).status, 404)
})

test('non-http url or non-JSON body is 400 and nothing changes', async () => {
  const code = await shorten('https://example.com/u6')
  assert.equal((await change(code, { url: 'javascript:alert(1)' })).status, 400)
  assert.equal((await change(code, { url: 'not a url' })).status, 400)
  assert.equal((await change(code, {})).status, 400)
  assert.equal((await change(code, 'not json')).status, 400)
  assert.equal((await stats(code)).url, 'https://example.com/u6')
})

test('url that already has a different code is 409 and neither link changes', async () => {
  const a = await shorten('https://example.com/u7a')
  const b = await shorten('https://example.com/u7b')
  assert.equal((await change(a, { url: 'https://example.com/u7b' })).status, 409)
  assert.equal((await stats(a)).url, 'https://example.com/u7a')
  assert.equal((await stats(b)).url, 'https://example.com/u7b')
  assert.equal(await shorten('https://example.com/u7b'), b)
})

test('changing to the same url is 200 and changes nothing', async () => {
  const code = await shorten('https://example.com/u8')
  await visit(code)
  const res = await change(code, { url: 'https://example.com/u8' })
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { code, url: 'https://example.com/u8' })
  assert.deepEqual(await stats(code), { url: 'https://example.com/u8', visits: 1 })
  assert.equal(await shorten('https://example.com/u8'), code)
})

test('after a change, new url maps to the code and old url gets a new code', async () => {
  const code = await shorten('https://example.com/u9')
  await change(code, { url: 'https://example.com/u9-new' })
  assert.equal(await shorten('https://example.com/u9-new'), code)
  const fresh = await shorten('https://example.com/u9')
  assert.notEqual(fresh, code)
  assert.match(fresh, /^[A-Za-z0-9]{6}$/)
  assert.equal((await stats(fresh)).url, 'https://example.com/u9')
})
