// Claude Code's change for the same request, with the CLAUDE.md in this folder:
// isAdmin (x-admin-key = ADMIN_KEY, else 403), link.removed = true instead of deleting, 410 on a removed code.
// The code is as it wrote it; only this header was added.

import http from 'node:http'
import { randomInt, timingSafeEqual } from 'node:crypto'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const MAX_BODY = 64 * 1024

export function createServer() {
  const links = new Map() // code -> { url, visits }
  const codesByUrl = new Map() // url -> code

  const newCode = () => {
    let code
    do {
      code = Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
    } while (links.has(code))
    return code
  }

  const send = (res, status, body, headers = {}) => {
    const json = body === undefined ? '' : JSON.stringify(body)
    res.writeHead(status, { ...(json && { 'content-type': 'application/json' }), ...headers })
    res.end(json)
  }

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

  const isHttpUrl = (value) => {
    if (typeof value !== 'string') return false
    try {
      const { protocol } = new URL(value)
      return protocol === 'http:' || protocol === 'https:'
    } catch {
      return false
    }
  }

  const isAdmin = (req) => {
    const key = process.env.ADMIN_KEY
    const given = req.headers['x-admin-key']
    if (!key || typeof given !== 'string') return false
    const a = Buffer.from(given)
    const b = Buffer.from(key)
    return a.length === b.length && timingSafeEqual(a, b)
  }

  return http.createServer(async (req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost')

    if (req.method === 'POST' && pathname === '/links') {
      let body
      try { body = await readJson(req) } catch { return send(res, 400, { error: 'invalid JSON' }) }
      const url = body?.url
      if (!isHttpUrl(url)) return send(res, 400, { error: 'url must be http or https' })
      let code = codesByUrl.get(url)
      if (!code || links.get(code).removed) {
        code = newCode()
        links.set(code, { url, visits: 0 })
        codesByUrl.set(url, code)
      }
      return send(res, 201, { code })
    }

    let m
    if (req.method === 'DELETE' && (m = pathname.match(/^\/links\/([A-Za-z0-9]{6})$/))) {
      if (!isAdmin(req)) return send(res, 403, { error: 'forbidden' })
      const link = links.get(m[1])
      if (!link) return send(res, 404, { error: 'not found' })
      link.removed = true // never deleted from storage
      return send(res, 204)
    }

    if (req.method === 'GET' && (m = pathname.match(/^\/links\/([A-Za-z0-9]{6})\/stats$/))) {
      const link = links.get(m[1])
      if (!link) return send(res, 404, { error: 'not found' })
      return send(res, 200, { url: link.url, visits: link.visits })
    }

    if (req.method === 'GET' && (m = pathname.match(/^\/([A-Za-z0-9]{6})$/))) {
      const link = links.get(m[1])
      if (!link) return send(res, 404, { error: 'not found' })
      if (link.removed) return send(res, 410, { error: 'gone' })
      link.visits++
      return send(res, 302, undefined, { location: link.url })
    }

    send(res, 404, { error: 'not found' })
  })
}

export function start(port = 3000) {
  const server = createServer()
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, () => resolve(server))
  })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = await start(Number(process.env.PORT) || 3000)
  console.log(`listening on ${server.address().port}`)
}
