/* Automatic background events for the Exilio terminal */
(function () {
  const MIN_DELAY_MS = 9000;
  const MAX_DELAY_MS = 24000;
  const EVENT_DURATION_MS = 4200;

  const EVENT_POOL = [
    {
      title: 'Nova transmissão',
      type: 'system',
      message: 'Canal secundário recebeu um pacote de emergência.'
    },
    {
      title: 'Arquivo recuperado',
      type: 'success',
      message: 'Bloco de dados antigo foi restaurado com integridade parcial.'
    },
    {
      title: 'Movimento detectado',
      type: 'alert',
      message: 'Sensores externos registraram presença no setor leste.'
    },
    {
      title: 'Conexão perdida',
      type: 'error',
      message: 'A torre de retransmissão ficou fora de alcance por instantes.'
    },
    {
      title: 'Reator estabilizado',
      type: 'success',
      message: 'A leitura térmica voltou para a faixa segura.'
    },
    {
      title: 'Sistema comprometido',
      type: 'error',
      message: 'Tentativa de acesso irregular foi registrada no núcleo local.'
    },
    {
      title: 'Contaminação elevada',
      type: 'alert',
      message: 'Os índices ambientais ultrapassaram o limite recomendado.'
    }
  ];

  const state = {
    running: false,
    timerId: null,
    pageVisible: !document.hidden,
    activeBootListener: null,
    activeRestartListener: null
  };

  function getPerfApi() {
    return window.ExilioApp && window.ExilioApp.performance
      ? window.ExilioApp.performance
      : null;
  }

  function randomBetween(min, max) {
    return Math.floor(min + Math.random() * (max - min + 1));
  }

  function getNotificationsApi() {
    if (window.ExilioApp && window.ExilioApp.notifications) {
      return window.ExilioApp.notifications;
    }

    return null;
  }

  function emitNotification(eventData) {
    const notifications = getNotificationsApi();

    if (notifications && typeof notifications[eventData.type] === 'function') {
      notifications[eventData.type](eventData.message, {
        title: eventData.title,
        duration: EVENT_DURATION_MS
      });
      return;
    }

    if (window.ExilioApp && typeof window.ExilioApp.notify === 'function') {
      window.ExilioApp.notify(eventData.message, eventData.type, {
        title: eventData.title,
        duration: EVENT_DURATION_MS
      });
    }
  }

  function emitEvent() {
    const eventData = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
    emitNotification(eventData);

    window.dispatchEvent(new CustomEvent('exilio:event', {
      detail: {
        title: eventData.title,
        type: eventData.type,
        message: eventData.message,
        timestamp: Date.now()
      }
    }));
  }

  function scheduleNextEvent() {
    if (!state.running || !state.pageVisible) return;

    const delayMs = randomBetween(MIN_DELAY_MS, MAX_DELAY_MS);
    state.timerId = setTimeout(() => {
      state.timerId = null;

      if (!state.running) {
        return;
      }

      emitEvent();
      scheduleNextEvent();
    }, delayMs);
  }

  function start() {
    if (state.running) return;

    state.running = true;
    scheduleNextEvent();
  }

  function stop() {
    state.running = false;

    if (state.timerId) {
      clearTimeout(state.timerId);
      state.timerId = null;
    }
  }

  function isAppReady() {
    const overlay = document.getElementById('startup-overlay');
    const shell = document.getElementById('app-shell');

    return Boolean((overlay && overlay.classList.contains('hidden')) || (shell && shell.classList.contains('is-ready')));
  }

  function waitForBoot() {
    if (isAppReady()) {
      start();
      return;
    }

    if (!state.activeBootListener) {
      state.activeBootListener = () => {
        start();
      };
      window.addEventListener('boot:complete', state.activeBootListener, { once: true });
    }

    if (!state.activeRestartListener) {
      state.activeRestartListener = () => {
        stop();
      };
      window.addEventListener('boot:restart', state.activeRestartListener);
    }
  }

  function init() {
    const perf = getPerfApi();
    if (perf && typeof perf.watchPageVisibility === 'function') {
      perf.watchPageVisibility((visible) => {
        state.pageVisible = visible;
        if (visible) {
          scheduleNextEvent();
        } else if (state.timerId) {
          clearTimeout(state.timerId);
          state.timerId = null;
        }
      });
    }

    waitForBoot();
  }

  document.addEventListener('DOMContentLoaded', init);

  window.ExilioApp = window.ExilioApp || {};
  window.ExilioApp.events = {
    start,
    stop,
    emit: emitEvent
  };
})();
