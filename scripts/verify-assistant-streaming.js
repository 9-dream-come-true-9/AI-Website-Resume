const assert = require('assert');
const path = require('path');

const handler = require(path.join(__dirname, '..', 'api', 'chat.js'));
const encoder = new TextEncoder();

function createUpstream(parts, options) {
  const opts = options || {};
  const chunks = parts.map((part) => encoder.encode(part));
  let index = 0;
  const stats = { reads: 0, cancels: 0 };

  return {
    stats,
    ok: opts.ok !== false,
    status: opts.status || 200,
    text: async function () { return opts.errorText || ''; },
    body: {
      getReader: function () {
        return {
          read: async function () {
            stats.reads += 1;
            if (index >= chunks.length) return { done: true, value: undefined };
            const value = chunks[index];
            index += 1;
            return { done: false, value };
          },
          cancel: async function () {
            stats.cancels += 1;
            index = chunks.length;
          }
        };
      }
    }
  };
}

function createResponse() {
  const listeners = new Map();

  return {
    statusCode: 200,
    headers: {},
    chunks: [],
    jsonBody: null,
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
    flushHeaders: function () {
      this.headersSent = true;
    },
    flush: function () {},
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

function createRequest(message, ip, history) {
  return {
    method: 'POST',
    body: { message, history: history || [] },
    headers: {},
    socket: { remoteAddress: ip }
  };
}

function parseEvents(response) {
  return response.chunks
    .join('')
    .split(/\r?\n\r?\n/)
    .filter(Boolean)
    .map(function (block) {
      const lines = block.split(/\r?\n/);
      const eventLine = lines.find((line) => line.startsWith('event:'));
      const data = lines
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())
        .join('\n');
      return {
        event: eventLine ? eventLine.slice(6).trim() : 'message',
        data: data ? JSON.parse(data) : null
      };
    });
}

function normalStream(first, second, includeCompletionMarker) {
  const marker = includeCompletionMarker === false ? '' : '【回答完毕】';
  return createUpstream([
    `data: ${JSON.stringify({ choices: [{ delta: { content: first }, finish_reason: null }] })}\n`,
    '\n',
    `data: ${JSON.stringify({ choices: [{ delta: { content: second + marker }, finish_reason: 'stop' }] })}\n\n`,
    'data: [DONE]\n\n'
  ]);
}

async function runHandler(message, ip, upstreams, history) {
  const calls = [];
  const response = createResponse();
  global.fetch = async function (url, options) {
    calls.push({ url, options, body: JSON.parse(options.body) });
    assert(upstreams.length > 0, 'Handler made more upstream calls than expected');
    return upstreams.shift();
  };
  await handler(createRequest(message, ip, history), response);
  return { calls, response, events: parseEvents(response) };
}

(async function () {
  const originalFetch = global.fetch;
  const originalEnv = {
    AI_API_KEY: process.env.AI_API_KEY,
    AI_API_BASE: process.env.AI_API_BASE,
    AI_MODEL: process.env.AI_MODEL,
    AI_MAX_COMPLETION_TOKENS: process.env.AI_MAX_COMPLETION_TOKENS,
    AI_MAX_CONTINUATIONS: process.env.AI_MAX_CONTINUATIONS,
    CHAT_CLIENT_TOKEN: process.env.CHAT_CLIENT_TOKEN,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NODE_ENV: process.env.NODE_ENV
  };

  process.env.AI_API_KEY = 'test-key-not-a-secret';
  process.env.AI_API_BASE = 'https://workspace.cn-beijing.maas.aliyuncs.com/compatible-mode/v1';
  process.env.AI_MODEL = 'qwen3.7-plus';
  delete process.env.AI_MAX_COMPLETION_TOKENS;
  process.env.AI_MAX_CONTINUATIONS = '1';
  delete process.env.CHAT_CLIENT_TOKEN;
  delete process.env.VERCEL;
  delete process.env.VERCEL_ENV;
  delete process.env.NODE_ENV;

  try {
    const guidePrompt = '请按四大模块导览赵亚杰的 AI 作品集《AI 实验室》，概括代表作品并附对应入口链接';
    assert.strictEqual(handler.isPortfolioLinkQuestion(guidePrompt), false);
    assert.strictEqual(handler.isPortfolioLinkQuestion('请给我总作品集的飞书入口'), true);
    assert.deepStrictEqual(
      handler.getThinkingOptions('https://api.minimaxi.com/v1', 'MiniMax-M3'),
      { thinking: { type: 'disabled' } }
    );
    assert.deepStrictEqual(
      handler.getThinkingOptions('https://apihub.agnes-ai.com/v1', 'agnes-2.0-flash'),
      { chat_template_kwargs: { enable_thinking: false } }
    );
    assert.deepStrictEqual(
      handler.getThinkingOptions('https://apihub.agnes-ai.com/v1', 'agnes-2.5-flash'),
      { chat_template_kwargs: { enable_thinking: false } }
    );
    assert.deepStrictEqual(
      handler.getThinkingOptions('https://apihub.agnes-ai.com/v1', 'agnes-2.5-pro'),
      {},
      'Agnes Pro is a reasoning model and must not receive an undocumented Flash-only switch'
    );
    assert.deepStrictEqual(
      handler.getThinkingOptions('https://api.minimaxi.com/v1', 'MiniMax-M2.7'),
      {}
    );
    assert.deepStrictEqual(
      handler.getThinkingOptions('https://example.invalid/v1', 'unknown-model'),
      {}
    );
    assert.strictEqual(handler.isLikelyIncompleteAnswer('六、推荐关注点\n1.'), true);
    assert.strictEqual(handler.isLikelyIncompleteAnswer('回答完整收尾。'), false);
    assert.strictEqual(handler.MAX_USER_MESSAGE_LENGTH, 800);
    assert.strictEqual(handler.LONG_MESSAGE_STATUS_THRESHOLD, 240);
    assert.strictEqual(handler.THINKING_STATUS_INTERVAL_MS, 3200);
    assert.deepStrictEqual(handler.getThinkingStatusMessages(239), [
      '正在整理回答…',
      '正在核对相关资料…',
      '正在组织表达…'
    ]);
    assert.deepStrictEqual(handler.getThinkingStatusMessages(240), [
      '正在分析长问题…',
      '正在梳理作品与经历…',
      '正在匹配招聘视角…',
      '正在组织完整回答…'
    ]);
    const tooLong = await runHandler(
      'a'.repeat(handler.MAX_USER_MESSAGE_LENGTH + 1),
      '127.0.0.111',
      []
    );
    assert.strictEqual(tooLong.response.statusCode, 413, 'Oversized questions must be rejected before the model call');
    assert.deepStrictEqual(tooLong.response.jsonBody, {
      error: 'Message too long',
      code: 'MESSAGE_TOO_LONG',
      maxLength: 800,
      message: '问题请控制在 800 个字符以内。'
    });

    const guide = await runHandler(
      guidePrompt,
      '127.0.0.101',
      [normalStream('这是模型生成的', '作品集导览。')],
      [{ role: 'user', text: '不能被发送的旧问题' }, { role: 'assistant', text: '不能被发送的旧回答' }]
    );
    assert.strictEqual(guide.calls.length, 1, 'Portfolio guide preset must call the model exactly once');
    assert.strictEqual(guide.response.headers['content-type'], 'text/event-stream; charset=utf-8');
    assert.strictEqual(guide.response.jsonBody, null, 'Portfolio guide preset must not use the fixed JSON answer');
    assert.strictEqual(guide.calls[0].body.enable_thinking, false, 'Portfolio Q&A should avoid unnecessary thinking latency');
    assert.strictEqual(guide.calls[0].body.max_completion_tokens, 1200);
    assert.strictEqual(guide.calls[0].body.max_tokens, undefined);
    assert.strictEqual(
      handler.getCompletionTokenOptions('https://apihub.agnes-ai.com/v1', 'agnes-2.0-flash', 3000).max_tokens,
      3000
    );
    assert.strictEqual(guide.calls[0].body.messages.length, 2, 'Upstream request must contain only system knowledge and the current question');
    assert(!JSON.stringify(guide.calls[0].body.messages).includes('不能被发送的旧问题'));
    assert.deepStrictEqual(guide.calls[0].body.stream_options, { include_usage: true });
    const guideDone = guide.events.find((event) => event.event === 'done');
    assert(guideDone, 'Normal model stream must emit a done event');
    assert.deepStrictEqual(guide.events[0], {
      event: 'status',
      data: { phase: 'thinking', message: '正在整理回答…' }
    }, 'SSE must announce the thinking state before the first answer delta');
    assert.strictEqual(guideDone.data.complete, true);
    assert.strictEqual(guideDone.data.answer, '这是模型生成的作品集导览。');

    const longStatus = await runHandler(
      '请完整介绍赵亚杰的 AI 产品能力，并覆盖作品、经历、FDE 交付和量化结果。'.padEnd(handler.LONG_MESSAGE_STATUS_THRESHOLD, '补充'),
      '127.0.0.110',
      [normalStream('长问题已开始分析。', '回答完整收尾。')]
    );
    assert.deepStrictEqual(longStatus.events[0], {
      event: 'status',
      data: { phase: 'thinking', message: '正在分析长问题…' }
    }, 'Long questions must announce the analysis state over SSE');

    process.env.AI_API_BASE = 'https://apihub.agnes-ai.com/v1';
    process.env.AI_MODEL = 'agnes-2.0-flash';
    const agnes = await runHandler(
      '请介绍赵亚杰的 AI 产品能力',
      '127.0.0.109',
      [normalStream('Agnes 已关闭思考模式。')]
    );
    assert.strictEqual(agnes.calls.length, 1);
    assert.deepStrictEqual(
      agnes.calls[0].body.chat_template_kwargs,
      { enable_thinking: false },
      'Agnes Flash must receive its documented nested thinking switch'
    );
    assert.strictEqual(agnes.calls[0].body.enable_thinking, undefined);
    process.env.AI_API_BASE = 'https://workspace.cn-beijing.maas.aliyuncs.com/compatible-mode/v1';
    process.env.AI_MODEL = 'qwen3.7-plus';

    const lengthStream = createUpstream([
      'data: {"choices":[{"delta":{"content":"第一部分尚未完成"},"finish_reason":null}]}\n\n',
      'data: {"choices":[{"delta":{"content":""},"finish_reason":"length"}]}\n\n',
      'data: [DONE]\n\n'
    ]);
    const continuation = await runHandler(
      '请完整介绍 FDE 与 Skill',
      '127.0.0.102',
      [lengthStream, normalStream('，自动续写后', '完整收尾。')]
    );
    assert.strictEqual(continuation.calls.length, 2, 'Length-limited output must trigger one automatic continuation');
    assert(
      continuation.calls[1].body.messages.at(-1).content.includes('输出长度上限中断'),
      'Continuation request must explicitly resume the interrupted answer'
    );
    const continuationDone = continuation.events.find((event) => event.event === 'done');
    assert(continuationDone, 'Completed continuation must emit a done event');
    assert.strictEqual(continuationDone.data.complete, true);
    assert.strictEqual(continuationDone.data.answer, '第一部分尚未完成，自动续写后完整收尾。');

    const semanticContinuation = await runHandler(
      '测试裸编号收尾',
      '127.0.0.104',
      [normalStream('六、推荐关注点\n', '1.', false), normalStream(' 招聘方可重点关注落地证据', '，回答完整收尾。')]
    );
    assert.strictEqual(semanticContinuation.calls.length, 2, 'A bare numbered ending must trigger one automatic continuation');
    const semanticDone = semanticContinuation.events.find((event) => event.event === 'done');
    assert(semanticDone);
    assert.strictEqual(semanticDone.data.complete, true);
    assert.strictEqual(
      semanticDone.data.answer,
      '六、推荐关注点\n1. 招聘方可重点关注落地证据，回答完整收尾。'
    );

    const emptyContinuation = await runHandler(
      '测试空续写',
      '127.0.0.105',
      [
        createUpstream([
          'data: {"choices":[{"delta":{"content":"回答在这里中断"},"finish_reason":null}]}\n\n',
          'data: {"choices":[{"delta":{"content":""},"finish_reason":"length"}]}\n\n'
        ]),
        normalStream('', '', false)
      ]
    );
    const emptyDone = emptyContinuation.events.find((event) => event.event === 'done');
    assert(emptyDone, 'An empty continuation must still terminate transparently');
    assert.strictEqual(emptyDone.data.complete, false, 'An empty continuation must not be reported as complete');

    const guardedUpstream = normalStream('完成信号后', '立即结束。');
    const guarded = await runHandler(
      '测试完成信号及时结束',
      '127.0.0.106',
      [guardedUpstream]
    );
    assert(guarded.events.some((event) => event.event === 'done'));
    assert.strictEqual(guardedUpstream.stats.cancels, 1, 'Upstream reader must be cancelled after a semantic completion signal');
    assert(guardedUpstream.stats.reads < 4, 'Upstream parser must not wait for transport EOF after finish_reason');

    const interrupted = await runHandler(
      '测试异常中断',
      '127.0.0.103',
      [createUpstream(['data: {"choices":[{"delta":{"content":"残缺回答"},"finish_reason":null}]}\n\n'])]
    );
    assert(interrupted.events.some((event) => event.event === 'error'), 'Unexpected EOF must emit an error event');
    assert(!interrupted.events.some((event) => event.event === 'done'), 'Unexpected EOF must not masquerade as a complete answer');
    assert.strictEqual(
      interrupted.events.find((event) => event.event === 'error').data.answer,
      '残缺回答'
    );

    console.log('Assistant model routing, stream completion, and automatic continuation checks passed.');
  } finally {
    global.fetch = originalFetch;
    Object.keys(originalEnv).forEach(function (key) {
      if (originalEnv[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnv[key];
    });
  }
})().catch(function (error) {
  console.error(error);
  process.exitCode = 1;
});
