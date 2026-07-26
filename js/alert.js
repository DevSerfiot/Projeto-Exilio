/* Cinematic alert module */
(function () {
  const ALERT_TYPES = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    SUCCESS: 'success',
    SYSTEM: 'system'
  };

  const TYPE_META = {
    info: { icon: 'i', label: 'INFO' },
    warning: { icon: '⚠', label: 'WARNING' },
    error: { icon: '✖', label: 'ERROR' },
    success: { icon: '✓', label: 'SUCCESS' },
    system: { icon: '◼', label: 'SYSTEM' }
  };

  const DEFAULT_OPTIONS = {
    type: ALERT_TYPES.INFO,
    title: 'ALERTA DE SISTEMA',
    subtitle: '',
    duration: 4200,
    sound: false,
    soundName: 'alert'
  };

  let styleInjected = false;
  let shellRef = null;

  function ensureShell() {
    if (shellRef && document.body.contains(shellRef)) {
      return shellRef;
    }

    shellRef = document.getElementById('cinematic-alert-shell');
    if (shellRef) {
      return shellRef;
    }

    shellRef = document.createElement('div');
    shellRef.id = 'cinematic-alert-shell';
    shellRef.className = 'cinematic-alert-shell';
    shellRef.setAttribute('aria-live', 'polite');
    document.body.appendChild(shellRef);

    return shellRef;
  }

  function injectStyles() {
    if (styleInjected || document.getElementById('cinematic-alert-style')) {
      styleInjected = true;
      return;
    }

    const style = document.createElement('style');
    style.id = 'cinematic-alert-style';
    style.textContent = `
      .cinematic-alert-shell {
        position: fixed;
        top: 16px;
        right: 16px;
        width: min(420px, calc(100vw - 24px));
        display: grid;
        gap: 10px;
        z-index: 1200;
        pointer-events: none;
      }

      .cinematic-alert {
        position: relative;
        overflow: hidden;
        pointer-events: auto;
        border: 1px solid rgba(255, 100, 100, 0.35);
        border-left-width: 4px;
        border-radius: 12px;
        background:
          linear-gradient(145deg, rgba(17, 17, 17, 0.95), rgba(10, 10, 10, 0.96)),
          repeating-linear-gradient(180deg, rgba(255, 80, 80, 0.02) 0px, rgba(255, 80, 80, 0.02) 2px, transparent 2px, transparent 4px);
        color: #f2f2f2;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.42);
        transform: translateX(32px);
        opacity: 0;
        animation:
          ca-slide-in 300ms cubic-bezier(0.2, 0.7, 0.25, 1) forwards,
          ca-fade-in 220ms ease forwards,
          ca-glow 2.2s ease-in-out infinite,
          ca-pulse 2.8s ease-in-out infinite;
      }

      .cinematic-alert::before {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        transform: translateX(-120%);
        animation: ca-scan 2.8s linear infinite;
      }

      .cinematic-alert.is-closing {
        animation: ca-fade-out 260ms ease forwards, ca-slide-out 260ms ease forwards;
      }

      .cinematic-alert__inner {
        display: grid;
        grid-template-columns: 36px 1fr;
        gap: 10px;
        align-items: start;
        padding: 12px 14px;
      }

      .cinematic-alert__icon {
        width: 30px;
        height: 30px;
        border-radius: 8px;
        display: grid;
        place-items: center;
        font-size: 0.95rem;
        font-weight: 700;
        background: rgba(255, 80, 80, 0.12);
        border: 1px solid rgba(255, 80, 80, 0.35);
        text-shadow: 0 0 8px rgba(255, 120, 120, 0.35);
      }

      .cinematic-alert__content {
        min-width: 0;
      }

      .cinematic-alert__title {
        margin: 0;
        font-size: 0.86rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        font-weight: 700;
        line-height: 1.35;
      }

      .cinematic-alert__subtitle {
        margin-top: 5px;
        font-size: 0.78rem;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: rgba(230, 230, 230, 0.82);
      }

      .cinematic-alert__meta {
        margin-top: 8px;
        font-size: 0.66rem;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: rgba(255, 220, 220, 0.72);
      }

      .cinematic-alert--info {
        border-left-color: #66b8ff;
      }

      .cinematic-alert--warning {
        border-left-color: #ffd166;
      }

      .cinematic-alert--error {
        border-left-color: #ff5f5f;
      }

      .cinematic-alert--success {
        border-left-color: #5fd77a;
      }

      .cinematic-alert--system {
        border-left-color: #b38bff;
      }

      @keyframes ca-slide-in {
        from { transform: translateX(32px); }
        to { transform: translateX(0); }
      }

      @keyframes ca-slide-out {
        from { transform: translateX(0); }
        to { transform: translateX(26px); }
      }

      @keyframes ca-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes ca-fade-out {
        from { opacity: 1; }
        to { opacity: 0; }
      }

      @keyframes ca-glow {
        0%, 100% { box-shadow: 0 10px 30px rgba(0, 0, 0, 0.42), 0 0 0 rgba(255, 80, 80, 0.08); }
        50% { box-shadow: 0 14px 34px rgba(0, 0, 0, 0.46), 0 0 22px rgba(255, 80, 80, 0.12); }
      }

      @keyframes ca-pulse {
        0%, 100% { filter: saturate(1) brightness(1); }
        50% { filter: saturate(1.08) brightness(1.05); }
      }

      @keyframes ca-scan {
        from { transform: translateX(-120%); }
        to { transform: translateX(130%); }
      }

      @media (max-width: 768px) {
        .cinematic-alert-shell {
          left: 12px;
          right: 12px;
          width: auto;
          top: 12px;
        }
      }
    `;

    document.head.appendChild(style);
    styleInjected = true;
  }

  function normalizeType(type) {
    const value = String(type || '').trim().toLowerCase();
    if (TYPE_META[value]) {
      return value;
    }
    return ALERT_TYPES.INFO;
  }

  function removeAlertNode(node) {
    if (!node || node.classList.contains('is-closing')) return;

    node.classList.add('is-closing');
    window.setTimeout(() => {
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
    }, 280);
  }

  function maybePlaySound(options) {
    if (!options.sound) return;

    if (window.ExilioApp && typeof window.ExilioApp.playSound === 'function') {
      window.ExilioApp.playSound(options.soundName || 'alert');
    }
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showAlert(config) {
    injectStyles();
    const shell = ensureShell();

    const options = Object.assign({}, DEFAULT_OPTIONS, config || {});
    const type = normalizeType(options.type);
    const meta = TYPE_META[type];

    const item = document.createElement('article');
    item.className = `cinematic-alert cinematic-alert--${type}`;
    item.setAttribute('role', type === ALERT_TYPES.ERROR ? 'alert' : 'status');

    const titleText = escapeHtml(options.title || options.message || DEFAULT_OPTIONS.title);
    const subtitleText = escapeHtml(options.subtitle || options.details || '');

    item.innerHTML = `
      <div class="cinematic-alert__inner">
        <div class="cinematic-alert__icon" aria-hidden="true">${meta.icon}</div>
        <div class="cinematic-alert__content">
          <p class="cinematic-alert__title">${titleText}</p>
          ${subtitleText ? `<div class="cinematic-alert__subtitle">${subtitleText}</div>` : ''}
          <div class="cinematic-alert__meta">${meta.label}</div>
        </div>
      </div>
    `;

    shell.appendChild(item);
    maybePlaySound(options);

    const duration = Number.isFinite(options.duration) ? Math.max(900, options.duration) : DEFAULT_OPTIONS.duration;
    window.setTimeout(() => {
      removeAlertNode(item);
    }, duration);

    return item;
  }

  function fromType(type, title, subtitle, opts) {
    return showAlert(Object.assign({}, opts || {}, { type, title, subtitle }));
  }

  window.ExilioApp = window.ExilioApp || {};
  window.ExilioApp.alert = {
    types: ALERT_TYPES,
    show: showAlert,
    info(title, subtitle, options) {
      return fromType(ALERT_TYPES.INFO, title, subtitle, options);
    },
    warning(title, subtitle, options) {
      return fromType(ALERT_TYPES.WARNING, title, subtitle, options);
    },
    error(title, subtitle, options) {
      return fromType(ALERT_TYPES.ERROR, title, subtitle, options);
    },
    success(title, subtitle, options) {
      return fromType(ALERT_TYPES.SUCCESS, title, subtitle, options);
    },
    system(title, subtitle, options) {
      return fromType(ALERT_TYPES.SYSTEM, title, subtitle, options);
    },
    example() {
      return showAlert({
        type: ALERT_TYPES.WARNING,
        title: 'MOVIMENTO DETECTADO',
        subtitle: 'Setor C-14',
        sound: true,
        duration: 4200
      });
    }
  };
})();
