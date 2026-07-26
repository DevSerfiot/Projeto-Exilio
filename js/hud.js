/* HUD controller and automatic indicator updates */
(function () {
  const HUD_NAMESPACE = 'ExilioApp';
  const UPDATE_MIN_MS = 2000;
  const UPDATE_MAX_MS = 6000;
  const TARGET_FRAME_MS = 1000 / 24;

  const METRIC_DEFINITIONS = [
    { label: 'CPU', kind: 'percent', min: 42, max: 91, baseline: 68, step: 5.8, wobble: 1.1, speed: 0.33, motion: 'volatile' },
    { label: 'RAM', kind: 'percent', min: 48, max: 93, baseline: 74, step: 4.9, wobble: 0.9, speed: 0.27, motion: 'steady' },
    { label: 'Energia', kind: 'percent', min: 55, max: 98, baseline: 81, step: 4.1, wobble: 0.7, speed: 0.21, motion: 'drift' },
    { label: 'Temperatura', kind: 'temperature', min: 32.4, max: 44.8, baseline: 39.2, step: 0.7, wobble: 0.18, speed: 0.29, motion: 'heat' },
    { label: 'Ping', kind: 'latency', min: 24, max: 88, baseline: 41, step: 5.8, wobble: 1.4, speed: 0.31, motion: 'volatile' },
    { label: 'Latência', kind: 'latency', min: 8, max: 34, baseline: 13, step: 2.2, wobble: 0.6, speed: 0.38, motion: 'volatile' },
    { label: 'Oxigênio', kind: 'percent', min: 88, max: 99.6, baseline: 95.1, step: 1.1, wobble: 0.25, speed: 0.19, motion: 'breath' },
    { label: 'Pressão', kind: 'pressure', min: 0.97, max: 1.08, baseline: 1.02, step: 0.01, wobble: 0.004, speed: 0.22, motion: 'drift' },
    { label: 'Contaminação', kind: 'percent', min: 87, max: 99.6, baseline: 94.7, step: 1.2, wobble: 0.25, speed: 0.18, motion: 'pulse' },
    { label: 'Integridade', kind: 'percent', min: 39, max: 72, baseline: 54, step: 4.6, wobble: 0.8, speed: 0.24, motion: 'drift' }
  ];

  const CONNECTION_LABELS = {
    stable: 'Conexão estável',
    warning: 'Conexão oscilante',
    degraded: 'Conexão degradada',
    critical: 'Conexão crítica'
  };

  const STATUS_LABELS = {
    nominal: 'OPERACIONAL',
    warning: 'INSTÁVEL',
    alert: 'ALERTA',
    critical: 'CRÍTICO'
  };

  const app = getApp();
  let animationFrameId = null;
  let running = false;
  let metrics = [];
  let hudInViewport = true;
  let pageVisible = !document.hidden;
  let lastFrameAt = 0;

  function getApp() {
    return window[HUD_NAMESPACE] || (window[HUD_NAMESPACE] = {});
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function getPerfApi() {
    return window.ExilioApp && window.ExilioApp.performance
      ? window.ExilioApp.performance
      : null;
  }

  function randBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function easeInOutCubic(value) {
    return value < 0.5
      ? 4 * value * value * value
      : 1 - Math.pow(-2 * value + 2, 3) / 2;
  }

  function stripAccents(value) {
    return value
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function getCardByLabel(label) {
    const targetLabel = stripAccents(label);
    return Array.from(document.querySelectorAll('.hud-card')).find((card) => {
      const labelElement = card.querySelector('.hud-card__label');
      return labelElement && stripAccents(labelElement.textContent || '') === targetLabel;
    }) || null;
  }

  function formatMetricValue(definition, value) {
    if (definition.kind === 'pressure') {
      return value.toFixed(2) + ' atm';
    }

    if (definition.kind === 'temperature') {
      return value.toFixed(1) + '°C';
    }

    if (definition.kind === 'latency') {
      return value.toFixed(1) + ' ms';
    }

    return value.toFixed(1) + '%';
  }

  function normalizePercent(definition, value) {
    return clamp(((value - definition.min) / (definition.max - definition.min)) * 100, 0, 100);
  }

  function getInitialValue(definition, valueElement) {
    if (!valueElement) {
      return definition.baseline;
    }

    const raw = valueElement.textContent || '';
    const parsed = Number.parseFloat(raw.replace(',', '.').replace(/[^\d.-]/g, ''));
    if (Number.isFinite(parsed)) {
      return clamp(parsed, definition.min, definition.max);
    }

    return definition.baseline;
  }

  function createMetricState(definition) {
    const card = getCardByLabel(definition.label);
    if (!card) {
      return null;
    }

    const valueElement = card.querySelector('.hud-card__value');
    const barElement = card.querySelector('.hud-bar span');
    const statusElement = card.classList.contains('hud-card--status')
      ? card.querySelector('.hud-card__status')
      : null;
    const initialValue = getInitialValue(definition, valueElement);

    return {
      definition,
      card,
      valueElement,
      barElement,
      statusElement,
      transitionFrom: initialValue,
      transitionTo: initialValue,
      transitionStart: performance.now(),
      transitionDuration: randBetween(900, 1600),
      nextUpdateAt: performance.now() + randBetween(UPDATE_MIN_MS, UPDATE_MAX_MS),
      phase: Math.random() * Math.PI * 2,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: definition.motion === 'volatile'
        ? 2.8
        : definition.motion === 'pulse'
          ? 2.2
          : definition.motion === 'heat'
            ? 1.4
            : definition.motion === 'breath'
              ? 1.1
              : 1.6
    };
  }

  function getRenderedValue(metric, now = performance.now()) {
    const definition = metric.definition;
    const elapsed = clamp((now - metric.transitionStart) / metric.transitionDuration, 0, 1);
    const eased = easeInOutCubic(elapsed);
    const base = metric.transitionFrom + (metric.transitionTo - metric.transitionFrom) * eased;
    const wobble = Math.sin((now / 1000) * definition.speed + metric.phase) * definition.wobble;

    return clamp(base + wobble, definition.min, definition.max);
  }

  function pickNextTarget(metric) {
    const definition = metric.definition;
    const recenter = (definition.baseline - metric.transitionTo) * randBetween(0.08, 0.18);
    const delta = randBetween(-definition.step, definition.step);
    const target = clamp(metric.transitionTo + delta + recenter, definition.min, definition.max);

    metric.transitionFrom = getRenderedValue(metric);
    metric.transitionTo = target;
    metric.transitionStart = performance.now();
    metric.transitionDuration = randBetween(900, 1700);
    metric.phase = (metric.phase + randBetween(0.35, 1.1)) % (Math.PI * 2);
    metric.pulsePhase = (metric.pulsePhase + randBetween(0.18, 0.65)) % (Math.PI * 2);
    metric.nextUpdateAt = performance.now() + randBetween(UPDATE_MIN_MS, UPDATE_MAX_MS);
  }

  function getConnectionState(value) {
    if (value >= 84) {
      return 'stable';
    }

    if (value >= 62) {
      return 'warning';
    }

    if (value >= 38) {
      return 'degraded';
    }

    return 'critical';
  }

  function getConnectionBorder(state) {
    if (state === 'stable') return 'rgba(69, 255, 69, 0.26)';
    if (state === 'warning') return 'rgba(255, 209, 102, 0.26)';
    if (state === 'degraded') return 'rgba(255, 122, 61, 0.26)';
    return 'rgba(255, 59, 59, 0.34)';
  }

  function getConnectionGlow(state) {
    if (state === 'stable') return 'inset 0 0 0 1px rgba(69, 255, 69, 0.05)';
    if (state === 'warning') return 'inset 0 0 0 1px rgba(255, 209, 102, 0.05)';
    if (state === 'degraded') return 'inset 0 0 0 1px rgba(255, 122, 61, 0.05)';
    return '0 0 0 1px rgba(255, 59, 59, 0.12)';
  }

  function renderMetric(metric, now) {
    const definition = metric.definition;
    const value = getRenderedValue(metric, now);
    const normalized = normalizePercent(definition, value);
    const motionWave = Math.sin((now / 1000) * metric.pulseSpeed + metric.pulsePhase);
    const motionIntensity = definition.motion === 'volatile'
      ? 0.72
      : definition.motion === 'heat'
        ? 0.35
        : definition.motion === 'breath'
          ? 0.28
          : definition.motion === 'pulse'
            ? 0.56
            : 0.4;
    const shimmer = clamp(normalized + motionWave * motionIntensity, 0, 100);

    if (metric.valueElement) {
      metric.valueElement.textContent = formatMetricValue(definition, value);
    }

    if (metric.barElement) {
      metric.barElement.style.width = normalized.toFixed(2) + '%';
      metric.barElement.style.setProperty('--fill', normalized.toFixed(2) + '%');
      metric.barElement.style.setProperty('--bar-shimmer', shimmer.toFixed(2) + '%');
      metric.barElement.style.setProperty('--bar-speed', definition.motion === 'volatile'
        ? '900ms'
        : definition.motion === 'heat'
          ? '1700ms'
          : definition.motion === 'breath'
            ? '2200ms'
            : definition.motion === 'pulse'
              ? '1300ms'
              : '1500ms');
      metric.barElement.style.setProperty('--bar-glow', definition.motion === 'volatile'
        ? '0.22'
        : definition.motion === 'heat'
          ? '0.12'
          : definition.motion === 'breath'
            ? '0.18'
            : definition.motion === 'pulse'
              ? '0.2'
              : '0.16');
      metric.barElement.style.setProperty('--bar-hue', definition.motion === 'volatile'
        ? '0deg'
        : definition.motion === 'heat'
          ? '18deg'
          : definition.motion === 'breath'
            ? '108deg'
            : definition.motion === 'pulse'
              ? '330deg'
              : '42deg');
    }

    if (metric.statusElement) {
      const connectionState = getConnectionState(value);
      metric.statusElement.textContent = CONNECTION_LABELS[connectionState];
      metric.card.style.borderColor = getConnectionBorder(connectionState);
      metric.card.style.boxShadow = getConnectionGlow(connectionState);
    }
  }

  function getStatusState(now = performance.now()) {
    const cpu = metrics.find((metric) => metric.definition.label === 'CPU');
    const ram = metrics.find((metric) => metric.definition.label === 'RAM');
    const energia = metrics.find((metric) => metric.definition.label === 'Energia');
    const temperatura = metrics.find((metric) => metric.definition.label === 'Temperatura');
    const oxigenio = metrics.find((metric) => metric.definition.label === 'Oxigênio');
    const pressao = metrics.find((metric) => metric.definition.label === 'Pressão');
    const contaminacao = metrics.find((metric) => metric.definition.label === 'Contaminação');
    const integridade = metrics.find((metric) => metric.definition.label === 'Integridade');
    const ping = metrics.find((metric) => metric.definition.label === 'Ping');
    const latencia = metrics.find((metric) => metric.definition.label === 'Latência');

    const sampledValues = [cpu, ram, energia, temperatura, oxigenio, pressao, contaminacao, integridade, ping, latencia]
      .filter(Boolean)
      .map((metric) => getRenderedValue(metric, now));

    const integrityValue = integridade ? getRenderedValue(integridade, now) : 0;
    const contaminationValue = contaminacao ? getRenderedValue(contaminacao, now) : 0;
    const temperatureValue = temperatura ? getRenderedValue(temperatura, now) : 0;
    const oxygenValue = oxigenio ? getRenderedValue(oxigenio, now) : 0;
    const latencyValue = ping ? getRenderedValue(ping, now) : 0;
    const secondaryLatency = latencia ? getRenderedValue(latencia, now) : 0;

    const averageLoad = sampledValues.reduce((total, value) => total + value, 0) / Math.max(sampledValues.length, 1);
    const stressScore = (contaminationValue * 0.33) + ((100 - integrityValue) * 0.34) + (Math.max(0, temperatureValue - 38) * 2.2) + (Math.max(0, 95 - oxygenValue) * 1.1);
    const latencyPressure = latencyValue + secondaryLatency;

    if (stressScore >= 78 || contaminationValue >= 97 || integrityValue <= 45) {
      return {
        label: STATUS_LABELS.critical,
        detail: 'Sistemas em falha progressiva',
        accent: 'rgba(255, 59, 59, 0.22)'
      };
    }

    if (stressScore >= 56 || averageLoad >= 78 || latencyPressure >= 78) {
      return {
        label: STATUS_LABELS.alert,
        detail: 'Estabilidade abaixo do esperado',
        accent: 'rgba(255, 122, 61, 0.22)'
      };
    }

    if (stressScore >= 34 || averageLoad >= 66 || latencyPressure >= 58) {
      return {
        label: STATUS_LABELS.warning,
        detail: 'Variações sob monitoramento',
        accent: 'rgba(255, 209, 102, 0.22)'
      };
    }

    return {
      label: STATUS_LABELS.nominal,
      detail: 'Operação controlada',
      accent: 'rgba(69, 255, 69, 0.18)'
    };
  }

  function renderGlobalStatus(now) {
    const statusMetric = metrics.find((metric) => metric.definition.label === 'Status Global');
    if (!statusMetric) {
      return;
    }

    const snapshot = getStatusState(now);

    if (statusMetric.valueElement) {
      statusMetric.valueElement.textContent = snapshot.label;
    }

    if (statusMetric.statusElement) {
      statusMetric.statusElement.textContent = snapshot.detail;
    }

    statusMetric.card.style.borderColor = snapshot.accent;
    statusMetric.card.style.boxShadow = 'inset 0 0 0 1px ' + snapshot.accent;
  }

  function updateStatusPill(stateLabel) {
    const online = document.querySelector('.status-pill.status-online');
    if (online) {
      online.classList.add('alert-blink');
      if (stateLabel) {
        online.textContent = stateLabel;
      }
    }
  }

  function applyConnectionState(now) {
    const connectionStateBlock = document.querySelector('.hud-panel__state');
    if (!connectionStateBlock) {
      return;
    }

    const pingMetric = metrics.find((metric) => metric.definition.label === 'Ping');
    const connectionValue = pingMetric ? getRenderedValue(pingMetric, now) : 0;
    const connectionState = getConnectionState(connectionValue);
    const statusText = connectionStateBlock.querySelector('span:last-child');

    if (statusText) {
      statusText.textContent = CONNECTION_LABELS[connectionState];
    }

    connectionStateBlock.style.borderColor = getConnectionBorder(connectionState);
    connectionStateBlock.style.background = connectionState === 'critical'
      ? 'rgba(255, 59, 59, 0.12)'
      : connectionState === 'degraded'
        ? 'rgba(255, 122, 61, 0.11)'
        : connectionState === 'warning'
          ? 'rgba(255, 209, 102, 0.11)'
          : 'rgba(69, 255, 69, 0.08)';

    updateStatusPill(connectionState === 'stable' ? 'ONLINE' : 'WARN');
  }

  function tick(now) {
    if (!running) {
      return;
    }

    if (!lastFrameAt) {
      lastFrameAt = now;
    }

    if (now - lastFrameAt < TARGET_FRAME_MS) {
      animationFrameId = window.requestAnimationFrame(tick);
      return;
    }

    lastFrameAt = now;

    for (const metric of metrics) {
      if (now >= metric.nextUpdateAt) {
        pickNextTarget(metric);
      }

      renderMetric(metric, now);
    }

    renderGlobalStatus(now);
    applyConnectionState(now);

    animationFrameId = window.requestAnimationFrame(tick);
  }

  function start() {
    if (running) {
      return;
    }

    if (!metrics.length) {
      metrics = METRIC_DEFINITIONS
        .map(createMetricState)
        .filter(Boolean);
    }

    if (!metrics.length) {
      return;
    }

    running = true;
    lastFrameAt = 0;
    animationFrameId = window.requestAnimationFrame(tick);
  }

  function stop() {
    running = false;

    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function refresh() {
    const now = performance.now();

    for (const metric of metrics) {
      metric.transitionFrom = getRenderedValue(metric, now);
      metric.transitionTo = clamp(metric.transitionTo + randBetween(-metric.definition.step, metric.definition.step), metric.definition.min, metric.definition.max);
      metric.transitionStart = now;
      metric.transitionDuration = randBetween(700, 1200);
      metric.nextUpdateAt = now + randBetween(UPDATE_MIN_MS, UPDATE_MAX_MS);
      metric.pulsePhase = Math.random() * Math.PI * 2;
    }
  }

  function updateRunState() {
    const shouldRun = pageVisible && hudInViewport;
    if (shouldRun) {
      start();
      return;
    }

    stop();
  }

  function bindVisibilityControls() {
    const perf = getPerfApi();
    if (!perf) return;

    if (typeof perf.observeVisibility === 'function') {
      const panel = document.querySelector('.right-panel') || document.querySelector('.hud-panel');
      perf.observeVisibility(panel, {
        threshold: 0.08,
        onEnter: () => {
          hudInViewport = true;
          updateRunState();
        },
        onExit: () => {
          hudInViewport = false;
          updateRunState();
        }
      });
    }

    if (typeof perf.watchPageVisibility === 'function') {
      perf.watchPageVisibility((visible) => {
        pageVisible = visible;
        updateRunState();
      });
    }
  }

  function init() {
    updateStatusPill('ONLINE');
    bindVisibilityControls();
    updateRunState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.addEventListener('boot:complete', () => {
    if (!running) {
      start();
    }

    refresh();
  });

  window.addEventListener('boot:restart', () => {
    refresh();
  });

  window.addEventListener('beforeunload', stop);

  app.hud = {
    start,
    stop,
    refresh,
    updateStatusPill
  };
})();
