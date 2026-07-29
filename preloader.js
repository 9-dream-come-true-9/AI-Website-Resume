(function () {
  'use strict';

  const root = document.documentElement;
  const loader = document.getElementById('site-preloader');
  const styleLink = document.getElementById('site-styles');
  const fontLink = document.getElementById('site-fonts');
  const video = document.querySelector('.site-video-bg-media');
  const body = document.body;

  function applyDeferredStylesheet(link, onSettled) {
    if (!link) {
      if (onSettled) onSettled();
      return;
    }

    let settled = false;

    function settle() {
      if (settled) return;
      settled = true;
      link.media = 'all';
      if (onSettled) onSettled();
    }

    link.addEventListener('load', settle, { once: true });
    link.addEventListener('error', settle, { once: true });

    if (link.sheet) settle();
  }

  if (!loader) {
    applyDeferredStylesheet(styleLink);
    applyDeferredStylesheet(fontLink);
    root.classList.remove('preloading');
    root.classList.add('site-ready');
    if (body) body.removeAttribute('aria-busy');
    return;
  }

  if (loader.dataset.initialized === 'true') return;
  loader.dataset.initialized = 'true';
  if (body) body.setAttribute('aria-busy', 'true');

  const pageContent = body
    ? Array.from(body.children).filter(function (element) {
        return element !== loader && element.tagName !== 'SCRIPT';
      })
    : [];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reduceMotion ? 0 : 650;
  const failsafeDuration = 6000;
  const blessingInterval = 1600;
  const startTime = performance.now();
  const progress = loader.querySelector('[role="progressbar"]');
  const message = loader.querySelector('[data-preloader-message]');
  const dots = Array.from(loader.querySelectorAll('[data-preloader-dot]'));
  const blessings = [
    '愿你今天工作顺心，下班也准时 🌷',
    '愿每份努力都被看见，忙里也有小确幸 ✨',
    '愿生活有光，工作有糖，今天也轻松一点 💜'
  ];
  const ariaProgress = [8, 35, 62, 88];
  let blessingIndex = 0;
  let blessingStep = 0;
  let domReady = document.readyState !== 'loading';
  let stylesReady = false;
  let durationReached = false;
  let finished = false;
  let messageTimer = 0;
  let blessingTimer = 0;
  let durationTimer = 0;
  let failsafeTimer = 0;

  pageContent.forEach(function (element) {
    element.setAttribute('inert', '');
    if (!element.hasAttribute('aria-hidden')) {
      element.setAttribute('aria-hidden', 'true');
      element.dataset.preloaderAriaHidden = 'true';
    }
  });

  function showBlessing(index) {
    if (!message) return;

    window.clearTimeout(messageTimer);
    message.classList.add('is-changing');

    messageTimer = window.setTimeout(function () {
      blessingIndex = index;
      blessingStep += 1;
      message.textContent = blessings[index];
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
      if (progress) {
        progress.setAttribute('aria-valuenow', String(ariaProgress[Math.min(blessingStep, ariaProgress.length - 1)]));
      }
      message.classList.remove('is-changing');
    }, reduceMotion ? 0 : 180);
  }

  function revealSite(forced) {
    if (loader.hidden) return;

    loader.hidden = true;
    root.classList.remove('preloading');
    root.classList.add('site-ready');
    if (body) body.removeAttribute('aria-busy');
    pageContent.forEach(function (element) {
      element.removeAttribute('inert');
      if (element.dataset.preloaderAriaHidden === 'true') {
        element.removeAttribute('aria-hidden');
        delete element.dataset.preloaderAriaHidden;
      }
    });

    document.dispatchEvent(new CustomEvent('site:ready', {
      detail: { forced: Boolean(forced) }
    }));
  }

  function finish(forced) {
    if (finished) return;
    finished = true;

    window.clearInterval(blessingTimer);
    window.clearTimeout(messageTimer);
    window.clearTimeout(durationTimer);
    window.clearTimeout(failsafeTimer);

    if (progress) progress.setAttribute('aria-valuenow', '100');
    if (video && video.readyState >= 2) {
      video.classList.add('is-preloaded');
    }
    loader.classList.add('is-ready');

    window.setTimeout(function () {
      loader.classList.add('is-leaving');
    }, reduceMotion ? 0 : 100);

    window.setTimeout(function () {
      revealSite(forced);
    }, reduceMotion ? 0 : 420);
  }

  function maybeFinish() {
    if (durationReached && domReady && stylesReady) finish(false);
  }

  function markDomReady() {
    domReady = true;
    maybeFinish();
  }

  function markStylesReady() {
    stylesReady = true;
    maybeFinish();
  }

  applyDeferredStylesheet(styleLink, markStylesReady);
  applyDeferredStylesheet(fontLink);

  if (!domReady) {
    document.addEventListener('DOMContentLoaded', markDomReady, { once: true });
  }

  blessingTimer = window.setInterval(function () {
    showBlessing((blessingIndex + 1) % blessings.length);
  }, blessingInterval);

  durationTimer = window.setTimeout(function () {
    durationReached = true;
    maybeFinish();
  }, Math.max(0, duration - (performance.now() - startTime)));

  failsafeTimer = window.setTimeout(function () {
    finish(true);
  }, failsafeDuration);

  function startVideoPreload() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!video || reduceMotion || (connection && connection.saveData)) return;

    video.preload = 'auto';
    video.setAttribute('preload', 'auto');
    try {
      video.load();
    } catch (error) {
      // The gradient background remains visible if media loading is unavailable.
    }
  }

  if (video && typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        if (typeof window.requestIdleCallback === 'function') {
          window.requestIdleCallback(startVideoPreload, { timeout: 800 });
        } else {
          window.setTimeout(startVideoPreload, 320);
        }
      });
    });
  } else if (video) {
    window.setTimeout(startVideoPreload, 320);
  }
})();
