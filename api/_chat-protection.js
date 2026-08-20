'use strict';

const crypto = require('crypto');

// These defaults are deliberately conservative for a public portfolio demo.
// Every value can be overridden with a CHAT_* environment variable after
// observing real traffic and provider billing.
const DEFAULTS = Object.freeze({
  challengeTtlSeconds: 300,
  challengeAttemptsWindowMs: 10 * 60 * 1000,
  challengeAttemptsMax: 30,
  requestAttemptsWindowMs: 10 * 60 * 1000,
  requestAttemptsMax: 20,
  ipWindowMs: 10 * 60 * 1000,
  ipWindowMax: 5,
  ipDayMs: 24 * 60 * 60 * 1000,
  ipDayMax: 20,
  sessionWindowMs: 60 * 60 * 1000,
  sessionWindowMax: 20,
  globalDayMs: 24 * 60 * 60 * 1000,
  globalDayMax: 200,
  globalConcurrency: 10,
  leaseTtlSeconds: 90,
  upstreamTimeoutMs: 30000,
  maxMessageChars: 800,
  maxBodyChars: 8192,
  redisTimeoutMs: 3500,
  turnstileTimeoutMs: 5000
});

const LOCAL_SECRET = crypto.randomBytes(32).toString('hex');
const localState = {
  challenges: new Map(),
  windows: new Map(),
  locks: new Map(),
  slots: new Map()
};

const SLIDING_WINDOW_SCRIPT = [
  'local key = KEYS[1]',
  'local now = tonumber(ARGV[1])',
  'local window = tonumber(ARGV[2])',
  'local limit = tonumber(ARGV[3])',
  'local member = ARGV[4]',
  'local cutoff = now - window',
  "redis.call('ZREMRANGEBYSCORE', key, 0, cutoff)",
  "local count = redis.call('ZCARD', key)",
  'if count >= limit then',
  "  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')",
  '  local retry = 1',
  '  if oldest[2] then',
  '    retry = math.max(1, math.ceil((tonumber(oldest[2]) + window - now) / 1000))',
  '  end',
  '  return {0, count, retry}',
  'end',
  "redis.call('ZADD', key, now, member)",
  "redis.call('EXPIRE', key, math.ceil(window / 1000) + 5)",
  'return {1, count + 1, 0}'
].join('\n');

const RELEASE_IF_OWNER_SCRIPT = [
  "if redis.call('GET', KEYS[1]) == ARGV[1] then",
  "  return redis.call('DEL', KEYS[1])",
  'end',
  'return 0'
].join('\n');

const RENEW_IF_OWNER_SCRIPT = [
  "if redis.call('GET', KEYS[1]) == ARGV[1] then",
  "  return redis.call('EXPIRE', KEYS[1], ARGV[2])",
  'end',
  'return 0'
].join('\n');

class ProtectionError extends Error {
  constructor(status, code, message, retryAfter) {
    super(message);
    this.name = 'ProtectionError';
    this.status = status;
    this.code = code;
    this.retryAfter = Number.isFinite(Number(retryAfter)) ? Number(retryAfter) : 0;
  }
}

class RedisStore {
  constructor(url, token, timeoutMs, namespace) {
    this.url = String(url || '').replace(/\/+$/, '');
    this.token = String(token || '');
    this.timeoutMs = timeoutMs;
    this.namespace = String(namespace || 'production').replace(/[^A-Za-z0-9:_-]/g, '_');
  }

  scopedKey(key) {
    return `chat-protection:${this.namespace}:${String(key || '')}`;
  }

  async command(parts) {
    const controller = new AbortController();
    const timer = setTimeout(function () {
      controller.abort();
    }, this.timeoutMs);

    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(parts),
        signal: controller.signal
      });
      const payload = await response.json().catch(function () { return null; });
      if (!response.ok || !payload || payload.error
        || !Object.prototype.hasOwnProperty.call(payload, 'result')) {
        throw new Error('Redis command failed');
      }
      return payload.result;
    } finally {
      clearTimeout(timer);
    }
  }

  async setNx(key, value, ttlSeconds) {
    const result = await this.command([
      'SET', this.scopedKey(key), String(value), 'EX', String(Math.max(1, Math.ceil(ttlSeconds))), 'NX'
    ]);
    return result === 'OK';
  }

  async getDel(key) {
    return this.command(['GETDEL', this.scopedKey(key)]);
  }

  async releaseIfOwner(key, owner) {
    return this.command(['EVAL', RELEASE_IF_OWNER_SCRIPT, '1', this.scopedKey(key), String(owner)]);
  }

  async extendIfOwner(key, owner, ttlSeconds) {
    const result = await this.command([
      'EVAL',
      RENEW_IF_OWNER_SCRIPT,
      '1',
      this.scopedKey(key),
      String(owner),
      String(Math.max(1, Math.ceil(ttlSeconds)))
    ]);
    return Number(result) === 1;
  }

  async slidingWindow(key, now, windowMs, limit, member) {
    const result = await this.command([
      'EVAL',
      SLIDING_WINDOW_SCRIPT,
      '1',
      this.scopedKey(key),
      String(now),
      String(windowMs),
      String(limit),
      String(member)
    ]);
    if (!Array.isArray(result) || result.length < 3) {
      throw new Error('Redis limiter returned an invalid result');
    }
    const values = result;
    return {
      allowed: Number(values[0]) === 1,
      count: Number(values[1] || 0),
      retryAfter: Number(values[2] || 0)
    };
  }
}

class MemoryStore {
  pruneMap(map, now) {
    map.forEach(function (entry, key) {
      if (entry.expiresAt <= now) map.delete(key);
    });
  }

  async setNx(key, value, ttlSeconds) {
    const now = Date.now();
    this.pruneMap(localState.challenges, now);
    this.pruneMap(localState.locks, now);
    this.pruneMap(localState.slots, now);
    const existing = localState.challenges.get(key)
      || localState.locks.get(key)
      || localState.slots.get(key);
    if (existing && existing.expiresAt > now) return false;
    const target = key.includes(':challenge:')
      ? localState.challenges
      : key.includes(':slot:')
        ? localState.slots
        : localState.locks;
    target.set(key, { value: String(value), expiresAt: now + Math.max(1, ttlSeconds) * 1000 });
    return true;
  }

  async getDel(key) {
    const now = Date.now();
    this.pruneMap(localState.challenges, now);
    const item = localState.challenges.get(key);
    if (!item) return null;
    localState.challenges.delete(key);
    return item.value;
  }

  async releaseIfOwner(key, owner) {
    const maps = [localState.locks, localState.slots];
    for (const map of maps) {
      const item = map.get(key);
      if (item && item.value === String(owner)) {
        map.delete(key);
        return 1;
      }
    }
    return 0;
  }

  async extendIfOwner(key, owner, ttlSeconds) {
    const now = Date.now();
    const maps = [localState.locks, localState.slots];
    for (const map of maps) {
      const item = map.get(key);
      if (item && item.value === String(owner) && item.expiresAt > now) {
        item.expiresAt = now + Math.max(1, ttlSeconds) * 1000;
        return true;
      }
    }
    return false;
  }

  async slidingWindow(key, now, windowMs, limit, member) {
    const existing = localState.windows.get(key) || [];
    const cutoff = now - windowMs;
    const active = existing.filter(function (entry) { return entry.time > cutoff; });
    if (active.length === 0 && existing.length > 0) {
      localState.windows.delete(key);
    }
    if (active.length >= limit) {
      const retryAfter = Math.max(1, Math.ceil((active[0].time + windowMs - now) / 1000));
      localState.windows.set(key, active);
      return { allowed: false, count: active.length, retryAfter };
    }
    active.push({ time: now, member: String(member) });
    localState.windows.set(key, active);
    return { allowed: true, count: active.length, retryAfter: 0 };
  }
}

function parseInteger(value, fallback, minimum, maximum) {
  const parsed = Number.parseInt(String(value || ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}

function parseList(value) {
  return String(value || '')
    .split(',')
    .map(function (item) { return item.trim().toLowerCase(); })
    .filter(Boolean);
}

function getConfig() {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';
  const upstreamTimeoutMs = parseInteger(
    process.env.CHAT_UPSTREAM_TIMEOUT_MS,
    DEFAULTS.upstreamTimeoutMs,
    5000,
    45000
  );
  const redisTimeoutMs = parseInteger(
    process.env.CHAT_REDIS_TIMEOUT_MS,
    DEFAULTS.redisTimeoutMs,
    500,
    5000
  );
  const globalConcurrency = parseInteger(
    process.env.CHAT_GLOBAL_CONCURRENCY,
    DEFAULTS.globalConcurrency,
    1,
    20
  );
  const requestedLeaseTtlSeconds = parseInteger(
    process.env.CHAT_LEASE_TTL_SECONDS,
    DEFAULTS.leaseTtlSeconds,
    15,
    180
  );
  // A lease starts before slot probing and quota writes. Include their
  // worst-case Redis round trips, then renew after all quota checks succeed.
  const redisRoundTrips = globalConcurrency + 4 + 2;
  const redisSafetySeconds = Math.ceil(
    (redisRoundTrips * redisTimeoutMs + 5000) / 1000
  );
  const leaseTtlSeconds = Math.min(
    180,
    Math.max(
      requestedLeaseTtlSeconds,
      Math.ceil(upstreamTimeoutMs / 1000) + Math.max(15, redisSafetySeconds)
    )
  );
  const configuredNamespace = String(
    process.env.CHAT_REDIS_NAMESPACE || process.env.VERCEL_ENV || 'production'
  );
  const redisNamespace = configuredNamespace.replace(/[^A-Za-z0-9:_-]/g, '_').slice(0, 64) || 'production';
  return {
    redisUrl,
    redisToken,
    redisNamespace,
    upstreamTimeoutMs,
    challengeSecret: String(process.env.CHAT_CHALLENGE_SECRET || ''),
    protectionPepper: String(process.env.CHAT_PROTECTION_PEPPER || ''),
    turnstileSecret: String(process.env.TURNSTILE_SECRET_KEY || ''),
    turnstileSiteKey: String(process.env.TURNSTILE_SITE_KEY || ''),
    turnstileAction: String(process.env.TURNSTILE_ACTION || 'portfolio_chat'),
    allowedTurnstileHostnames: parseList(
      process.env.TURNSTILE_ALLOWED_HOSTNAMES || process.env.TURNSTILE_HOSTNAME || ''
    ),
    challengeTtlSeconds: parseInteger(
      process.env.CHAT_CHALLENGE_TTL_SECONDS,
      DEFAULTS.challengeTtlSeconds,
      60,
      900
    ),
    challengeAttemptsWindowMs: parseInteger(
      process.env.CHAT_CHALLENGE_ATTEMPTS_WINDOW_MS,
      DEFAULTS.challengeAttemptsWindowMs,
      60 * 1000,
      60 * 60 * 1000
    ),
    challengeAttemptsMax: parseInteger(
      process.env.CHAT_CHALLENGE_ATTEMPTS_MAX,
      DEFAULTS.challengeAttemptsMax,
      1,
      200
    ),
    requestAttemptsWindowMs: parseInteger(
      process.env.CHAT_REQUEST_ATTEMPTS_WINDOW_MS,
      DEFAULTS.requestAttemptsWindowMs,
      60 * 1000,
      60 * 60 * 1000
    ),
    requestAttemptsMax: parseInteger(
      process.env.CHAT_REQUEST_ATTEMPTS_MAX,
      DEFAULTS.requestAttemptsMax,
      1,
      500
    ),
    ipWindowMs: parseInteger(process.env.CHAT_IP_WINDOW_MS, DEFAULTS.ipWindowMs, 60 * 1000, 60 * 60 * 1000),
    ipWindowMax: parseInteger(process.env.CHAT_IP_WINDOW_MAX, DEFAULTS.ipWindowMax, 1, 100),
    ipDayMs: parseInteger(process.env.CHAT_IP_DAY_MS, DEFAULTS.ipDayMs, 60 * 60 * 1000, 7 * 24 * 60 * 60 * 1000),
    ipDayMax: parseInteger(process.env.CHAT_IP_DAY_MAX, DEFAULTS.ipDayMax, 1, 1000),
    sessionWindowMs: parseInteger(
      process.env.CHAT_SESSION_WINDOW_MS,
      DEFAULTS.sessionWindowMs,
      10 * 60 * 1000,
      24 * 60 * 60 * 1000
    ),
    sessionWindowMax: parseInteger(process.env.CHAT_SESSION_WINDOW_MAX, DEFAULTS.sessionWindowMax, 1, 200),
    globalDayMs: parseInteger(
      process.env.CHAT_GLOBAL_DAY_MS,
      DEFAULTS.globalDayMs,
      60 * 60 * 1000,
      7 * 24 * 60 * 60 * 1000
    ),
    globalDayMax: parseInteger(process.env.CHAT_GLOBAL_DAY_MAX, DEFAULTS.globalDayMax, 1, 10000),
    globalConcurrency,
    leaseTtlSeconds,
    maxMessageChars: parseInteger(
      process.env.CHAT_MAX_MESSAGE_CHARS,
      DEFAULTS.maxMessageChars,
      100,
      4000
    ),
    maxBodyChars: parseInteger(
      process.env.CHAT_MAX_BODY_CHARS,
      DEFAULTS.maxBodyChars,
      1024,
      64 * 1024
    ),
    redisTimeoutMs,
    turnstileTimeoutMs: parseInteger(
      process.env.TURNSTILE_VERIFY_TIMEOUT_MS,
      DEFAULTS.turnstileTimeoutMs,
      1000,
      10000
    )
  };
}

function isHostedProduction() {
  const vercelEnv = String(process.env.VERCEL_ENV || '').toLowerCase();
  if (vercelEnv === 'development') return false;
  if (process.env.VERCEL === '1') return true;
  return process.env.NODE_ENV === 'production'
    || vercelEnv === 'production'
    || vercelEnv === 'preview';
}

function getMode(config) {
  const forced = String(process.env.CHAT_PROTECTION_MODE || '').toLowerCase();
  if (forced === 'off') {
    return isHostedProduction() ? 'unconfigured' : 'off';
  }
  if (forced === 'local') {
    return isHostedProduction() ? 'unconfigured' : 'hmac-local';
  }
  const hasRedis = Boolean(config.redisUrl && config.redisToken);
  const hasTurnstileHostnames = config.allowedTurnstileHostnames.length > 0;
  if (forced === 'turnstile') {
    return hasRedis && config.turnstileSecret && config.turnstileSiteKey
      && (!isHostedProduction() || hasTurnstileHostnames)
      ? 'turnstile'
      : 'unconfigured';
  }
  if (forced === 'hmac') {
    return hasRedis && config.challengeSecret.length >= 32
      && (!isHostedProduction() || process.env.CHAT_ALLOW_HMAC_CHALLENGE === 'true')
      ? 'hmac'
      : 'unconfigured';
  }
  const hasTurnstileKeys = Boolean(config.turnstileSecret && config.turnstileSiteKey);
  const hasPartialTurnstileKeys = Boolean(config.turnstileSecret) !== Boolean(config.turnstileSiteKey);
  if (hasPartialTurnstileKeys && isHostedProduction()) {
    // A typo or missing half of the Turnstile pair must not silently select
    // the weaker HMAC mode. Force the operator to fix the config or explicitly
    // choose the documented HMAC transition mode.
    return 'unconfigured';
  }
  if (hasTurnstileKeys) {
    // Never silently fall back to the weaker HMAC mode when a production
    // Turnstile setup is half-configured. A missing hostname allowlist should
    // be fixed explicitly (or the operator must explicitly force `hmac`).
    if (!hasRedis || (isHostedProduction() && !hasTurnstileHostnames)) {
      return isHostedProduction() ? 'unconfigured' : 'hmac-local';
    }
    return 'turnstile';
  }
  // In hosted environments HMAC is an explicit, weaker transition choice.
  // Do not silently select it merely because its variables happen to exist.
  if (isHostedProduction()) return 'unconfigured';
  if (hasRedis && config.challengeSecret.length >= 32
    && (!isHostedProduction() || process.env.CHAT_ALLOW_HMAC_CHALLENGE === 'true')) {
    return 'hmac';
  }
  return 'hmac-local';
}

function getStore(config, mode) {
  if (mode === 'turnstile' || mode === 'hmac') {
    return new RedisStore(
      config.redisUrl,
      config.redisToken,
      config.redisTimeoutMs,
      config.redisNamespace
    );
  }
  return new MemoryStore();
}

function getSecret(config, mode) {
  if (mode === 'hmac') return config.challengeSecret || LOCAL_SECRET;
  if (mode === 'turnstile') return config.protectionPepper || config.turnstileSecret || LOCAL_SECRET;
  return LOCAL_SECRET;
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, 'base64');
}

function hashBinding(value, secret) {
  return crypto.createHash('sha256').update(`${secret}:${String(value || '')}`).digest('hex');
}

function signChallenge(payload, secret) {
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest();
  return `${encoded}.${base64UrlEncode(signature)}`;
}

function verifySignature(encoded, signature, secret) {
  try {
    const expected = crypto.createHmac('sha256', secret).update(encoded).digest();
    const received = base64UrlDecode(signature);
    return received.length === expected.length && crypto.timingSafeEqual(received, expected);
  } catch (error) {
    return false;
  }
}

function parseChallengeToken(token, secret) {
  const pieces = String(token || '').split('.');
  if (pieces.length !== 2 || pieces[0].length > 4096 || pieces[1].length > 256) return null;
  if (!verifySignature(pieces[0], pieces[1], secret)) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(pieces[0]).toString('utf8'));
    if (!payload || payload.v !== 1 || typeof payload.jti !== 'string'
      || !Number.isFinite(Number(payload.iat)) || !Number.isFinite(Number(payload.exp))) {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
}

function getClientIp(req) {
  const headers = (req && req.headers) || {};
  const forwarded = String(
    headers['x-vercel-forwarded-for']
      || headers['x-real-ip']
      || headers['x-forwarded-for']
      || ''
  )
    .split(',')[0]
    .trim();
  return forwarded || (req && req.socket && req.socket.remoteAddress) || 'unknown';
}

function getUserAgent(req) {
  return String((req && req.headers && req.headers['user-agent']) || 'unknown').slice(0, 512);
}

function hashIp(ip, secret) {
  return hashBinding(ip, `${secret}:ip`);
}

function hashSession(sessionId, secret) {
  return hashBinding(sessionId, `${secret}:session`);
}

function getCookie(req, name) {
  const raw = String((req && req.headers && req.headers.cookie) || '');
  const parts = raw.split(';');
  for (const part of parts) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    if (key !== name) continue;
    try {
      return decodeURIComponent(part.slice(index + 1).trim());
    } catch (error) {
      return '';
    }
  }
  return '';
}

function getSessionCookieName() {
  return isHostedProduction() ? '__Host-chat_session' : 'chat_session';
}

function signSessionCookie(sessionId, expiresAt, secret) {
  const signedValue = `${sessionId}.${expiresAt}`;
  const signature = crypto.createHmac('sha256', `${secret}:session-cookie`)
    .update(signedValue)
    .digest();
  return `${signedValue}.${base64UrlEncode(signature)}`;
}

function readSignedSession(req, secret) {
  const name = getSessionCookieName();
  const value = getCookie(req, name);
  const pieces = String(value || '').split('.');
  if (pieces.length !== 3) return '';
  const sessionId = pieces[0];
  const expiresAt = Number(pieces[1]);
  const signature = pieces[2];
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(sessionId)
    || !Number.isSafeInteger(expiresAt)
    || expiresAt <= Date.now()
    || signature.length > 256) return '';
  return verifySignature(`${sessionId}.${expiresAt}`, signature, `${secret}:session-cookie`)
    ? sessionId
    : '';
}

function ensureSession(req, res, createIfMissing, secret) {
  const sessionSecret = String(secret || LOCAL_SECRET);
  const existing = readSignedSession(req, sessionSecret);
  if (existing) return existing;
  if (!createIfMissing) return '';

  const sessionId = base64UrlEncode(crypto.randomBytes(32));
  const cookieValue = signSessionCookie(sessionId, Date.now() + 86400 * 1000, sessionSecret);
  const secure = isHostedProduction() ? '; Secure' : '';
  const cookie = `${getSessionCookieName()}=${encodeURIComponent(cookieValue)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${secure}`;
  if (res && typeof res.setHeader === 'function') res.setHeader('Set-Cookie', cookie);
  return sessionId;
}

function protectionHeaders(res) {
  if (!res || typeof res.setHeader !== 'function') return;
  res.setHeader('Cache-Control', 'no-store, no-transform');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

function unavailable() {
  return new ProtectionError(
    503,
    'protection_unavailable',
    'AI 助手保护服务尚未配置，请稍后再试。'
  );
}

function quotaError(retryAfter) {
  return new ProtectionError(
    429,
    'chat_rate_limited',
    '访问频率或今日额度已达到上限，请稍后再试。',
    retryAfter
  );
}

function challengeError(message) {
  return new ProtectionError(403, 'challenge_required', message || '请先完成访问验证。');
}

async function consumeWindow(store, key, config, windowMs, limit, member) {
  return store.slidingWindow(key, Date.now(), windowMs, limit, member);
}

async function enforceWindow(store, key, config, windowMs, limit, member) {
  const result = await consumeWindow(store, key, config, windowMs, limit, member);
  if (!result.allowed) throw quotaError(result.retryAfter);
  return result;
}

async function issueHmacChallenge(req, res, config, mode, store) {
  const secret = getSecret(config, mode);
  const sessionId = ensureSession(req, res, true, secret);
  const now = Date.now();
  const ipHash = hashIp(getClientIp(req), secret);
  const userAgentHash = hashBinding(getUserAgent(req), `${secret}:ua`);

  await enforceWindow(
    store,
    `chat:challenge-attempts:${ipHash}`,
    config,
    config.challengeAttemptsWindowMs,
    config.challengeAttemptsMax,
    randomId()
  );

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const jti = randomId();
    const payload = {
      v: 1,
      jti,
      session: hashSession(sessionId, secret),
      ip: ipHash,
      ua: userAgentHash,
      iat: now,
      exp: now + config.challengeTtlSeconds * 1000
    };
    const token = signChallenge(payload, secret);
    const stored = await store.setNx(
      `chat:challenge:${jti}`,
      '1',
      config.challengeTtlSeconds
    );
    if (stored) {
      return {
        mode: 'hmac',
        challengeToken: token,
        expiresAt: payload.exp
      };
    }
  }
  throw unavailable();
}

async function prepareChallenge(req, res) {
  const config = getConfig();
  const mode = getMode(config);
  if (mode === 'unconfigured') throw unavailable();
  if (mode === 'off') {
    ensureSession(req, res, true, getSecret(config, mode));
    return { mode: 'off', expiresAt: Date.now() + 60 * 1000 };
  }

  const store = getStore(config, mode);
  if (mode === 'turnstile') {
    const secret = getSecret(config, mode);
    const sessionId = ensureSession(req, res, true, secret);
    const ipHash = hashIp(getClientIp(req), secret);
    await enforceWindow(
      store,
      `chat:challenge-attempts:${ipHash}`,
      config,
      config.challengeAttemptsWindowMs,
      config.challengeAttemptsMax,
      randomId()
    );
    return {
      mode: 'turnstile',
      siteKey: config.turnstileSiteKey,
      action: config.turnstileAction,
      expiresAt: Date.now() + config.challengeTtlSeconds * 1000,
      session: Boolean(sessionId)
    };
  }
  return issueHmacChallenge(req, res, config, mode, store);
}

async function verifyTurnstile(token, req, config) {
  const value = String(token || '').trim();
  if (!value || value.length > 2048) throw challengeError('请先完成访问验证。');
  const form = new URLSearchParams();
  form.set('secret', config.turnstileSecret);
  form.set('response', value);
  const remoteIp = getClientIp(req);
  if (remoteIp && remoteIp !== 'unknown') form.set('remoteip', remoteIp);

  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, config.turnstileTimeoutMs);
  let response;
  let payload;
  try {
    response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
      signal: controller.signal
    });
    payload = await response.json().catch(function () { return null; });
  } catch (error) {
    throw unavailable();
  } finally {
    clearTimeout(timer);
  }

  // A Cloudflare outage, non-JSON response, or upstream 5xx is a protection
  // dependency failure, not an invalid visitor token. Fail closed with 503 so
  // callers do not keep retrying a challenge that cannot be verified.
  if (!response || !payload || !response.ok) {
    if (!response || response.status >= 500 || !payload) throw unavailable();
    throw challengeError('访问验证未通过，请重试。');
  }
  if (payload.success !== true) {
    const errorCodes = Array.isArray(payload['error-codes']) ? payload['error-codes'] : [];
    if (errorCodes.some(function (code) {
      return code === 'missing-input-secret'
        || code === 'invalid-input-secret'
        || code === 'internal-error';
    })) {
      throw unavailable();
    }
    throw challengeError('访问验证未通过，请重试。');
  }
  if (payload.action !== config.turnstileAction) {
    throw challengeError('访问验证用途不匹配，请重试。');
  }
  const hostname = String(payload.hostname || '').toLowerCase();
  if (isHostedProduction() && config.allowedTurnstileHostnames.length === 0) {
    throw unavailable();
  }
  if (config.allowedTurnstileHostnames.length > 0
    && !config.allowedTurnstileHostnames.includes(hostname)) {
    throw challengeError('访问验证来源不匹配，请重试。');
  }
}

async function consumeHmacChallenge(token, req, config, mode, store, sessionId) {
  const secret = getSecret(config, mode);
  const payload = parseChallengeToken(token, secret);
  const now = Date.now();
  if (!payload || Number(payload.exp) < now || Number(payload.iat) > now + 30 * 1000) {
    throw challengeError('访问验证已过期，请重试。');
  }
  const expectedSession = hashSession(sessionId, secret);
  const expectedIp = hashIp(getClientIp(req), secret);
  const expectedUa = hashBinding(getUserAgent(req), `${secret}:ua`);
  if (payload.session !== expectedSession || payload.ip !== expectedIp || payload.ua !== expectedUa) {
    throw challengeError('访问验证与当前会话不匹配，请重试。');
  }
  const consumed = await store.getDel(`chat:challenge:${payload.jti}`);
  if (consumed === null || consumed === undefined) {
    throw challengeError('访问验证已使用或已失效，请重试。');
  }
}

async function acquireLease(store, config, sessionKey, requestId) {
  const lockKey = `chat:lock:session:${sessionKey}`;
  const locked = await store.setNx(lockKey, requestId, config.leaseTtlSeconds);
  if (!locked) throw quotaError(5);

  const slots = [];
  for (let index = 0; index < config.globalConcurrency; index += 1) {
    slots.push(index);
  }
  // Start at a pseudo-random slot to avoid always contending on slot 0.
  const offset = Math.floor(Math.random() * Math.max(1, slots.length));
  try {
    for (let step = 0; step < slots.length; step += 1) {
      const index = slots[(offset + step) % slots.length];
      const slotKey = `chat:slot:${index}`;
      if (await store.setNx(slotKey, requestId, config.leaseTtlSeconds)) {
        return { requestId, lockKey, slotKey };
      }
    }
  } catch (error) {
    // If Redis fails after the session lock is acquired, release the lock so a
    // transient outage does not strand that visitor for the whole lease TTL.
    await store.releaseIfOwner(lockKey, requestId).catch(function () {});
    throw error;
  }

  await store.releaseIfOwner(lockKey, requestId).catch(function () {});
  throw quotaError(5);
}

async function authorizeChat(req, res) {
  const config = getConfig();
  const mode = getMode(config);
  if (mode === 'unconfigured') throw unavailable();
  if (mode === 'off') return null;

  const secret = getSecret(config, mode);
  const sessionId = ensureSession(req, res, false, secret);
  if (!sessionId) throw challengeError('请先打开页面完成访问验证。');
  const challengeToken = String((req.headers && req.headers['x-chat-challenge']) || '').trim();
  if (!challengeToken) throw challengeError('请先完成访问验证。');

  const store = getStore(config, mode);
  const ipHash = hashIp(getClientIp(req), secret);
  const sessionHash = hashSession(sessionId, secret);
  const requestId = randomId();

  // Cheap gate before external Turnstile verification, protecting the
  // verification service from a flood of malformed requests.
  await enforceWindow(
    store,
    `chat:request-attempts:${ipHash}`,
    config,
    config.requestAttemptsWindowMs,
    config.requestAttemptsMax,
    requestId
  );

  if (mode === 'turnstile') {
    await verifyTurnstile(challengeToken, req, config);
  } else {
    await consumeHmacChallenge(challengeToken, req, config, mode, store, sessionId);
  }

  let lease = null;
  try {
    // Reserve a session lock and a global slot before charging the successful
    // request quotas. Parallel duplicates therefore receive 429 without
    // burning the visitor's daily budget.
    lease = await acquireLease(store, config, sessionHash, requestId);
    await enforceWindow(store, `chat:ip:${ipHash}`, config, config.ipWindowMs, config.ipWindowMax, requestId);
    await enforceWindow(store, `chat:ip-day:${ipHash}`, config, config.ipDayMs, config.ipDayMax, requestId);
    await enforceWindow(
      store,
      `chat:session:${sessionHash}`,
      config,
      config.sessionWindowMs,
      config.sessionWindowMax,
      requestId
    );
    await enforceWindow(
      store,
      'chat:global-day',
      config,
      config.globalDayMs,
      config.globalDayMax,
      requestId
    );
    await renewChatLease({ ...lease, store }, config.leaseTtlSeconds);
    return { ...lease, store };
  } catch (error) {
    if (lease) await releaseChatLease({ ...lease, store });
    throw error;
  }
}

async function renewChatLease(lease, ttlSeconds) {
  if (!lease || !lease.store) throw unavailable();
  const renewed = await Promise.all([
    lease.store.extendIfOwner(lease.lockKey, lease.requestId, ttlSeconds),
    lease.store.extendIfOwner(lease.slotKey, lease.requestId, ttlSeconds)
  ]);
  if (renewed.every(Boolean)) return;
  await releaseChatLease(lease);
  throw unavailable();
}

async function releaseChatLease(lease) {
  if (!lease || !lease.store) return;
  await Promise.all([
    lease.store.releaseIfOwner(lease.lockKey, lease.requestId).catch(function () {}),
    lease.store.releaseIfOwner(lease.slotKey, lease.requestId).catch(function () {})
  ]);
}

function randomId() {
  return base64UrlEncode(crypto.randomBytes(18));
}

function getLimits() {
  const config = getConfig();
  return {
    maxMessageChars: config.maxMessageChars,
    maxBodyChars: config.maxBodyChars
  };
}

function sendProtectionError(res, error) {
  const protectionError = error instanceof ProtectionError
    ? error
    : unavailable();
  if (protectionError.retryAfter > 0 && res && typeof res.setHeader === 'function') {
    res.setHeader('Retry-After', String(protectionError.retryAfter));
  }
  if (res && typeof res.status === 'function') {
    res.status(protectionError.status).json({
      error: protectionError.code,
      message: protectionError.message
    });
    return;
  }
  if (res) {
    res.statusCode = protectionError.status;
    if (typeof res.json === 'function') {
      res.json({ error: protectionError.code, message: protectionError.message });
    } else if (typeof res.end === 'function') {
      res.end(JSON.stringify({ error: protectionError.code, message: protectionError.message }));
    }
  }
}

module.exports = {
  ProtectionError,
  applyProtectionHeaders: protectionHeaders,
  authorizeChat,
  getConfig,
  getLimits,
  getMode,
  isHostedProduction,
  prepareChallenge,
  renewChatLease,
  releaseChatLease,
  sendProtectionError
};
