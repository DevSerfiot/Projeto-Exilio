/* Shared performance utilities for Exilio modules */
(function () {
  const app = window.ExilioApp || (window.ExilioApp = {});

  function rafThrottle(callback) {
    let rafId = 0;
    let lastArgs = null;

    return function throttled(...args) {
      lastArgs = args;
      if (rafId) return;

      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        callback.apply(this, lastArgs || []);
      });
    };
  }

  function observeVisibility(target, options = {}) {
    const {
      threshold = 0.05,
      root = null,
      rootMargin = '0px',
      onEnter = null,
      onExit = null
    } = options;

    if (!target) {
      return {
        disconnect() {},
        isVisible: false
      };
    }

    if (!('IntersectionObserver' in window)) {
      if (typeof onEnter === 'function') onEnter(target);
      return {
        disconnect() {},
        isVisible: true
      };
    }

    let isVisible = false;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const nextVisible = entry.isIntersecting && entry.intersectionRatio > 0;
      if (nextVisible === isVisible) return;
      isVisible = nextVisible;

      if (isVisible) {
        if (typeof onEnter === 'function') onEnter(target, entry);
      } else if (typeof onExit === 'function') {
        onExit(target, entry);
      }
    }, {
      root,
      rootMargin,
      threshold
    });

    observer.observe(target);

    return {
      disconnect() {
        observer.disconnect();
      },
      get isVisible() {
        return isVisible;
      }
    };
  }

  function watchPageVisibility(callback) {
    if (typeof callback !== 'function') {
      return () => {};
    }

    const handler = () => callback(!document.hidden);
    document.addEventListener('visibilitychange', handler);

    return () => {
      document.removeEventListener('visibilitychange', handler);
    };
  }

  function runWhenIdle(task, timeout = 1200) {
    if (typeof task !== 'function') return;

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(task, { timeout });
      return;
    }

    window.setTimeout(task, Math.min(timeout, 220));
  }

  function enableLazyMedia(root = document) {
    const images = root.querySelectorAll('img:not([loading])');
    images.forEach((img) => {
      img.loading = 'lazy';
      img.decoding = 'async';
    });

    const iframes = root.querySelectorAll('iframe:not([loading])');
    iframes.forEach((frame) => {
      frame.loading = 'lazy';
    });
  }

  app.performance = {
    rafThrottle,
    observeVisibility,
    watchPageVisibility,
    runWhenIdle,
    enableLazyMedia
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      enableLazyMedia(document);
    }, { once: true });
  } else {
    enableLazyMedia(document);
  }
})();
