import http from 'node:http';
import { randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

const MIN_PASSWORD = 12;
const MAX_PASSWORD = 1024; // bounds the work scrypt is asked to do
const MAX_EMAIL = 254;
const MAX_BODY = 10 * 1024;
const KEY_LENGTH = 64;
const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;
const BAD_LOGIN = 'Invalid email or password';

const hashPassword = (password, salt) => scryptAsync(password, salt, KEY_LENGTH);

function send(res, status, body, headers = {}) {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(text),
    'cache-control': 'no-store',
    ...headers,
  });
  res.end(text);
}

// Resolves to the parsed JSON object, or null when the body is not one.
function readJson(req) {
  return new Promise((resolve) => {
    const chunks = [];
    let size = 0;
    let tooBig = false;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) tooBig = true;
      else chunks.push(chunk);
    });
    req.on('error', () => resolve(null));
    req.on('end', () => {
      if (tooBig) return resolve(null);
      try {
        const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        resolve(value && typeof value === 'object' && !Array.isArray(value) ? value : null);
      } catch {
        resolve(null);
      }
    });
  });
}

function createApp({ now = Date.now } = {}) {
  const users = new Map(); // lower-case email -> { id, email, salt, hash }
  const tokens = new Map(); // token -> user id
  const failures = new Map(); // lower-case email -> { count, lockedUntil, last }

  // Hashed for logins to unknown emails, so they take as long as known ones.
  const dummySalt = randomBytes(16);
  const dummyHash = hashPassword('not a real password', dummySalt);

  // Forget counters that have been idle for a full lock period.
  const sweep = setInterval(() => {
    const t = now();
    for (const [email, f] of failures) {
      if (t >= f.lockedUntil && t - f.last >= LOCK_MS) failures.delete(email);
    }
  }, 60 * 1000);
  sweep.unref();

  async function signup(req, res) {
    const body = await readJson(req);
    if (!body) return send(res, 400, { error: 'Body must be a JSON object' });
    const { email, password } = body;
    if (typeof email !== 'string' || email.length > MAX_EMAIL || !/^[^\s@]+@[^\s@]+$/.test(email)) {
      return send(res, 400, { error: 'A valid email is required' });
    }
    if (typeof password !== 'string' || password.length < MIN_PASSWORD) {
      return send(res, 400, { error: `Password must be at least ${MIN_PASSWORD} characters` });
    }
    if (password.length > MAX_PASSWORD) {
      return send(res, 400, { error: `Password must be at most ${MAX_PASSWORD} characters` });
    }
    const key = email.toLowerCase();
    const taken = () => send(res, 409, { error: 'Email already registered' });
    if (users.has(key)) return taken();

    const salt = randomBytes(16);
    const hash = await hashPassword(password, salt);
    if (users.has(key)) return taken(); // signed up while we were hashing

    const user = { id: randomUUID(), email: key, salt, hash };
    users.set(key, user);
    send(res, 201, { id: user.id, email: user.email });
  }

  async function login(req, res) {
    const body = await readJson(req);
    const unauthorized = () => send(res, 401, { error: BAD_LOGIN });
    if (!body || typeof body.email !== 'string' || typeof body.password !== 'string'
      || body.email.length > MAX_EMAIL || body.password.length > MAX_PASSWORD) {
      return unauthorized();
    }
    const key = body.email.toLowerCase();
    const t = now();

    // Unknown emails are counted and locked too, so 429 does not reveal which emails exist.
    let f = failures.get(key);
    if (f && f.lockedUntil && t >= f.lockedUntil) {
      failures.delete(key);
      f = undefined;
    }
    if (f && f.lockedUntil) {
      return send(res, 429, { error: 'Too many failed logins. Try again later.' },
        { 'retry-after': Math.ceil((f.lockedUntil - t) / 1000) });
    }

    const user = users.get(key);
    const actual = await hashPassword(body.password, user ? user.salt : dummySalt);
    const expected = user ? user.hash : await dummyHash;
    const ok = timingSafeEqual(actual, expected) && Boolean(user);

    if (!ok) {
      // Re-read: other attempts may have been counted while we were hashing.
      const g = failures.get(key) ?? { count: 0, lockedUntil: 0, last: 0 };
      g.count += 1;
      g.last = now();
      if (g.count >= MAX_FAILURES && !g.lockedUntil) g.lockedUntil = g.last + LOCK_MS;
      failures.set(key, g);
      return unauthorized();
    }

    // A right password that raced with the attempts that locked the account does not get in.
    if (failures.get(key)?.lockedUntil > now()) {
      return send(res, 429, { error: 'Too many failed logins. Try again later.' },
        { 'retry-after': Math.ceil((failures.get(key).lockedUntil - now()) / 1000) });
    }
    failures.delete(key);
    const token = randomBytes(32).toString('hex');
    tokens.set(token, user.id);
    send(res, 200, { token });
  }

  const routes = { '/signup': signup, '/login': login };

  const server = http.createServer((req, res) => {
    const path = (req.url ?? '').split('?')[0];
    const handler = routes[path];
    if (!handler) return send(res, 404, { error: 'Not found' });
    if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' }, { allow: 'POST' });
    handler(req, res).catch(() => {
      if (!res.headersSent) send(res, 500, { error: 'Internal error' });
      else res.destroy();
    });
  });
  server.on('close', () => clearInterval(sweep));
  return server;
}

// Starts the API on the given port and resolves to the listening server.
// options.now replaces the clock (milliseconds), for testing the lockout.
export function start(port, options) {
  return new Promise((resolve, reject) => {
    const server = createApp(options);
    server.once('error', reject);
    server.listen(port, () => {
      server.off('error', reject);
      resolve(server);
    });
  });
}
