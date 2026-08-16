const rateBuckets = new Map();
const PORTFOLIO_LINK = 'https://ocnlnp1ta2t2.feishu.cn/drive/folder/Wpm9fd5g4liX9Edxp3pctObYnng';
const FEISHU_LOGIN_NOTE = '💡 温馨提示：作品集记录在飞书文档，打开链接前，请先登录您的飞书账号方便查看~';

const PORTFOLIO_CONTEXT = `
赵亚杰，AI 产品经理候选人，上海立信会计金融学院智能科学与技术本科在读。
核心方向：AI 应用落地、RAG 智能客服、AI 营销工具、AI 陪伴 App、Vibe Coding 原型、数据驱动决策。
个人开源项目只有 1 个：BOSS 直聘 Windows 桌面端 AI 智能体 Skill 合集。
项目由岗位发布、候选人初评分、候选人沟通、简历索要与收取 4 个可独立安装、可组合调用的 Skill 构成，贯通完整招聘流程。
岗位发布支持实习、社招全职、应届校招和兼职 4 类岗位；候选人初评分基于岗位 JD 给出有证据边界的匹配结论、档位、理由与信息缺口；沟通环节支持批量打招呼、文档依据回复、批量消息和指定联系人发送；简历环节支持平台或普通消息索要、附件确认及 PDF/DOCX 下载、校验和解析。
项目基于 Python、pywinauto、Windows UI Automation（UIA）、JSON Schema、PDF/DOCX 解析和 Git/GitHub，通过字段回读、岗位与候选人身份核验、幂等防重、未知状态停止、只读结果核对和隐私脱敏控制真实外部操作风险。
项目已开源 4 个可组合 Skill，并提供 29 名候选人脱敏初评和完整工作流演示。仓库：https://github.com/9-dream-come-true-9/boss-zhipin-desktop-skills 。
实习经历成果包括：SoulTalk AI 陪伴 App 个性化 Push 点击率由 2.3% 提升至 7.8%；SoulTalk UGC 机制降低角色创作门槛；RAG 智能客服响应准确率提升至 91%。这些属于实习经历，不要把它们列为个人开源项目。
联系方式：电话 17855772097，微信 Motivation_zyj，邮箱 m19323067704@163.com，GitHub https://github.com/9-dream-come-true-9。
飞书作品集链接：${PORTFOLIO_LINK}

${FEISHU_LOGIN_NOTE}
`;

module.exports = async function handler(req, res) {
  applySecurityHeaders(res);

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const token = process.env.CHAT_CLIENT_TOKEN || '';
  if (token && req.headers['x-chat-token'] !== token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const rateLimit = checkRateLimit(getClientIp(req));
  if (rateLimit.limited) {
    res.setHeader('Retry-After', String(rateLimit.retryAfter));
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  const userMessage = String((req.body && req.body.message) || '').trim();
  if (!userMessage) {
    res.status(400).json({ error: 'Missing message' });
    return;
  }

  if (isPortfolioLinkQuestion(userMessage)) {
    res.status(200).json({
      answer: `飞书作品集链接：${PORTFOLIO_LINK}\n\n${FEISHU_LOGIN_NOTE}`
    });
    return;
  }

  const apiKey = process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.MINIMAX_API_KEY || '';
  if (!apiKey) {
    res.status(503).json({ error: 'AI service is not configured' });
    return;
  }

  const apiBase = String(process.env.AI_API_BASE || 'https://api.deepseek.com').replace(/\/+$/, '');
  const model = process.env.AI_MODEL || 'deepseek-chat';
  const history = Array.isArray(req.body.history) ? req.body.history.slice(-8) : [];
  const upstreamController = new AbortController();
  const abortUpstream = function () {
    if (!res.writableEnded && !upstreamController.signal.aborted) {
      upstreamController.abort();
    }
  };
  res.on('close', abortUpstream);
  const messages = [
    {
      role: 'system',
      content: [
        '你是赵亚杰个人主页里的 AI 求职助手。',
        '只回答与赵亚杰的项目、经历、能力、岗位匹配和联系方式有关的问题。',
        '回答要简洁、准确、偏招聘视角，优先中文。',
        '当用户询问项目时，只介绍 BOSS 直聘 Windows 桌面端 AI 智能体 Skill 合集；SoulTalk 与 RAG 等内容属于实习经历，不要列为独立项目。',
        '不要输出思考过程、推理过程、分析草稿或 <think> 标签，只输出可以直接展示给用户的最终答案。',
        `每次提供飞书作品集链接时，必须严格分成下面两段，链接行只能包含链接，不能把提示放进 Markdown 链接文字或 URL：\n飞书作品集：${PORTFOLIO_LINK}\n\n${FEISHU_LOGIN_NOTE}`,
        '如果用户问到页面没有的信息，说明作品集里暂未提供。',
        `作品集资料：\n${PORTFOLIO_CONTEXT}`
      ].join('\n')
    },
    ...history
      .filter((item) => item && item.text)
      .map((item) => ({
        role: item.role === 'user' ? 'user' : 'assistant',
        content: (item.role === 'user'
          ? String(item.text)
          : stripModelThinking(item.text)
        ).slice(0, 1200)
      })),
    { role: 'user', content: userMessage.slice(0, 2000) }
  ];

  try {
    const upstream = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      signal: upstreamController.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.5,
        enable_thinking: true,
        max_completion_tokens: 1000,
        stream: true
      })
    });

    if (!upstream.ok) {
      await upstream.text().catch(() => '');
      res.status(upstream.status).json({ error: 'AI request failed' });
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    let answer = await streamModelAnswer(upstream, res);
    if (!answer) {
      answer = '暂时没有拿到有效回答，可以换个方式问我项目、经历或联系方式。';
      writeStreamEvent(res, 'delta', { delta: answer });
    }
    writeStreamEvent(res, 'done', { answer: answer });
    res.end();
  } catch (error) {
    if (upstreamController.signal.aborted || res.destroyed) {
      return;
    }
    if (res.headersSent && !res.writableEnded) {
      writeStreamEvent(res, 'error', { error: 'AI service unavailable' });
      res.end();
    } else if (!res.headersSent) {
      res.status(502).json({ error: 'AI service unavailable' });
    }
  } finally {
    res.removeListener('close', abortUpstream);
  }
};

async function streamModelAnswer(upstream, res) {
  if (!upstream.body || typeof upstream.body.getReader !== 'function') return '';

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let answer = '';

  function consumeLine(line) {
    if (!line.startsWith('data:')) return;
    const data = line.slice(5).trim();
    if (!data || data === '[DONE]') return;

    try {
      const payload = JSON.parse(data);
      const delta = payload && payload.choices && payload.choices[0]
        ? payload.choices[0].delta
        : null;
      const content = delta && typeof delta.content === 'string' ? delta.content : '';
      if (!content) return;
      answer += content;
      writeStreamEvent(res, 'delta', { delta: content });
    } catch (error) {
      // Ignore malformed or non-JSON SSE metadata lines from the upstream service.
    }
  }

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';
    lines.forEach(consumeLine);
  }

  buffer += decoder.decode();
  if (buffer) buffer.split(/\r?\n/).forEach(consumeLine);
  return stripModelThinking(answer);
}

function writeStreamEvent(res, event, payload) {
  if (res.destroyed || res.writableEnded) return;
  res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
  if (typeof res.flush === 'function') res.flush();
}

function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

function stripModelThinking(value) {
  let text = String(value || '').replace(/\r\n/g, '\n');

  text = text
    .replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, '')
    .replace(/<reasoning\b[^>]*>[\s\S]*?<\/reasoning>/gi, '');

  const finalAnswerMatch = text.match(/(?:^|\n)\s*(?:最终答案|正式回答|答案|回答|Final Answer)\s*[:：]\s*/i);
  if (finalAnswerMatch) {
    text = text.slice(finalAnswerMatch.index + finalAnswerMatch[0].length);
  }

  text = text
    .replace(/^\s*(?:思考过程|推理过程|分析过程|Thought process|Reasoning)\s*[:：][\s\S]*?(?:\n\s*\n)+/i, '')
    .replace(/<think\b[^>]*>[\s\S]*$/gi, '')
    .replace(/<reasoning\b[^>]*>[\s\S]*$/gi, '')
    .replace(/<\/(?:think|reasoning)>/gi, '');

  return normalizePortfolioOutput(text).trim();
}

function normalizePortfolioOutput(value) {
  const formatted = `飞书作品集：${PORTFOLIO_LINK}\n\n${FEISHU_LOGIN_NOTE}`;
  const inlineNote = new RegExp(
    `${escapeRegExp(PORTFOLIO_LINK)}\\s*[（(][^\\n]*温馨提示[^\\n]*[）)]`,
    'gi'
  );

  return String(value || '')
    .replace(
      /\[[^\]]*Wpm9fd5g4liX9Edxp3pctObYnng[^\]]*\]\(https?:\/\/[^)\s]*Wpm9fd5g4liX9Edxp3pctObYnng[^)]*\)/gi,
      formatted
    )
    .replace(inlineNote, `${PORTFOLIO_LINK}\n\n${FEISHU_LOGIN_NOTE}`)
    .replace(
      /(^|\n)\s*(?:💡\s*)?温馨提示：作品集[^\n]*?飞书账号[^\n]*?(?:[。~～]|$)/g,
      `$1${FEISHU_LOGIN_NOTE}`
    );
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isPortfolioLinkQuestion(message) {
  const text = String(message || '').toLowerCase();
  return /作品集|飞书|feishu/.test(text) && /链接|地址|观看|查看|打开|入口|提示|登录|登陆|看/.test(text);
}

function getClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket.remoteAddress || 'unknown';
}

function checkRateLimit(ip) {
  const windowMs = Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS || 60000);
  const max = Number(process.env.CHAT_RATE_LIMIT_MAX || 12);
  const now = Date.now();
  let bucket = rateBuckets.get(ip);

  if (!bucket || now - bucket.windowStart >= windowMs) {
    bucket = { count: 0, windowStart: now };
  }

  bucket.count += 1;
  rateBuckets.set(ip, bucket);

  if (bucket.count > max) {
    return {
      limited: true,
      retryAfter: Math.max(1, Math.ceil((bucket.windowStart + windowMs - now) / 1000))
    };
  }

  if (rateBuckets.size > 500) {
    rateBuckets.forEach((item, key) => {
      if (now - item.windowStart >= windowMs) rateBuckets.delete(key);
    });
  }

  return { limited: false, retryAfter: 0 };
}
