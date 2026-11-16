// Written by Claude Code from TASK.md, in one run, until npm test passed.
// The code is as it wrote it; the comments were added afterwards to explain it.

import http from 'node:http'
import { randomInt } from 'node:crypto'

// Codes are 6 characters drawn from letters and digits (TASK.md).
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
// Refuse request bodies over 64 KB.
const MAX_BODY = 64 * 1024

// Builds the server. Links are kept in memory, so they're gone when it stops.
export function createServer() {
  const links = new Map() // code -> { url, visits }
  const codesByUrl = new Map() // url -> code

  // A new random code, tried again if it's already taken.
  const newCode = () => {
    let code
    do {
      code = Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
    } while (links.has(code))
    return code
  }

  // Sends a JSON answer (or an empty one) with a status and any extra headers.
  const send = (res, status, body, headers = {}) => {
    const json = body === undefined ? '' : JSON.stringify(body)
    res.writeHead(status, { ...(json && { 'content-type': 'application/json' }), ...headers })
    res.end(json)
  }

  // Reads the request body and parses it as JSON.
  const readJson = (req) => new Promise((resolve, reject) => {
    let data = ''
    req.setEncoding('utf8')
    req.on('data', (chunk) => {
      data += chunk
      if (data.length > MAX_BODY) reject(new Error('too large'))
    })
    req.on('end', () => {
      try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
    })
    req.on('error', reject)
  })

  // True only for a valid http or https url (so javascript: and plain text are refused).
  const isHttpUrl = (value) => {
    if (typeof value !== 'string') return false
    try {
      const { protocol } = new URL(value)
      return protocol === 'http:' || protocol === 'https:'
    } catch {
      return false
    }
  }

  return http.createServer(async (req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost')

    // POST /links: shorten a url, reusing its code if it was shortened before.
    if (req.method === 'POST' && pathname === '/links') {
      let body
      try { body = await readJson(req) } catch { return send(res, 400, { error: 'invalid JSON' }) }
      const url = body?.url
      if (!isHttpUrl(url)) return send(res, 400, { error: 'url must be http or https' })
      let code = codesByUrl.get(url)
      if (!code) {
        code = newCode()
        links.set(code, { url, visits: 0 })
        codesByUrl.set(url, code)
      }
      return send(res, 201, { code })
    }

    let m
    // PUT /links/<code>: change a link's url (admins only).
    if (req.method === 'PUT' && (m = pathname.match(/^\/links\/([^/]+)$/))) {
      const adminKey = process.env.ADMIN_KEY
      if (!adminKey || req.headers['x-admin-key'] !== adminKey) return send(res, 403, { error: 'forbidden' })
      const code = m[1]
      const link = links.get(code)
      if (!link) return send(res, 404, { error: 'not found' })
      let body
      try { body = await readJson(req) } catch { return send(res, 400, { error: 'invalid JSON' }) }
      const url = body?.url
      if (!isHttpUrl(url)) return send(res, 400, { error: 'url must be http or https' })
      const owner = codesByUrl.get(url)
      if (owner && owner !== code) return send(res, 409, { error: 'url already has a code' })
      if (url !== link.url) {
        codesByUrl.delete(link.url)
        link.url = url
        codesByUrl.set(url, code)
      }
      return send(res, 200, { code, url })
    }

    // GET /links/<code>/stats: the url and how many times it was visited.
    if (req.method === 'GET' && (m = pathname.match(/^\/links\/([A-Za-z0-9]{6})\/stats$/))) {
      const link = links.get(m[1])
      if (!link) return send(res, 404, { error: 'not found' })
      return send(res, 200, { url: link.url, visits: link.visits })
    }

    // GET /<code>: count the visit and redirect to the url.
    if (req.method === 'GET' && (m = pathname.match(/^\/([A-Za-z0-9]{6})$/))) {
      const link = links.get(m[1])
      if (!link) return send(res, 404, { error: 'not found' })
      link.visits++
      return send(res, 302, undefined, { location: link.url })
    }

    // Anything else is unknown.
    send(res, 404, { error: 'not found' })
  })
}

// Starts listening on a port; the tests pass 0 for any free port.
export function start(port = 3000) {
  const server = createServer()
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, () => resolve(server))
  })
}

// Run directly (node server.js) to start it on port 3000 or $PORT.
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = await start(Number(process.env.PORT) || 3000)
  console.log(`listening on ${server.address().port}`)
}
