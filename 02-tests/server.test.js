// The check: the tests Claude Code had to make pass.
// Each test sends real HTTP requests to the server and checks the answer,
// the way a user would see it. Nothing here looks at how server.js works inside.
// Run them with: npm test

import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { start } from './server.js'

// Start the server once on a free port (0 lets the OS pick one), and stop it at the end.
let base, server
before(async () => { server = await start(0); base = `http://localhost:${server.address().port}` })
after(() => server.close())

// Helper: ask the server to shorten a url (POST /links with {"url"}).
const shorten = (url) => fetch(`${base}/links`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url }) })

// Rules: POST /links returns 201 and {"code"}; codes are 6 letters or digits.
test('shortens a url to a 6-character code', async () => {
  const res = await shorten('https://example.com/a')
  assert.equal(res.status, 201)
  const { code } = await res.json()
  assert.match(code, /^[A-Za-z0-9]{6}$/)
})

// Rules: GET /<code> redirects (302) to the url; GET /links/<code>/stats returns {"url", "visits"}.
test('redirects and counts visits', async () => {
  const { code } = await (await shorten('https://example.com/b')).json()
  // redirect: 'manual' so we see the 302 itself instead of following it
  const res = await fetch(`${base}/${code}`, { redirect: 'manual' })
  assert.equal(res.status, 302)
  assert.equal(res.headers.get('location'), 'https://example.com/b')
  await fetch(`${base}/${code}`, { redirect: 'manual' })
  const stats = await (await fetch(`${base}/links/${code}/stats`)).json()
  assert.deepEqual(stats, { url: 'https://example.com/b', visits: 2 })
})

// Rule: the same url always gets the same code.
test('the same url gets the same code', async () => {
  const a = await (await shorten('https://example.com/c')).json()
  const b = await (await shorten('https://example.com/c')).json()
  assert.equal(a.code, b.code)
})

// Rule: a url that isn't http or https is 400. Bad input gets a test too.
test('rejects a url that is not http or https', async () => {
  assert.equal((await shorten('javascript:alert(1)')).status, 400)
  assert.equal((await shorten('not a url')).status, 400)
})

// Rule: unknown codes are 404.
test('unknown code is 404', async () => {
  assert.equal((await fetch(`${base}/zzzzzz`, { redirect: 'manual' })).status, 404)
})
