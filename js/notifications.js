/* Windows-like notification center with queue support */
(function () {
  const TYPE_INFO = 'informacao';
  const TYPE_ERROR = 'erro';
  const TYPE_SUCCESS = 'sucesso';
  const TYPE_SYSTEM = 'sistema';
  const TYPE_ALERT = 'alerta';

  const TYPES = {
    INFORMATION: TYPE_INFO,
    ERROR: TYPE_ERROR,
    SUCCESS: TYPE_SUCCESS,
    SYSTEM: TYPE_SYSTEM,
    ALERT: TYPE_ALERT,
    INFO: TYPE_INFO
  };

  const TYPE_META = {
    informacao: { icon: 'i', title: 'Informacao' },
    erro: { icon: 'X', title: 'Erro' },
    sucesso: { icon: 'OK', title: 'Sucesso' },
    sistema: { icon: 'SYS', title: 'Sistema' },
    alerta: { icon: '!', title: 'Alerta' }
  };

  const DEFAULTS = {
    type: TYPE_INFO,
    title: '',
    message: '',
    duration: 3600,
    maxVisible: 4,
    dismissible: true,
    pauseOnHover: true,
    showProgress: true
  };

  let shellRef = null;
  let styleInjected = false;
  let notifSeed = 0;
  const history = [];
  const queue = [];
  const visible = new Map();
  const config = Object.assign({}, DEFAULTS);

  const HISTORY_LIMIT = 200;

  function injectStyles() {
    if (styleInjected || document.getElementById('notification-style')) {
      styleInjected = true;
      return;
    }

    const style = document.createElement('style');
    style.id = 'notification-style';
    style.textContent = `
      .notification-shell {
        position: fixed;
        right: 16px;
        bottom: 16px;
        width: min(380px, calc(100vw - 24px));
        display: grid;
        gap: 10px;
        z-index: 1400;
        pointer-events: none;
      }

      .notification-item {
        position: relative;
        overflow: hidden;
        pointer-events: auto;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-left-width: 4px;
        background: linear-gradient(150deg, rgba(20, 20, 20, 0.97), rgba(12, 12, 12, 0.98));
        color: #f1f1f1;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.42);
        opacity: 0;
        transform: translateY(12px) translateX(10px) scale(0.98);
        animation: notification-in 280ms cubic-bezier(0.2, 0.7, 0.2, 1) forwards;
        will-change: transform, opacity;
      }

      .notification-item.is-leaving {
        animation: notification-out 220ms ease forwards;
      }

      .notification-item::before {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: linear-gradient(110deg, transparent 0%, rgba(255, 255, 255, 0.07) 40%, transparent 70%);
        transform: translateX(-120%);
        animation: notification-scan 4.2s linear infinite;
      }

      .notification-item__inner {
        display: grid;
        grid-template-columns: 34px 1fr auto;
        gap: 10px;
        align-items: start;
        padding: 11px 12px;
      }

      .notification-item__icon {
        width: 28px;
        height: 28px;
        display: grid;
        place-items: center;
        border-radius: 8px;
        border: 1px solid currentColor;
        font-family: var(--font-mono, monospace);
        font-size: 0.7rem;
        font-weight: 700;
        line-height: 1;
        opacity: 0.95;
      }

      .notification-item__copy {
        min-width: 0;
      }

      .notification-item__title {
        margin: 0;
        font-size: 0.78rem;
        line-height: 1.25;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        font-weight: 700;
      }

      .notification-item__message {
        margin-top: 4px;
        color: rgba(241, 241, 241, 0.86);
        font-size: 0.78rem;
        line-height: 1.35;
        word-break: break-word;
      }

      .notification-item__close {
        appearance: none;
        border: none;
        background: transparent;
        color: rgba(241, 241, 241, 0.7);
        width: 22px;
        height: 22px;
        border-radius: 6px;
        cursor: pointer;
        padding: 0;
        font-size: 15px;
        line-height: 1;
        transition: background 160ms ease, color 160ms ease;
      }

      .notification-item__close:hover {
        background: rgba(255, 255, 255, 0.12);
        color: #ffffff;
      }

      .notification-item__progress {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 3px;
        transform-origin: left;
        animation-name: notification-progress;
        animation-timing-function: linear;
        animation-fill-mode: forwards;
      }

      .notification-item--informacao {
        border-left-color: #66b8ff;
        color: #80c6ff;
      }

      .notification-item--informacao .notification-item__progress {
        background: linear-gradient(90deg, #66b8ff, #2d7bff);
      }

      .notification-item--erro {
        border-left-color: #ff5f5f;
        color: #ff8a8a;
      }

      .notification-item--erro .notification-item__progress {
        background: linear-gradient(90deg, #ff5f5f, #cc3131);
      }

      .notification-item--sucesso {
        border-left-color: #68d96f;
        color: #91f098;
      }

      .notification-item--sucesso .notification-item__progress {
        background: linear-gradient(90deg, #68d96f, #2da85b);
      }

      .notification-item--sistema {
        border-left-color: #ffd166;
        color: #ffe190;
      }

      .notification-item--sistema .notification-item__progress {
        background: linear-gradient(90deg, #ffd166, #f2a83b);
      }

      .notification-item--alerta {
        border-left-color: #ff9d46;
        color: #ffc07f;
      }

      .notification-item--alerta .notification-item__progress {
        background: linear-gradient(90deg, #ff9d46, #ff6b2c);
      }

      .notifications-history {
        display: grid;
        gap: 16px;
      }

      .notifications-history__header {
        display: grid;
        gap: 8px;
      }

      .notifications-history__eyebrow {
        margin: 0;
        font-size: 0.72rem;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: rgba(255, 224, 224, 0.76);
      }

      .notifications-history__title {
        margin: 0;
        font-size: 1.45rem;
        letter-spacing: 0.06em;
      }

      .notifications-history__summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 10px;
      }

      .notifications-history__summary-card {
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 10px 12px;
        background: rgba(10, 10, 10, 0.55);
      }

      .notifications-history__summary-label {
        display: block;
        font-size: 0.72rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: rgba(220, 220, 220, 0.7);
      }

      .notifications-history__summary-value {
        display: block;
        margin-top: 6px;
        font-size: 1.2rem;
        font-weight: 700;
      }

      .notifications-history__list {
        display: grid;
        gap: 10px;
      }

      .notifications-history__item {
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-left-width: 5px;
        background: linear-gradient(180deg, rgba(16, 16, 16, 0.92), rgba(9, 9, 9, 0.95));
        padding: 12px 14px;
        display: grid;
        gap: 8px;
      }

      .notifications-history__item-header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
      }

      .notifications-history__item-title {
        margin: 0;
        font-size: 0.92rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .notifications-history__item-meta {
        font-size: 0.68rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: rgba(220, 220, 220, 0.68);
      }

      .notifications-history__item-message {
        margin: 0;
        color: rgba(240, 240, 240, 0.92);
        line-height: 1.45;
        word-break: break-word;
      }

      .notifications-history__item--informacao {
        border-left-color: #66b8ff;
      }

      .notifications-history__item--erro {
        border-left-color: #ff5f5f;
      }

      .notifications-history__item--sucesso {
        border-left-color: #68d96f;
      }

      .notifications-history__item--sistema {
        border-left-color: #ffd166;
      }

      .notifications-history__item--alerta {
        border-left-color: #ff9d46;
      }

      .notifications-history__item--informacao .notifications-history__item-title,
      .notifications-history__item--informacao .notifications-history__item-meta {
        color: #80c6ff;
      }

      .notifications-history__item--erro .notifications-history__item-title,
      .notifications-history__item--erro .notifications-history__item-meta {
        color: #ff8a8a;
      }

      .notifications-history__item--sucesso .notifications-history__item-title,
      .notifications-history__item--sucesso .notifications-history__item-meta {
        color: #91f098;
      }

      .notifications-history__item--sistema .notifications-history__item-title,
      .notifications-history__item--sistema .notifications-history__item-meta {
        color: #ffe190;
      }

      .notifications-history__item--alerta .notifications-history__item-title,
      .notifications-history__item--alerta .notifications-history__item-meta {
        color: #ffc07f;
      }

      @keyframes notification-in {
        from {
          opacity: 0;
          transform: translateY(12px) translateX(10px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) translateX(0) scale(1);
        }
      }

      @keyframes notification-out {
        from {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        to {
          opacity: 0;
          transform: translateY(8px) scale(0.99);
        }
      }

      @keyframes notification-progress {
        from { transform: scaleX(1); }
        to { transform: scaleX(0); }
      }

      @keyframes notification-scan {
        from { transform: translateX(-120%); }
        to { transform: translateX(130%); }
      }

      @media (max-width: 768px) {
        .notification-shell {
          left: 12px;
          right: 12px;
          bottom: 12px;
          width: auto;
          gap: 8px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .notification-item,
        .notification-item.is-leaving,
        .notification-item::before,
        .notification-item__progress {
          animation-duration: 1ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 1ms !important;
        }
      }
    `;

    document.head.appendChild(style);
    styleInjected = true;
  }

  function ensureShell() {
    if (shellRef && document.body.contains(shellRef)) {
      return shellRef;
    }

    shellRef = document.getElementById('notification-shell');
    if (!shellRef) {
      shellRef = document.createElement('div');
      shellRef.id = 'notification-shell';
      shellRef.className = 'notification-shell';
      shellRef.setAttribute('aria-live', 'polite');
      document.body.appendChild(shellRef);
    }

    return shellRef;
  }

  function normalizeType(inputType) {
    const raw = String(inputType || '').trim().toLowerCase();
    if (TYPE_META[raw]) {
      return raw;
    }

    const aliases = {
      info: TYPE_INFO,
      information: TYPE_INFO,
      informacao: TYPE_INFO,
      informa: TYPE_INFO,
      error: TYPE_ERROR,
      erro: TYPE_ERROR,
      success: TYPE_SUCCESS,
      sucesso: TYPE_SUCCESS,
      system: TYPE_SYSTEM,
      sistema: TYPE_SYSTEM,
      alert: TYPE_ALERT,
      warning: TYPE_ALERT,
      alerta: TYPE_ALERT
    };

    return aliases[raw] || TYPE_INFO;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function parseInput(input, type, options) {
    if (typeof input === 'object' && input !== null) {
      return Object.assign({}, input);
    }

    if (typeof input === 'string') {
      const base = Object.assign({}, options || {});
      base.message = input;
      base.type = type || base.type;
      return base;
    }

    return Object.assign({}, options || {}, {
      message: String(input || ''),
      type: type || (options && options.type)
    });
  }

  function pushHistory(record) {
    history.unshift({
      id: record.id,
      type: record.options.type,
      title: record.options.title,
      message: record.options.message,
      timestamp: Date.now()
    });

    if (history.length > HISTORY_LIMIT) {
      history.length = HISTORY_LIMIT;
    }
  }

  function scheduleAutoClose(record) {
    if (!record || !record.item) return;

    const item = record.item;
    const duration = Math.max(900, Number(record.options.duration) || DEFAULTS.duration);
    record.remaining = duration;
    record.lastStart = Date.now();
    item.style.setProperty('--notification-duration', `${duration}ms`);

    const progress = item.querySelector('.notification-item__progress');
    if (progress) {
      progress.style.animationDuration = `${duration}ms`;
      progress.style.animationPlayState = 'running';
    }

    record.timeoutId = window.setTimeout(function () {
      closeById(record.id);
    }, duration);
  }

  function pauseAutoClose(record) {
    if (!record || !record.timeoutId) return;

    window.clearTimeout(record.timeoutId);
    record.timeoutId = null;

    const elapsed = Date.now() - (record.lastStart || Date.now());
    record.remaining = Math.max(150, (record.remaining || 0) - elapsed);

    const progress = record.item && record.item.querySelector('.notification-item__progress');
    if (progress) {
      progress.style.animationPlayState = 'paused';
    }
  }

  function resumeAutoClose(record) {
    if (!record || record.timeoutId || !record.item) return;
    if (!record.options.pauseOnHover) return;

    const left = Math.max(150, Number(record.remaining) || 150);
    record.lastStart = Date.now();
    record.remaining = left;

    const progress = record.item.querySelector('.notification-item__progress');
    if (progress) {
      progress.style.animationDuration = `${left}ms`;
      progress.style.animationPlayState = 'running';
    }

    record.timeoutId = window.setTimeout(function () {
      closeById(record.id);
    }, left);
  }

  function buildItem(record) {
    const options = record.options;
    const type = normalizeType(options.type);
    const meta = TYPE_META[type];

    const title = escapeHtml(options.title || meta.title);
    const message = escapeHtml(options.message || '');

    const item = document.createElement('article');
    item.className = `notification-item notification-item--${type}`;
    item.setAttribute('role', type === TYPE_ERROR ? 'alert' : 'status');
    item.dataset.notificationId = record.id;

    const dismissButton = options.dismissible
      ? '<button type="button" class="notification-item__close" aria-label="Fechar notificacao">×</button>'
      : '';

    const progress = options.showProgress
      ? '<div class="notification-item__progress" aria-hidden="true"></div>'
      : '';

    item.innerHTML = `
      <div class="notification-item__inner">
        <div class="notification-item__icon" aria-hidden="true">${meta.icon}</div>
        <div class="notification-item__copy">
          <p class="notification-item__title">${title}</p>
          <div class="notification-item__message">${message}</div>
        </div>
        ${dismissButton}
      </div>
      ${progress}
    `;

    if (options.dismissible) {
      const closeButton = item.querySelector('.notification-item__close');
      if (closeButton) {
        closeButton.addEventListener('click', function () {
          closeById(record.id);
        });
      }
    }

    if (options.pauseOnHover) {
      item.addEventListener('mouseenter', function () {
        pauseAutoClose(record);
      });

      item.addEventListener('mouseleave', function () {
        resumeAutoClose(record);
      });
    }

    return item;
  }

  function closeById(id) {
    const record = visible.get(id);
    if (!record || !record.item || record.item.classList.contains('is-leaving')) {
      return;
    }

    if (record.timeoutId) {
      window.clearTimeout(record.timeoutId);
      record.timeoutId = null;
    }

    record.item.classList.add('is-leaving');

    window.setTimeout(function () {
      if (record.item && record.item.parentNode) {
        record.item.parentNode.removeChild(record.item);
      }
      visible.delete(id);
      flushQueue();
    }, 230);
  }

  function flushQueue() {
    const shell = ensureShell();
    while (visible.size < config.maxVisible && queue.length > 0) {
      const record = queue.shift();
      if (!record) {
        break;
      }

      record.item = buildItem(record);
      shell.appendChild(record.item);
      visible.set(record.id, record);

      scheduleAutoClose(record);
    }
  }

  function pushNotification(notificationOptions) {
    injectStyles();
    ensureShell();

    const options = Object.assign({}, config, notificationOptions || {});
    options.type = normalizeType(options.type);
    options.message = String(options.message || '').trim();
    options.title = String(options.title || '').trim();

    if (!options.message && !options.title) {
      return null;
    }

    if (!options.message) {
      options.message = options.title;
    }

    if (!options.title) {
      options.title = TYPE_META[options.type].title;
    }

    const id = `notification-${++notifSeed}`;

    const record = {
      id,
      options,
      item: null,
      timeoutId: null,
      lastStart: 0,
      remaining: 0
    };

    pushHistory(record);
    queue.push(record);
    flushQueue();
    return id;
  }

  function notify(input, type, options) {
    const parsed = parseInput(input, type, options);
    return pushNotification(parsed);
  }

  function fromType(type, message, options) {
    return notify(message, type, options);
  }

  function clearAll() {
    queue.length = 0;
    visible.forEach(function (record) {
      closeById(record.id);
    });
  }

  function configure(nextConfig) {
    if (!nextConfig || typeof nextConfig !== 'object') {
      return Object.assign({}, config);
    }

    Object.assign(config, nextConfig);
    config.maxVisible = Math.max(1, Number(config.maxVisible) || DEFAULTS.maxVisible);
    return Object.assign({}, config);
  }

  function getHistory() {
    return history.slice();
  }

  function formatHistoryDate(timestamp) {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'medium'
    }).format(date);
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderHistoryView() {
    injectStyles();

    const view = document.getElementById('page-view');
    if (!view) {
      return null;
    }

    const entries = history.slice();
    const counts = Object.keys(TYPE_META).map((type) => ({
      type,
      label: TYPE_META[type].title,
      count: entries.filter((item) => item.type === type).length
    }));

    const summaryMarkup = counts.map((item) => `
      <article class="notifications-history__summary-card">
        <span class="notifications-history__summary-label">${escapeHtml(item.label)}</span>
        <strong class="notifications-history__summary-value">${item.count}</strong>
      </article>
    `).join('');

    const listMarkup = entries.length
      ? entries.map((item) => {
        const meta = TYPE_META[item.type] || TYPE_META[TYPE_INFO];
        return `
          <article class="notifications-history__item notifications-history__item--${escapeHtml(item.type)}">
            <div class="notifications-history__item-header">
              <h3 class="notifications-history__item-title">${escapeHtml(item.title || meta.title)}</h3>
              <span class="notifications-history__item-meta">${escapeHtml(formatHistoryDate(item.timestamp))}</span>
            </div>
            <p class="notifications-history__item-message">${escapeHtml(item.message || '')}</p>
          </article>
        `;
      }).join('')
      : '<p class="notifications-history__empty">Nenhuma notificação foi gerada ainda.</p>';

    view.innerHTML = `
      <section class="notifications-history">
        <div class="notifications-history__header">
          <p class="notifications-history__eyebrow">Centro de notificações</p>
          <h2 class="notifications-history__title">Todas as notificações geradas</h2>
          <p>As entradas abaixo usam cores diferentes para cada tipo de notificação.</p>
        </div>
        <div class="notifications-history__summary">${summaryMarkup}</div>
        <div class="notifications-history__list">${listMarkup}</div>
      </section>
    `;

    return entries;
  }

  function openHistoryView() {
    const entries = renderHistoryView();

    if (window.ExilioApp && typeof window.ExilioApp.typeTerminalLines === 'function') {
      const lines = entries && entries.length
        ? [
          { text: `Notificações registradas: ${entries.length}`, className: 'console-line status-line' },
          ...entries.slice(0, 12).map((item) => ({
            text: `[${TYPE_META[item.type] ? TYPE_META[item.type].title : 'Info'}] ${item.title || ''} - ${item.message || ''}`,
            className: `console-line notification-history-line notification-history-line--${item.type}`
          }))
        ]
        : [{ text: 'Nenhuma notificação foi gerada ainda.', className: 'console-line status-line' }];

      return window.ExilioApp.typeTerminalLines(lines);
    }

    return entries;
  }

  function setupHistoryButton() {
    const button = document.getElementById('notifications-button');
    if (!button) return;

    button.addEventListener('click', openHistoryView);
  }

  document.addEventListener('DOMContentLoaded', setupHistoryButton);

  window.ExilioApp = window.ExilioApp || {};
  window.ExilioApp.notifications = {
    types: TYPES,
    show: notify,
    info(message, options) {
      return fromType(TYPE_INFO, message, options);
    },
    error(message, options) {
      return fromType(TYPE_ERROR, message, options);
    },
    success(message, options) {
      return fromType(TYPE_SUCCESS, message, options);
    },
    system(message, options) {
      return fromType(TYPE_SYSTEM, message, options);
    },
    alert(message, options) {
      return fromType(TYPE_ALERT, message, options);
    },
    close(id) {
      closeById(id);
    },
    getHistory,
    renderHistoryView,
    openHistoryView,
    clear() {
      clearAll();
    },
    configure(nextConfig) {
      return configure(nextConfig);
    }
  };

  window.ExilioApp.notify = notify;
})();
