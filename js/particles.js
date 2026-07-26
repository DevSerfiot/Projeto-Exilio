/* Particle system wrapper */
(function () {
  const CONFIG = {
    maxDpr: 1.5,
    targetFrameMs: 1000 / 30,
    lowMotionFactor: 0.5,
    baseCounts: {
      dust: 24,
      smoke: 10,
      glow: 8,
      redGlow: 7
    },
    mobileCounts: {
      dust: 14,
      smoke: 6,
      glow: 5,
      redGlow: 4
    }
  };

  let engine = null;
  let appInView = true;

  function getPerfApi() {
    return window.ExilioApp && window.ExilioApp.performance
      ? window.ExilioApp.performance
      : null;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function createEngine(layer) {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';

    layer.innerHTML = '';
    layer.appendChild(canvas);

    const context = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!context) {
      return null;
    }

    const sprites = {
      dust: createSprite('rgba(255, 120, 100, 0.28)'),
      smoke: createSprite('rgba(150, 40, 40, 0.18)'),
      glow: createSprite('rgba(255, 220, 180, 0.32)'),
      redGlow: createSprite('rgba(255, 40, 40, 0.34)')
    };

    const state = {
      canvas,
      context,
      sprites,
      particles: [],
      width: 0,
      height: 0,
      dpr: 1,
      rafId: 0,
      running: false,
      lastTimestamp: 0,
      accumulator: 0,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    };

    function createSprite(color) {
      const sprite = document.createElement('canvas');
      sprite.width = 64;
      sprite.height = 64;
      const spriteContext = sprite.getContext('2d');
      if (!spriteContext) {
        return sprite;
      }

      const gradient = spriteContext.createRadialGradient(32, 32, 2, 32, 32, 32);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.65, color.replace(/0\.\d+\)/, '0.12)'));
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
      spriteContext.fillStyle = gradient;
      spriteContext.beginPath();
      spriteContext.arc(32, 32, 32, 0, Math.PI * 2);
      spriteContext.fill();
      return sprite;
    }

    function getCounts() {
      const mobile = window.innerWidth < 768;
      return mobile ? CONFIG.mobileCounts : CONFIG.baseCounts;
    }

    function resize() {
      state.dpr = clamp(window.devicePixelRatio || 1, 1, CONFIG.maxDpr);
      state.width = Math.max(window.innerWidth, 1);
      state.height = Math.max(window.innerHeight, 1);
      canvas.width = Math.floor(state.width * state.dpr);
      canvas.height = Math.floor(state.height * state.dpr);
      context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
      initParticles();
    }

    function initParticles() {
      const counts = getCounts();
      const particles = [];
      appendParticles(particles, 'dust', counts.dust, 1.2, 2.8, 0.012, 0.03, 0.035, 0.08);
      appendParticles(particles, 'smoke', counts.smoke, 12, 24, 0.006, 0.016, 0.016, 0.05);
      appendParticles(particles, 'glow', counts.glow, 2.5, 5.5, 0.008, 0.02, 0.025, 0.09);
      appendParticles(particles, 'redGlow', counts.redGlow, 4.5, 10, 0.01, 0.022, 0.03, 0.1);
      state.particles = particles;
    }

    function appendParticles(store, type, count, minSize, maxSize, minSpeed, maxSpeed, minPulse, maxPulse) {
      for (let index = 0; index < count; index += 1) {
        const size = randomBetween(minSize, maxSize);
        store.push({
          type,
          x: Math.random() * state.width,
          y: Math.random() * state.height,
          vx: randomBetween(-maxSpeed, maxSpeed),
          vy: randomBetween(-maxSpeed, -minSpeed),
          size,
          alpha: randomBetween(0.12, 0.42),
          pulse: randomBetween(minPulse, maxPulse),
          pulseOffset: Math.random() * Math.PI * 2
        });
      }
    }

    function updateParticle(particle, delta) {
      const motionFactor = state.reducedMotion ? CONFIG.lowMotionFactor : 1;
      particle.x += particle.vx * delta * motionFactor;
      particle.y += particle.vy * delta * motionFactor;

      if (particle.x < -32) particle.x = state.width + 16;
      if (particle.x > state.width + 32) particle.x = -16;
      if (particle.y < -36) {
        particle.y = state.height + 24;
        particle.x = Math.random() * state.width;
      }
    }

    function render(timestamp) {
      if (!state.running) return;

      if (!state.lastTimestamp) {
        state.lastTimestamp = timestamp;
      }

      const deltaMs = timestamp - state.lastTimestamp;
      state.lastTimestamp = timestamp;
      state.accumulator += deltaMs;

      if (state.accumulator < CONFIG.targetFrameMs) {
        state.rafId = window.requestAnimationFrame(render);
        return;
      }

      const frameFactor = state.accumulator / 16.6667;
      state.accumulator = 0;

      context.clearRect(0, 0, state.width, state.height);

      for (let index = 0; index < state.particles.length; index += 1) {
        const particle = state.particles[index];
        updateParticle(particle, frameFactor);

        const pulseAlpha = particle.alpha + Math.sin((timestamp * 0.001) + particle.pulseOffset) * particle.pulse;
        const alpha = clamp(pulseAlpha, 0.05, 0.48);

        context.globalAlpha = alpha;
        const size = particle.size * (particle.type === 'smoke' ? 2.1 : 1.6);
        context.drawImage(state.sprites[particle.type], particle.x - size, particle.y - size, size * 2, size * 2);
      }

      context.globalAlpha = 1;
      state.rafId = window.requestAnimationFrame(render);
    }

    function start() {
      if (state.running) return;
      state.running = true;
      state.lastTimestamp = 0;
      state.accumulator = 0;
      state.rafId = window.requestAnimationFrame(render);
    }

    function stop() {
      state.running = false;
      if (state.rafId) {
        window.cancelAnimationFrame(state.rafId);
        state.rafId = 0;
      }
    }

    function destroy() {
      stop();
      state.particles.length = 0;
      layer.innerHTML = '';
    }

    resize();

    return {
      start,
      stop,
      destroy,
      resize
    };
  }

  function createParticles() {
    const layer = document.getElementById('particle-layer');
    if (!layer) return;

    if (engine) {
      engine.destroy();
      engine = null;
    }

    engine = createEngine(layer);
    if (!engine) return;

    if (!document.hidden && appInView) {
      engine.start();
    }
  }

  function handleResize() {
    if (engine) {
      engine.resize();
    }
  }

  function handleVisibilityChange() {
    if (!engine) return;
    if (document.hidden || !appInView) {
      engine.stop();
    } else {
      engine.start();
    }
  }

  function observeAppVisibility() {
    const perf = getPerfApi();
    if (!perf || typeof perf.observeVisibility !== 'function') {
      return;
    }

    const shell = document.getElementById('app-shell') || document.body;
    perf.observeVisibility(shell, {
      threshold: 0.05,
      onEnter: () => {
        appInView = true;
        handleVisibilityChange();
      },
      onExit: () => {
        appInView = false;
        handleVisibilityChange();
      }
    });
  }

  function initParticles() {
    const perf = getPerfApi();

    observeAppVisibility();

    if (perf && typeof perf.runWhenIdle === 'function') {
      perf.runWhenIdle(createParticles, 1400);
      return;
    }

    setTimeout(createParticles, 180);
  }

  document.addEventListener('DOMContentLoaded', initParticles);

  const perfApi = getPerfApi();
  const resizeHandler = perfApi && typeof perfApi.rafThrottle === 'function'
    ? perfApi.rafThrottle(handleResize)
    : handleResize;

  window.addEventListener('resize', resizeHandler, { passive: true });
  document.addEventListener('visibilitychange', handleVisibilityChange);

  window.ExilioApp = window.ExilioApp || {};
  window.ExilioApp.createParticles = createParticles;
})();
