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
  const fixedDuration = 5000;
  const blessingInterval = 1600;
  const revealDuration = reduceMotion ? 0 : 420;
  const recordedStartTime = Number(root.dataset.preloaderStartedAt);
  const startTime = Number.isFinite(recordedStartTime) ? recordedStartTime : performance.now();
  const progress = loader.querySelector('[role="progressbar"]');
  const progressFill = loader.querySelector('[data-preloader-progress]');
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
  let finished = false;
  let messageTimer = 0;
  let blessingTimer = 0;
  let finishTimer = 0;

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

    if (progress) progress.setAttribute('aria-valuenow', '100');
    loader.classList.add('is-ready');
    if (progressFill) progressFill.style.transform = 'translate3d(0, 0, 0)';

    // Give the completed 100% state one paint before removing the overlay.
    // Without this frame the page can become interactive while the final
    // progress-bar transform is still visually unfinished.
    window.requestAnimationFrame(function () {
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
    });
  }

  function finish(forced) {
    if (finished) return;
    finished = true;

    window.clearInterval(blessingTimer);
    window.clearTimeout(messageTimer);
    window.clearTimeout(finishTimer);

    if (video && video.readyState >= 2) {
      video.classList.add('is-preloaded');
    }

    window.setTimeout(function () {
      loader.classList.add('is-leaving');
    }, reduceMotion ? 0 : 100);

    window.setTimeout(function () {
      revealSite(forced);
    }, revealDuration);
  }

  applyDeferredStylesheet(styleLink);
  applyDeferredStylesheet(fontLink);

  blessingTimer = window.setInterval(function () {
    showBlessing((blessingIndex + 1) % blessings.length);
  }, blessingInterval);

  // Keep the preloader visible for exactly 5s, including its exit animation.
  finishTimer = window.setTimeout(function () {
    finish(false);
  }, Math.max(0, fixedDuration - revealDuration - (performance.now() - startTime)));

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
