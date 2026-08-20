'use strict';

const assert = require('assert');
const challengeHandler = require('../api/chat-challenge');
const chatHandler = require('../api/chat');
const protection = require('../api/_chat-protection');

function createResponse() {
  const listeners = new Map();
  return {
    statusCode: 200,
    headers: {},
    jsonBody: null,
    chunks: [],
    writableEnded: false,
    destroyed: false,
    headersSent: false,
    setHeader: function (name, value) {
      this.headers[String(name).toLowerCase()] = value;
    },
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (payload) {
      this.jsonBody = payload;
      this.headersSent = true;
      this.writableEnded = true;
      return this;
    },
    write: function (chunk) {
      this.headersSent = true;
      this.chunks.push(String(chunk));
      return true;
    },
    end: function () {
      this.headersSent = true;
      this.writableEnded = true;
    },
    flush: function () {},
    flushHeaders: function () { this.headersSent = true; },
    on: function (name, listener) {
      listeners.set(name, listener);
      return this;
    },
    removeListener: function (name, listener) {
      if (listeners.get(name) === listener) listeners.delete(name);
      return this;
    }
  };
}

function createRequest(ip, headers, message) {
  return {
    method: 'POST',
    headers: headers || {},
    body: message === undefined ? {} : { message },
    socket: { remoteAddress: ip }
  };
}

function createUpstream() {
  const encoder = new TextEncoder();
  let read = false;
  return {
    ok: true,
    status: 200,
    text: async function () { return ''; },
    body: {
      getReader: function () {
        return {
          read: async function () {
            if (read) return { done: true, value: undefined };
            read = true;
            return {
              done: false,
              value: encoder.encode(
                `data: ${JSON.stringify({ choices: [{ delta: { content: '测试回答【回答完毕】' }, finish_reason: 'stop' }] })}\n\n`
                + 'data: [DONE]\n\n'
              )
            };
          },
          cancel: async function () {}
        };
      }
    }
  };
}

async function issueChallenge(ip, cookie) {
  const response = createResponse();
  await challengeHandler(createRequest(ip, cookie ? { cookie } : undefined), response);
  assert.strictEqual(response.statusCode, 200, JSON.stringify(response.jsonBody));
  const sessionCookie = response.headers['set-cookie'] || cookie;
  assert(sessionCookie, 'challenge must set an opaque signed session cookie');
  assert(response.jsonBody.challengeToken, 'challenge must return a one-time token');
  return {
    cookie: sessionCookie,
    token: response.jsonBody.challengeToken
  };
}

(async function () {
  const originalFetch = global.fetch;
  const envKeys = [
    'CHAT_PROTECTION_MODE',
    'CHAT_IP_WINDOW_MAX',
    'CHAT_IP_WINDOW_MS',
    'CHAT_SESSION_WINDOW_MAX',
    'CHAT_SESSION_WINDOW_MS',
    'CHAT_REQUEST_ATTEMPTS_MAX',
    'CHAT_IP_DAY_MAX',
    'CHAT_GLOBAL_DAY_MAX',
    'CHAT_GLOBAL_CONCURRENCY',
    'CHAT_REDIS_NAMESPACE',
    'CHAT_UPSTREAM_TIMEOUT_MS',
    'CHAT_LEASE_TTL_SECONDS',
    'CHAT_ALLOW_HMAC_CHALLENGE',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'CHAT_CHALLENGE_SECRET',
    'TURNSTILE_SITE_KEY',
    'TURNSTILE_SECRET_KEY',
    'TURNSTILE_ALLOWED_HOSTNAMES',
    'TURNSTILE_ACTION',
    'TURNSTILE_VERIFY_TIMEOUT_MS',
    'AI_API_KEY',
    'AI_API_BASE',
    'AI_MODEL',
    'AI_MAX_COMPLETION_TOKENS',
    'AI_MAX_CONTINUATIONS',
    'VERCEL',
    'VERCEL_ENV',
    'NODE_ENV'
  ];
  const originalEnv = {};
  envKeys.forEach(function (key) { originalEnv[key] = process.env[key]; });

  process.env.CHAT_PROTECTION_MODE = 'local';
  process.env.AI_API_KEY = 'test-key-not-a-secret';
  process.env.AI_API_BASE = 'https://example.test/v1';
  process.env.AI_MODEL = 'test-model';
  process.env.AI_MAX_COMPLETION_TOKENS = '1200';
  process.env.AI_MAX_CONTINUATIONS = '0';
  delete process.env.CHAT_SESSION_WINDOW_MAX;
  delete process.env.CHAT_SESSION_WINDOW_MS;
  delete process.env.CHAT_REQUEST_ATTEMPTS_MAX;
  delete process.env.CHAT_REDIS_NAMESPACE;
  process.env.CHAT_UPSTREAM_TIMEOUT_MS = '45000';
  process.env.CHAT_LEASE_TTL_SECONDS = '15';
  delete process.env.CHAT_CHALLENGE_SECRET;
  delete process.env.CHAT_ALLOW_HMAC_CHALLENGE;
  delete process.env.VERCEL;
  delete process.env.VERCEL_ENV;
  delete process.env.NODE_ENV;

  assert.strictEqual(
    protection.getConfig().sessionWindowMax,
    20,
    'the default session quota must remain 20 requests per hour'
  );
  assert.strictEqual(
    protection.getConfig().leaseTtlSeconds,
    106,
    'lease TTL must cover upstream timeout, Redis quota work, and the safety margin'
  );
  delete process.env.CHAT_UPSTREAM_TIMEOUT_MS;
  delete process.env.CHAT_LEASE_TTL_SECONDS;

  try {
    const first = await issueChallenge('198.51.100.10');
    let upstreamCalls = 0;
    global.fetch = async function () {
      upstreamCalls += 1;
      return createUpstream();
    };

    const success = createResponse();
    await chatHandler(
      createRequest('198.51.100.10', {
        cookie: first.cookie,
        'x-chat-challenge': first.token
      }, '介绍一个项目'),
      success
    );
    assert.strictEqual(success.statusCode, 200);
    assert(success.chunks.join('').includes('event: done'));
    assert.strictEqual(upstreamCalls, 1);

    const replay = createResponse();
    await chatHandler(
      createRequest('198.51.100.10', {
        cookie: first.cookie,
        'x-chat-challenge': first.token
      }, '重放令牌'),
      replay
    );
    assert.strictEqual(replay.statusCode, 403, 'a one-time token must not be replayable');
    assert.strictEqual(upstreamCalls, 1, 'replay must not call the model');

    const forgedSource = await issueChallenge('198.51.100.10');
    const forgedCookie = createResponse();
    await chatHandler(
      createRequest('198.51.100.10', {
        cookie: `chat_session=${'A'.repeat(32)}`,
        'x-chat-challenge': forgedSource.token
      }, '伪造会话 cookie'),
      forgedCookie
    );
    assert.strictEqual(forgedCookie.statusCode, 403, 'an unsigned or forged session cookie must be rejected');
    assert.strictEqual(upstreamCalls, 1, 'a forged session cookie must not call the model');

    // The requested session quota must reject the 21st successful request,
    // while the other windows are relaxed so this test isolates the session
    // bucket. Reuse the signed cookie to model one browser session.
    process.env.CHAT_IP_WINDOW_MAX = '100';
    process.env.CHAT_IP_DAY_MAX = '100';
    process.env.CHAT_REQUEST_ATTEMPTS_MAX = '100';
    process.env.CHAT_GLOBAL_DAY_MAX = '1000';
    process.env.CHAT_SESSION_WINDOW_MAX = '20';
    const sessionIp = '198.51.100.30';
    const sessionStartCalls = upstreamCalls;
    const sessionBase = await issueChallenge(sessionIp);
    for (let index = 0; index < 21; index += 1) {
      const challenge = index === 0
        ? sessionBase
        : await issueChallenge(sessionIp, sessionBase.cookie);
      const sessionResponse = createResponse();
      await chatHandler(
        createRequest(sessionIp, {
          cookie: sessionBase.cookie,
          'x-chat-challenge': challenge.token
        }, `会话额度测试${index + 1}`),
        sessionResponse
      );
      if (index < 20) {
        assert.strictEqual(sessionResponse.statusCode, 200, `session request ${index + 1} should pass`);
      } else {
        assert.strictEqual(sessionResponse.statusCode, 429, 'the 21st session request must be limited');
      }
    }
    assert.strictEqual(upstreamCalls - sessionStartCalls, 20, 'the 21st session request must not call the model');

    const missing = createResponse();
    await chatHandler(
      createRequest('198.51.100.11', {}, '没有挑战令牌'),
      missing
    );
    assert.strictEqual(missing.statusCode, 403, 'direct calls without a challenge must be blocked');

    process.env.CHAT_IP_WINDOW_MAX = '1';
    const limitedA = await issueChallenge('198.51.100.12');
    const limitedB = await issueChallenge('198.51.100.12');
    const firstLimited = createResponse();
    await chatHandler(
      createRequest('198.51.100.12', {
        cookie: limitedA.cookie,
        'x-chat-challenge': limitedA.token
      }, '第一次'),
      firstLimited
    );
    assert.strictEqual(firstLimited.statusCode, 200);
    const secondLimited = createResponse();
    await chatHandler(
      createRequest('198.51.100.12', {
        cookie: limitedB.cookie,
        'x-chat-challenge': limitedB.token
      }, '第二次'),
      secondLimited
    );
    assert.strictEqual(secondLimited.statusCode, 429, 'the global limiter must enforce the configured IP window');

    // Production Turnstile path: the server must validate action and hostname
    // before an upstream model call, while Redis still owns the shared quota.
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'production';
    process.env.NODE_ENV = 'production';
    process.env.CHAT_PROTECTION_MODE = 'turnstile';
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.test';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'redis-token';
    process.env.TURNSTILE_SITE_KEY = 'site-key';
    process.env.TURNSTILE_SECRET_KEY = 'secret-key';
    process.env.TURNSTILE_ALLOWED_HOSTNAMES = 'www.example.com';
    process.env.TURNSTILE_ACTION = 'portfolio_chat';
    let turnstileAction = 'wrong_action';
    let turnstileHostname = 'www.example.com';
    let turnstileStatus = 200;
    let malformedRedisResult = false;
    let modelCalls = 0;
    global.fetch = async function (url, options) {
      if (String(url).includes('redis.test')) {
        const command = JSON.parse(options.body);
        let result = null;
        if (command[0] === 'SET') result = 'OK';
        else if (command[0] === 'EVAL') result = command[1].includes('ZREMRANGEBYSCORE')
          ? [1, 1, 0]
          : 1;
        if (malformedRedisResult && command[0] === 'EVAL') result = null;
        return { ok: true, status: 200, json: async function () { return { result }; } };
      }
      if (String(url).includes('challenges.cloudflare.com')) {
        return {
          ok: turnstileStatus >= 200 && turnstileStatus < 300,
          status: turnstileStatus,
          json: async function () {
            return { success: true, action: turnstileAction, hostname: turnstileHostname };
          }
        };
      }
      modelCalls += 1;
      return createUpstream();
    };
    const cfChallenge = createResponse();
    await challengeHandler(createRequest('198.51.100.20', { host: 'www.example.com' }), cfChallenge);
    assert.strictEqual(cfChallenge.jsonBody.mode, 'turnstile');
    const invalidTurnstile = createResponse();
    await chatHandler(
      createRequest('198.51.100.20', {
        cookie: cfChallenge.headers['set-cookie'],
        'x-chat-challenge': 'cf-token',
        host: 'www.example.com'
      }, '错误 action'),
      invalidTurnstile
    );
    assert.strictEqual(invalidTurnstile.statusCode, 403);
    assert.strictEqual(modelCalls, 0);
    turnstileAction = 'portfolio_chat';
    const validTurnstile = createResponse();
    await chatHandler(
      createRequest('198.51.100.20', {
        cookie: cfChallenge.headers['set-cookie'],
        'x-chat-challenge': 'cf-token-2',
        host: 'www.example.com'
      }, '正确 action'),
      validTurnstile
    );
    assert.strictEqual(validTurnstile.statusCode, 200);
    assert.strictEqual(modelCalls, 1);

    turnstileHostname = 'evil.example.com';
    const invalidHostname = createResponse();
    await chatHandler(
      createRequest('198.51.100.20', {
        cookie: cfChallenge.headers['set-cookie'],
        'x-chat-challenge': 'cf-token-hostname',
        host: 'www.example.com'
      }, '错误 hostname'),
      invalidHostname
    );
    assert.strictEqual(invalidHostname.statusCode, 403);
    assert.strictEqual(modelCalls, 1);
    turnstileHostname = 'www.example.com';

    turnstileStatus = 503;
    const turnstileOutage = createResponse();
    await chatHandler(
      createRequest('198.51.100.20', {
        cookie: cfChallenge.headers['set-cookie'],
        'x-chat-challenge': 'cf-token-3',
        host: 'www.example.com'
      }, '验证服务故障'),
      turnstileOutage
    );
    assert.strictEqual(turnstileOutage.statusCode, 503, 'Turnstile outage must fail closed as 503');
    assert.strictEqual(modelCalls, 1, 'Turnstile outage must not call the model');
    turnstileStatus = 200;

    malformedRedisResult = true;
    const malformedRedis = createResponse();
    await challengeHandler(createRequest('198.51.100.22', { host: 'www.example.com' }), malformedRedis);
    assert.strictEqual(malformedRedis.statusCode, 503, 'a malformed Redis limiter result must fail closed');
    malformedRedisResult = false;

    // A half-configured production Turnstile setup must not silently fall
    // back to the automatable HMAC mode.
    process.env.CHAT_PROTECTION_MODE = '';
    delete process.env.TURNSTILE_ALLOWED_HOSTNAMES;
    const missingHostname = createResponse();
    await challengeHandler(createRequest('198.51.100.21'), missingHostname);
    assert.strictEqual(missingHostname.statusCode, 503);

    process.env.TURNSTILE_ALLOWED_HOSTNAMES = 'www.example.com';
    delete process.env.TURNSTILE_SECRET_KEY;
    const partialTurnstile = createResponse();
    await challengeHandler(createRequest('198.51.100.23'), partialTurnstile);
    assert.strictEqual(partialTurnstile.statusCode, 503, 'a partial Turnstile pair must fail closed');
    process.env.TURNSTILE_SECRET_KEY = 'secret-key';

    // HMAC must be an explicit production choice; merely having its variables
    // present must not silently weaken a missing Turnstile configuration.
    process.env.CHAT_CHALLENGE_SECRET = 'hmac-secret-that-is-at-least-32-characters-long';
    process.env.CHAT_ALLOW_HMAC_CHALLENGE = 'true';
    delete process.env.TURNSTILE_SITE_KEY;
    delete process.env.TURNSTILE_SECRET_KEY;
    delete process.env.TURNSTILE_ALLOWED_HOSTNAMES;
    const implicitHmac = createResponse();
    await challengeHandler(createRequest('198.51.100.24'), implicitHmac);
    assert.strictEqual(implicitHmac.statusCode, 503, 'production must not silently fall back to HMAC');
    process.env.CHAT_PROTECTION_MODE = 'hmac';
    const explicitHmac = createResponse();
    await challengeHandler(createRequest('198.51.100.24'), explicitHmac);
    assert.strictEqual(explicitHmac.statusCode, 200, 'explicit HMAC transition mode must remain available');
    process.env.CHAT_PROTECTION_MODE = '';

    process.env.CHAT_PROTECTION_MODE = '';
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.TURNSTILE_SITE_KEY;
    delete process.env.TURNSTILE_SECRET_KEY;
    delete process.env.TURNSTILE_ALLOWED_HOSTNAMES;
    delete process.env.CHAT_CHALLENGE_SECRET;
    delete process.env.CHAT_ALLOW_HMAC_CHALLENGE;
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'production';
    const failClosed = createResponse();
    await challengeHandler(createRequest('198.51.100.13'), failClosed);
    assert.strictEqual(failClosed.statusCode, 503, 'production must fail closed without Redis/challenge config');

    console.log('Chat protection challenge, replay, quota, and fail-closed checks passed.');
  } finally {
    global.fetch = originalFetch;
    envKeys.forEach(function (key) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    });
  }
})().catch(function (error) {
  console.error(error);
  process.exitCode = 1;
});
