(function () {
  'use strict';

  function whenSiteReady(callback) {
    if (
      document.documentElement.classList.contains('site-ready') ||
      !document.getElementById('site-preloader')
    ) {
      callback();
      return;
    }

    document.addEventListener('site:ready', callback, { once: true });
  }

  function initVideoBackgroundPlayback() {
    const video = document.querySelector('.site-video-bg-media');
    if (!video) return;

    video.loop = true;
    video.muted = true;
    video.playsInline = true;

    function showVideo() {
      if (video.classList.contains('is-preloaded')) return;
      video.classList.add('is-ready');
    }

    function playVideo() {
      if (video.readyState >= 2) showVideo();
      const playResult = video.play();
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch(function () {});
      }
    }

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && video.paused) playVideo();
    });

    if (video.readyState >= 2) showVideo();
    else video.addEventListener('loadeddata', showVideo, { once: true });

    if (video.readyState >= 1) playVideo();
    else video.addEventListener('loadedmetadata', playVideo, { once: true });
  }

  function initHeroCopySequence() {
    const heroCopySteps = document.querySelectorAll('.hero-copy-step, .hero-summary-step');
    if (!heroCopySteps.length) return;

    const showHeroCopy = function () {
      heroCopySteps.forEach(function (el) {
        el.classList.add('is-visible');
      });
    };

    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(showHeroCopy);
      });
    } else {
      window.setTimeout(showHeroCopy, 16);
    }

    window.setTimeout(function () {
      document.documentElement.classList.add('hero-motion-done');
    }, 3300);
  }

  function initPortfolioGuidance() {
    const guidanceItems = Array.from(document.querySelectorAll('[data-portfolio-guidance]'));
    if (!guidanceItems.length) return;

    let openItem = null;

    function closeGuidance(item, options) {
      if (!item) return;

      const trigger = item.querySelector('[data-portfolio-trigger]');
      const note = item.querySelector('[data-portfolio-note]');

      item.classList.remove('is-open');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      if (note) note.setAttribute('aria-hidden', 'true');
      if (openItem === item) openItem = null;

      if (options && options.restoreFocus && trigger) {
        trigger.focus();
      }
    }

    function openGuidance(item) {
      if (openItem && openItem !== item) {
        closeGuidance(openItem);
      }

      const trigger = item.querySelector('[data-portfolio-trigger]');
      const note = item.querySelector('[data-portfolio-note]');

      item.classList.add('is-open');
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
      if (note) note.setAttribute('aria-hidden', 'false');
      openItem = item;
    }

    guidanceItems.forEach(function (item) {
      const trigger = item.querySelector('[data-portfolio-trigger]');
      if (!trigger) return;

      trigger.addEventListener('click', function (event) {
        event.preventDefault();
        openGuidance(item);
      });
    });

    document.addEventListener('click', function (event) {
      if (openItem && !openItem.contains(event.target)) {
        closeGuidance(openItem);
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && openItem) {
        closeGuidance(openItem, { restoreFocus: true });
      }
    });
  }

  function initResumeDownload() {
    const root = document.querySelector('[data-resume-download]');
    if (!root) return;

    const trigger = root.querySelector('[data-resume-download-trigger]');
    const menu = root.querySelector('[data-resume-download-menu]');
    const options = Array.from(root.querySelectorAll('.resume-download-option'));
    if (!trigger || !menu) return;

    function closeMenu(restoreFocus) {
      root.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
      if (restoreFocus) trigger.focus();
    }

    function openMenu() {
      root.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
    }

    trigger.addEventListener('click', function () {
      if (root.classList.contains('is-open')) closeMenu();
      else openMenu();
    });

    trigger.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowDown') return;
      event.preventDefault();
      openMenu();
      if (options[0]) options[0].focus();
    });

    options.forEach(function (option) {
      option.addEventListener('click', function () {
        closeMenu();
      });
    });

    document.addEventListener('click', function (event) {
      if (root.classList.contains('is-open') && !root.contains(event.target)) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && root.classList.contains('is-open')) {
        closeMenu(true);
      }
    });
  }

  function copyContactText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(value).then(function () {
        return true;
      }).catch(function () {
        return fallbackCopyContactText(value);
      });
    }

    return Promise.resolve(fallbackCopyContactText(value));
  }

  function fallbackCopyContactText(value) {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      return document.execCommand('copy');
    } catch (error) {
      return false;
    } finally {
      textarea.remove();
    }
  }

  function initContactCopy() {
    const buttons = Array.from(document.querySelectorAll('[data-contact-copy]'));
    const status = document.querySelector('[data-contact-copy-status]');
    if (!buttons.length || !status) return;

    let feedbackTimer = null;

    function showFeedback(button, label, copied) {
      buttons.forEach(function (item) {
        item.classList.remove('is-copied', 'is-copy-failed');
      });

      button.classList.add(copied ? 'is-copied' : 'is-copy-failed');
      status.textContent = copied ? label + '已复制' : label + '复制失败，请手动复制';
      status.classList.add('is-visible');

      window.clearTimeout(feedbackTimer);
      feedbackTimer = window.setTimeout(function () {
        button.classList.remove('is-copied', 'is-copy-failed');
        status.classList.remove('is-visible');
      }, 1600);
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        const value = button.getAttribute('data-contact-value') || '';
        const label = button.getAttribute('data-contact-label') || '联系方式';
        if (!value) return;

        copyContactText(value).then(function (copied) {
          showFeedback(button, label, copied);
        });
      });
    });
  }

  function initPageExperience() {
  initVideoBackgroundPlayback();
  initPortfolioGuidance();
  initResumeDownload();
  initContactCopy();

  if ('IntersectionObserver' in window) {
    document.documentElement.classList.add('js-anim');
  }

  const revealTargets = document.querySelectorAll(
    '.reveal, .text-reveal, .capability-card, .project-card, .timeline-item, .hero-text, .hero-image, .hero-visual, .contact-card, .section-title, .section-subtitle'
  );

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealTargets.forEach(function (el) {
      el.classList.add('reveal');
      observer.observe(el);
    });
  } else {
    revealTargets.forEach(function (el) {
      el.classList.add('reveal', 'is-visible');
    });
  }

  initHeroCopySequence();

  const navLinks = Array.from(document.querySelectorAll('.nav-link:not([data-assistant-open])'));
  const sections = navLinks
    .map(function (link) {
      const href = link.getAttribute('href');
      if (!href || href === '#hero') return document.getElementById('hero');
      return document.querySelector(href);
    })
    .filter(Boolean);

  function setActiveNav(id) {
    navLinks.forEach(function (link) {
      const href = link.getAttribute('href');
      if (href === '#' + id) {
        link.style.color = 'var(--color-accent)';
      } else {
        link.style.color = '';
      }
    });
  }

  function updateActiveNav() {
    let current = sections[0];
    sections.forEach(function (section) {
      if (!section) return;
      const rect = section.getBoundingClientRect();
      if (rect.top <= 150) {
        current = section;
      }
    });
    if (current) setActiveNav(current.id);
  }

  updateActiveNav();

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  window.addEventListener('resize', updateActiveNav);

  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const id = href.slice(1);
        setActiveNav(id);
      }
    });
  });
  }

  whenSiteReady(initPageExperience);
})();

(function () {
  'use strict';

  function getSafeStorage(name) {
    try {
      return window[name] || null;
    } catch (error) {
      return null;
    }
  }

  const root = document.querySelector('[data-assistant]');
  if (!root) return;

  const panel = document.getElementById('assistant-panel');
  const toggleBtn = root.querySelector('[data-assistant-toggle]');
  const calloutBtn = root.querySelector('[data-assistant-callout]');
  const hideBtn = root.querySelector('[data-assistant-hide]');
  const recallBtn = root.querySelector('[data-assistant-recall]');
  const closeBtn = root.querySelector('[data-assistant-close]');
  const clearBtn = root.querySelector('[data-assistant-clear]');
  const messagesEl = root.querySelector('[data-assistant-messages]');
  const form = root.querySelector('[data-assistant-form]');
  const input = root.querySelector('[data-assistant-input]');
  const sendBtn = root.querySelector('[data-assistant-send]');
  const promptBtns = Array.from(root.querySelectorAll('[data-assistant-prompt]'));
  const openBtns = Array.from(document.querySelectorAll('[data-assistant-open]'));
  const endpoint = '/api/chat';
  const portfolioLink = 'https://ocnlnp1ta2t2.feishu.cn/drive/folder/Wpm9fd5g4liX9Edxp3pctObYnng';
  const feishuLoginNote = '💡 温馨提示：作品集记录在飞书文档，打开链接前，请先登录您的飞书账号方便查看~';
  const storageKey = 'portfolio-text-agent-history-v6';
  const hiddenStorageKey = 'portfolio-text-agent-hidden-v1';
  const temporaryAssistantErrors = [
    'AI 服务暂时没有返回有效回答，请稍后再试。',
    'AI 服务暂时没有返回有效回答，请稍后再试',
    'AI 服务暂时不可用，请稍后再试。',
    'AI 服务暂时不可用，请稍后再试'
  ];
  const localStore = getSafeStorage('localStorage');
  const sessionStore = getSafeStorage('sessionStorage');
  const idleInputPlaceholder = input.getAttribute('placeholder') || '';
  const desktopFocusQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

  let history = loadHistory();
  let isResponding = false;
  let activeRequestController = null;
  let lastOpenTrigger = null;

  function loadHistory() {
    try {
      const parsed = JSON.parse((sessionStore && sessionStore.getItem(storageKey)) || '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed.slice(-18).map(function (item) {
        const role = item && item.role === 'user' ? 'user' : 'bot';
        const text = role === 'bot' ? stripModelThinking(item && item.text) : String((item && item.text) || '');
        return { role: role, text: text };
      }).filter(function (item) {
        return item.text && !(item.role === 'bot' && isTemporaryAssistantError(item.text));
      });
    } catch (error) {
      return [];
    }
  }

  function saveHistory() {
    const compact = history.filter(function (item) {
      return item && item.role && item.text;
    }).slice(-18);
    if (sessionStore) sessionStore.setItem(storageKey, JSON.stringify(compact));
  }

  function appendMessage(role, text, options) {
    const opts = options || {};
    const messageText = role === 'bot' && !opts.thinking ? stripModelThinking(text) : text;
    const messageState = {
      text: String(messageText || ''),
      historyItem: opts.historyItem || null
    };
    const wrap = document.createElement('div');
    wrap.className = 'assistant-message ' + (role === 'user' ? 'is-user' : 'is-bot');
    if (opts.thinking) wrap.dataset.thinking = 'true';

    const bubble = document.createElement('div');
    bubble.className = 'assistant-bubble';
    if (role === 'bot' && !opts.thinking) {
      bubble.classList.add('is-markdown');
      bubble.innerHTML = renderMarkdown(messageText);
    } else {
      bubble.textContent = messageText;
    }

    const meta = document.createElement('div');
    meta.className = 'assistant-meta';
    meta.textContent = role === 'user' ? '你' : 'AI求职小杰君';

    if (!opts.skipHistory && !opts.thinking) {
      messageState.historyItem = { role: role, text: messageState.text };
      history.push(messageState.historyItem);
      saveHistory();
    }

    wrap.appendChild(bubble);
    if (role === 'user' && !opts.thinking) {
      wrap.appendChild(createUserMessageActions(wrap, messageState, bubble));
    }
    wrap.appendChild(meta);
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    return wrap;
  }

  function createUserMessageActions(wrap, messageState, bubble) {
    const actions = document.createElement('div');
    actions.className = 'assistant-message-actions';

    const copyBtn = createMessageActionButton('复制', [
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
      '<rect width="14" height="14" x="8" y="8" rx="2"></rect>',
      '<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>',
      '</svg>'
    ].join(''));

    const editBtn = createMessageActionButton('编辑', [
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
      '<path d="M12 20h9"></path>',
      '<path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>',
      '</svg>'
    ].join(''));

    copyBtn.addEventListener('click', function () {
      copyTextToClipboard(messageState.text).then(function (copied) {
        setActionFeedback(copyBtn, copied ? '已复制' : '复制失败');
      });
    });

    editBtn.addEventListener('click', function () {
      startInlineMessageEdit(wrap, bubble, actions, messageState);
    });

    actions.appendChild(copyBtn);
    actions.appendChild(editBtn);
    return actions;
  }

  function createMessageActionButton(label, iconHtml) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'assistant-message-action';
    button.setAttribute('aria-label', label);
    button.title = label;
    button.innerHTML = iconHtml;
    return button;
  }

  function startInlineMessageEdit(wrap, bubble, actions, messageState) {
    if (isResponding || bubble.dataset.editing === 'true') return;

    const originalText = messageState.text;
    bubble.dataset.editing = 'true';
    bubble.classList.add('is-editing');
    actions.dataset.editing = 'true';
    bubble.textContent = '';

    const textarea = document.createElement('textarea');
    textarea.className = 'assistant-edit-textarea';
    textarea.value = originalText;
    textarea.rows = Math.min(6, Math.max(2, originalText.split('\n').length));
    textarea.setAttribute('aria-label', '编辑这条消息');

    const controls = document.createElement('div');
    controls.className = 'assistant-edit-controls';

    const saveBtn = createMessageActionButton('保存', [
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
      '<path d="M20 6 9 17l-5-5"></path>',
      '</svg>'
    ].join(''));
    saveBtn.classList.add('assistant-edit-action');

    const cancelBtn = createMessageActionButton('取消', [
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
      '<path d="M18 6 6 18"></path>',
      '<path d="m6 6 12 12"></path>',
      '</svg>'
    ].join(''));
    cancelBtn.classList.add('assistant-edit-action');

    function finishEdit(nextText) {
      if (isResponding) {
        textarea.focus();
        return;
      }

      const displayText = nextText.trim();
      if (!displayText) {
        textarea.focus();
        return;
      }

      if (displayText === originalText) {
        cancelEdit();
        return;
      }

      messageState.text = displayText;
      if (messageState.historyItem) messageState.historyItem.text = displayText;
      saveHistory();

      bubble.classList.remove('is-editing');
      delete bubble.dataset.editing;
      delete actions.dataset.editing;
      bubble.textContent = displayText;
      regenerateFromEditedMessage(wrap, messageState, displayText);
    }

    function cancelEdit() {
      bubble.classList.remove('is-editing');
      delete bubble.dataset.editing;
      delete actions.dataset.editing;
      bubble.textContent = originalText;
    }

    saveBtn.addEventListener('click', function () {
      finishEdit(textarea.value);
    });

    cancelBtn.addEventListener('click', cancelEdit);

    textarea.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        cancelEdit();
      } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        finishEdit(textarea.value);
      }
    });

    controls.appendChild(cancelBtn);
    controls.appendChild(saveBtn);
    bubble.appendChild(textarea);
    bubble.appendChild(controls);
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }

  async function regenerateFromEditedMessage(wrap, messageState, question) {
    if (isResponding) return;

    let nextMessage = wrap.nextElementSibling;
    while (nextMessage) {
      const messageToRemove = nextMessage;
      nextMessage = nextMessage.nextElementSibling;
      messageToRemove.remove();
    }

    if (messageState.historyItem) {
      const messageIndex = history.indexOf(messageState.historyItem);
      if (messageIndex >= 0) {
        history = history.slice(0, messageIndex + 1);
      }
      saveHistory();
    }

    const requestHistory = history.slice(0, -1).slice(-8);
    await runAssistantResponse(question, requestHistory);
  }

  function setActionFeedback(button, label) {
    const originalLabel = button.getAttribute('aria-label') || '';
    const originalTitle = button.title || originalLabel;
    button.setAttribute('aria-label', label);
    button.title = label;
    button.dataset.feedback = 'true';

    window.setTimeout(function () {
      button.setAttribute('aria-label', originalLabel);
      button.title = originalTitle;
      delete button.dataset.feedback;
    }, 1200);
  }

  function copyTextToClipboard(text) {
    const value = String(text || '');
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(value).then(function () {
        return true;
      }).catch(function () {
        return fallbackCopyText(value);
      });
    }
    return Promise.resolve(fallbackCopyText(value));
  }

  function fallbackCopyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      return document.execCommand('copy');
    } catch (error) {
      return false;
    } finally {
      textarea.remove();
    }
  }

  function renderMarkdown(markdown) {
    const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
    const html = [];
    let index = 0;

    while (index < lines.length) {
      const line = lines[index];
      const trimmed = line.trim();
      if (!trimmed) {
        index += 1;
        continue;
      }

      if (/^```/.test(trimmed)) {
        const code = [];
        index += 1;
        while (index < lines.length && !/^```/.test(lines[index].trim())) {
          code.push(lines[index]);
          index += 1;
        }
        if (index < lines.length) index += 1;
        html.push('<pre><code>' + escapeHtml(code.join('\n')) + '</code></pre>');
        continue;
      }

      if (isTableStart(lines, index)) {
        html.push(renderTable(lines, index));
        index += 2;
        while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
          index += 1;
        }
        continue;
      }

      const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
      if (heading) {
        const level = Math.min(heading[1].length + 2, 5);
        html.push('<h' + level + '>' + renderInlineMarkdown(heading[2]) + '</h' + level + '>');
        index += 1;
        continue;
      }

      const listType = getListType(line);
      if (listType) {
        const tag = listType === 'ordered' ? 'ol' : 'ul';
        const items = [];
        while (index < lines.length && getListType(lines[index]) === listType) {
          items.push(lines[index].replace(/^\s*(?:[-*+]\s+|\d+[.)]\s+)/, ''));
          index += 1;
        }
        html.push('<' + tag + '>' + items.map(function (item) {
          return '<li>' + renderInlineMarkdown(item.trim()) + '</li>';
        }).join('') + '</' + tag + '>');
        continue;
      }

      if (/^>\s?/.test(line)) {
        const quotes = [];
        while (index < lines.length && /^>\s?/.test(lines[index])) {
          quotes.push(lines[index].replace(/^>\s?/, ''));
          index += 1;
        }
        html.push('<blockquote>' + quotes.map(renderInlineMarkdown).join('<br>') + '</blockquote>');
        continue;
      }

      const paragraph = [];
      while (
        index < lines.length &&
        lines[index].trim() &&
        !/^```/.test(lines[index].trim()) &&
        !/^(#{1,4})\s+/.test(lines[index].trim()) &&
        !getListType(lines[index]) &&
        !/^>\s?/.test(lines[index]) &&
        !isTableStart(lines, index)
      ) {
        paragraph.push(lines[index]);
        index += 1;
      }
      html.push('<p>' + paragraph.map(function (item) {
        return renderInlineMarkdown(item.trim());
      }).join('<br>') + '</p>');
    }

    return html.join('');
  }

  function isTableStart(lines, index) {
    if (!lines[index] || !lines[index].includes('|') || !lines[index + 1]) return false;
    return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index + 1]);
  }

  function renderTable(lines, startIndex) {
    const headers = parseTableRow(lines[startIndex]);
    const rows = [];
    let index = startIndex + 2;
    while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
      rows.push(parseTableRow(lines[index]));
      index += 1;
    }

    return [
      '<div class="assistant-table-wrap"><table>',
      '<thead><tr>',
      headers.map(function (cell) { return '<th>' + renderInlineMarkdown(cell) + '</th>'; }).join(''),
      '</tr></thead><tbody>',
      rows.map(function (row) {
        return '<tr>' + headers.map(function (_, cellIndex) {
          return '<td>' + renderInlineMarkdown(row[cellIndex] || '') + '</td>';
        }).join('') + '</tr>';
      }).join(''),
      '</tbody></table></div>'
    ].join('');
  }

  function parseTableRow(line) {
    return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(function (cell) {
      return cell.trim();
    });
  }

  function getListType(line) {
    if (/^\s*\d+[.)]\s+/.test(line)) return 'ordered';
    if (/^\s*[-*+]\s+/.test(line)) return 'unordered';
    return '';
  }

  function renderInlineMarkdown(text) {
    const links = [];
    const withTokens = String(text || '').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi, function (_, label, url) {
      const safeUrl = sanitizeUrl(url);
      if (!safeUrl) return label;
      const token = '\u0000LINK' + links.length + '\u0000';
      links.push('<a href="' + escapeAttribute(safeUrl) + '" target="_blank" rel="noreferrer">' + escapeHtml(label) + '</a>');
      return token;
    });

    let html = escapeHtml(withTokens);
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/https?:\/\/[^\s<]+/g, function (url) {
      let clean = url;
      let suffix = '';
      while (/[),.，。！？；：]$/.test(clean)) {
        suffix = clean.slice(-1) + suffix;
        clean = clean.slice(0, -1);
      }
      const safeUrl = sanitizeUrl(clean.replace(/&amp;/g, '&'));
      if (!safeUrl) return url;
      return '<a href="' + escapeAttribute(safeUrl) + '" target="_blank" rel="noreferrer">' + clean + '</a>' + suffix;
    });

    links.forEach(function (link, linkIndex) {
      html = html.replace('\u0000LINK' + linkIndex + '\u0000', link);
    });
    return html;
  }

  function sanitizeUrl(url) {
    const value = String(url || '').trim();
    if (!/^https?:\/\//i.test(value)) return '';
    return value.replace(/[\u0000-\u001F\u007F\s]+/g, '');
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }

  function parseModelResponse(data) {
    if (!data) return '';
    if (typeof data === 'string') return data;
    if (typeof data.answer === 'string') return data.answer;
    if (typeof data.message === 'string') return data.message;
    if (typeof data.content === 'string') return data.content;
    if (data.data) return parseModelResponse(data.data);
    if (Array.isArray(data.choices) && data.choices[0]) {
      const choice = data.choices[0];
      return parseModelResponse(choice.message || choice);
    }
    return '';
  }

  function isTemporaryAssistantError(text) {
    return temporaryAssistantErrors.includes(String(text || '').trim());
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
    const formatted = '飞书作品集：' + portfolioLink + '\n\n' + feishuLoginNote;
    const inlineNote = new RegExp(
      escapeRegExp(portfolioLink) + '\\s*[（(][^\\n]*温馨提示[^\\n]*[）)]',
      'gi'
    );

    return String(value || '')
      .replace(
        /\[[^\]]*Wpm9fd5g4liX9Edxp3pctObYnng[^\]]*\]\(https?:\/\/[^)\s]*Wpm9fd5g4liX9Edxp3pctObYnng[^)]*\)/gi,
        formatted
      )
      .replace(inlineNote, portfolioLink + '\n\n' + feishuLoginNote)
      .replace(
        /(^|\n)\s*(?:💡\s*)?温馨提示：作品集[^\n]*?飞书账号[^\n]*?(?:[。~～]|$)/g,
        '$1' + feishuLoginNote
      );
  }

  function escapeRegExp(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function renderHistory() {
    messagesEl.textContent = '';
    if (!history.length) {
      appendMessage(
        'bot',
        '你好，我是 AI 求职小杰君。你可以问我赵亚杰的 AI 项目、产品能力、实习经历、岗位匹配或联系方式。',
        { skipHistory: false }
      );
      return;
    }
    history.forEach(function (item) {
      appendMessage(item.role, item.text, { skipHistory: true, historyItem: item });
    });
  }

  function shouldAutoFocusInput() {
    return desktopFocusQuery.matches && window.innerWidth >= 768;
  }

  function setOpen(isOpen, trigger) {
    if (isOpen && trigger && typeof trigger.focus === 'function') {
      lastOpenTrigger = trigger;
    }

    root.classList.toggle('is-open', isOpen);
    document.documentElement.classList.toggle('assistant-open', isOpen);
    panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    panel.toggleAttribute('inert', !isOpen);
    toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    openBtns.forEach(function (button) {
      button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    if (isOpen && shouldAutoFocusInput()) {
      window.setTimeout(function () {
        input.focus();
      }, 120);
    } else if (!isOpen && panel.contains(document.activeElement) && lastOpenTrigger) {
      lastOpenTrigger.focus({ preventScroll: true });
    }
  }

  function setHidden(isHidden, options) {
    const opts = options || {};
    if (isHidden) setOpen(false);
    root.classList.toggle('is-hidden', isHidden);
    if (recallBtn) recallBtn.setAttribute('aria-hidden', isHidden ? 'false' : 'true');
    if (opts.persist !== false && localStore) {
      localStore.setItem(hiddenStorageKey, isHidden ? 'true' : 'false');
    }
  }

  function setResponding(nextState) {
    isResponding = Boolean(nextState);
    root.classList.toggle('is-responding', isResponding);
    form.dataset.responding = isResponding ? 'true' : 'false';
    sendBtn.dataset.state = isResponding ? 'responding' : 'idle';
    sendBtn.type = isResponding ? 'button' : 'submit';
    sendBtn.setAttribute('aria-label', isResponding ? '停止生成' : '发送问题');
    sendBtn.title = isResponding ? '停止生成' : '发送问题';
    input.readOnly = isResponding;
    input.placeholder = isResponding ? 'AI 正在回答，可点击停止' : idleInputPlaceholder;
    if (clearBtn) clearBtn.disabled = isResponding;
    promptBtns.forEach(function (button) {
      button.disabled = isResponding;
    });
  }

  function stopActiveResponse() {
    if (!isResponding || !activeRequestController || activeRequestController.signal.aborted) return;
    sendBtn.setAttribute('aria-label', '正在停止生成');
    sendBtn.title = '正在停止生成';
    activeRequestController.abort();
  }

  function isAbortError(error, signal) {
    return Boolean(
      (signal && signal.aborted) ||
      (error && (error.name === 'AbortError' || error.code === 20))
    );
  }

  async function callModel(question, requestHistory, onStreamUpdate, signal) {
    const conversationHistory = Array.isArray(requestHistory) ? requestHistory : history.slice(-8);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: signal,
        body: JSON.stringify({
          message: question,
          history: conversationHistory,
          mode: 'text'
        })
      });

      if (!response.ok) throw new Error('Bad response');
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream') && response.body) {
        return await readModelStream(response, onStreamUpdate);
      }
      const payload = contentType.includes('application/json') ? await response.json() : await response.text();
      const answer = stripModelThinking(parseModelResponse(payload)).trim();
      return answer || 'AI 服务暂时没有返回有效回答，请稍后再试。';
    } catch (error) {
      if (isAbortError(error, signal)) throw error;
      return 'AI 服务暂时不可用，请稍后再试。';
    }
  }

  async function readModelStream(response, onStreamUpdate) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let answer = '';

    function consumeEvent(block) {
      if (!block.trim()) return;
      const lines = block.split(/\r?\n/);
      const eventLine = lines.find(function (line) { return line.startsWith('event:'); });
      const eventName = eventLine ? eventLine.slice(6).trim() : 'message';
      const dataText = lines.filter(function (line) { return line.startsWith('data:'); }).map(function (line) {
        return line.slice(5).trim();
      }).join('\n');
      if (!dataText) return;

      const data = JSON.parse(dataText);
      if (eventName === 'error') throw new Error(data.error || 'Stream failed');
      if (eventName === 'delta' && typeof data.delta === 'string') {
        answer += data.delta;
        if (typeof onStreamUpdate === 'function') onStreamUpdate(answer);
      }
      if (eventName === 'done' && typeof data.answer === 'string') {
        answer = data.answer;
      }
    }

    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() || '';
      events.forEach(consumeEvent);
    }

    buffer += decoder.decode();
    if (buffer) consumeEvent(buffer);
    answer = stripModelThinking(answer).trim();
    return answer || 'AI 服务暂时没有返回有效回答，请稍后再试。';
  }

  function autoResizeInput() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  }

  async function runAssistantResponse(question, requestHistory) {
    if (isResponding) return;

    const requestController = new AbortController();
    activeRequestController = requestController;
    setResponding(true);
    const thinking = appendMessage('bot', '正在整理回答…', {
      thinking: true,
      skipHistory: true
    });

    const bubble = thinking.querySelector('.assistant-bubble');
    let isStreaming = false;
    let streamedAnswer = '';

    try {
      const answer = await callModel(question, requestHistory, function (partialAnswer) {
        const visibleAnswer = stripModelThinking(partialAnswer).trim();
        if (!visibleAnswer || requestController.signal.aborted) return;
        streamedAnswer = visibleAnswer;
        if (!isStreaming) {
          isStreaming = true;
          delete thinking.dataset.thinking;
          bubble.classList.add('is-markdown');
        }
        bubble.innerHTML = renderMarkdown(visibleAnswer);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }, requestController.signal);

      if (isStreaming) {
        bubble.innerHTML = renderMarkdown(answer);
        if (!isTemporaryAssistantError(answer)) {
          history.push({ role: 'bot', text: answer });
          saveHistory();
        }
      } else {
        thinking.remove();
        appendMessage('bot', answer, {
          skipHistory: isTemporaryAssistantError(answer)
        });
      }
    } catch (error) {
      if (!isAbortError(error, requestController.signal)) {
        thinking.remove();
        appendMessage('bot', 'AI 服务暂时不可用，请稍后再试。', { skipHistory: true });
      } else if (isStreaming && streamedAnswer) {
        bubble.innerHTML = renderMarkdown(streamedAnswer);
        history.push({ role: 'bot', text: streamedAnswer });
        saveHistory();
      } else {
        thinking.remove();
      }
    } finally {
      if (activeRequestController === requestController) {
        activeRequestController = null;
        setResponding(false);
      }
    }
  }

  async function ask(question) {
    const text = String(question || '').trim();
    if (!text || isResponding) return;

    const requestHistory = history.slice(-8);
    appendMessage('user', text);
    input.value = '';
    autoResizeInput();
    await runAssistantResponse(text, requestHistory);
  }

  toggleBtn.addEventListener('click', function (event) {
    setOpen(!root.classList.contains('is-open'), event.currentTarget);
  });

  if (calloutBtn) {
    calloutBtn.addEventListener('click', function (event) {
      setOpen(true, event.currentTarget);
    });
  }

  openBtns.forEach(function (button) {
    button.addEventListener('click', function (event) {
      event.preventDefault();
      setHidden(false);
      setOpen(true, button);
    });
  });

  if (hideBtn) {
    hideBtn.addEventListener('click', function (event) {
      event.stopPropagation();
      setHidden(true);
    });
  }

  if (recallBtn) {
    recallBtn.addEventListener('click', function () {
      setHidden(false);
    });
  }

  closeBtn.addEventListener('click', function () {
    setOpen(false);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && root.classList.contains('is-open')) {
      setOpen(false);
    }
  });

  clearBtn.addEventListener('click', function () {
    if (isResponding) return;
    history = [];
    if (sessionStore) sessionStore.removeItem(storageKey);
    renderHistory();
  });

  sendBtn.addEventListener('click', function (event) {
    if (!isResponding) return;
    event.preventDefault();
    stopActiveResponse();
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (isResponding) return;
    ask(input.value);
  });

  input.addEventListener('input', autoResizeInput);
  input.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (isResponding) return;
      if (form.requestSubmit) form.requestSubmit();
      else sendBtn.click();
    }
  });

  promptBtns.forEach(function (button) {
    button.addEventListener('click', function () {
      if (isResponding) return;
      const prompt = button.getAttribute('data-assistant-prompt') || '';
      ask(prompt);
    });
  });

  setResponding(false);
  setOpen(false);
  setHidden(localStore ? localStore.getItem(hiddenStorageKey) === 'true' : false, { persist: false });
  renderHistory();
})();
