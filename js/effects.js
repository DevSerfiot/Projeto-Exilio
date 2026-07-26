/* Discrete cinematic effects tuned for low GPU usage */
(function () {
  const EFFECT_STYLE_ID = 'exilio-effects-style';
  const EFFECT_LAYER_ID = 'effect-layer';
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const hoverSelectors = [
    '.terminal-action',
    '.hud-card',
    '.status-pill',
    '.console-screen',
    '.page-view',
    '.quick-commands button'
  ];

  const glitchSelectors = [
    '.brand-name',
    '.console-header h1',
    '.startup-brand',
    '.hud-panel__eyebrow'
  ];

  function ensureStyles() {
    if (document.getElementById(EFFECT_STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = EFFECT_STYLE_ID;
    style.textContent = `
      :root {
        --fx-glow-color: rgba(255, 70, 70, 0.14);
      }

      body.fx-active {
        text-rendering: optimizeLegibility;
      }

      .effect-layer {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 2;
        overflow: hidden;
      }

      .effect-layer > i {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .fx-scan {
        opacity: 0.11;
        mix-blend-mode: soft-light;
        background: repeating-linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.04) 0px,
          rgba(255, 255, 255, 0.04) 1px,
          rgba(0, 0, 0, 0) 1px,
          rgba(0, 0, 0, 0) 3px
        );
        animation: fxScanDrift 14s linear infinite;
      }

      .fx-noise {
        opacity: 0.055;
        mix-blend-mode: overlay;
        background-image: radial-gradient(circle at 35% 20%, rgba(255, 255, 255, 0.22) 0.7px, rgba(0, 0, 0, 0) 0.9px),
          radial-gradient(circle at 72% 61%, rgba(255, 255, 255, 0.18) 0.8px, rgba(0, 0, 0, 0) 1px);
        background-size: 4px 4px, 5px 5px;
        animation: fxNoiseShift 0.8s steps(2, end) infinite;
      }

      .fx-reflection {
        inset: -12%;
        opacity: 0.08;
        background: linear-gradient(120deg, rgba(255, 255, 255, 0) 35%, rgba(255, 255, 255, 0.12) 46%, rgba(255, 255, 255, 0) 58%);
        transform: translateX(-55%) rotate(1deg);
        animation: fxReflectionSweep 20s ease-in-out infinite;
      }

      .fx-interference {
        opacity: 0;
        mix-blend-mode: screen;
        background:
          linear-gradient(90deg, rgba(255, 0, 0, 0.05), rgba(255, 255, 255, 0.02), rgba(255, 0, 0, 0.05));
        transition: opacity 180ms ease;
      }

      .fx-interference.is-on {
        opacity: 0.22;
      }

      .fx-glow {
        box-shadow: 0 0 0 1px rgba(255, 60, 60, 0.15), 0 0 18px var(--fx-glow-color);
      }

      .fx-glitch {
        animation: fxGlitchPulse 160ms steps(2, end);
      }

      .fx-cinematic {
        transform-style: preserve-3d;
        will-change: transform;
        transition: transform 190ms ease, box-shadow 220ms ease;
      }

      .fx-cinematic:hover {
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 85, 85, 0.12);
      }

      @keyframes fxScanDrift {
        from { transform: translateY(-10%); }
        to { transform: translateY(10%); }
      }

      @keyframes fxNoiseShift {
        0% { transform: translate3d(0, 0, 0); }
        50% { transform: translate3d(-0.25%, 0.25%, 0); }
        100% { transform: translate3d(0.25%, -0.2%, 0); }
      }

      @keyframes fxReflectionSweep {
        0%, 12%, 100% { transform: translateX(-55%) rotate(1deg); }
        50% { transform: translateX(48%) rotate(1deg); }
      }

      @keyframes fxGlitchPulse {
        0% {
          transform: translate(0, 0);
          text-shadow: none;
          filter: none;
        }
        35% {
          transform: translate(-1px, 0);
          text-shadow: 1px 0 rgba(255, 80, 80, 0.25);
          filter: saturate(1.08);
        }
        70% {
          transform: translate(1px, 0);
          text-shadow: -1px 0 rgba(255, 80, 80, 0.25);
        }
        100% {
          transform: translate(0, 0);
          text-shadow: none;
          filter: none;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .fx-scan,
        .fx-noise,
        .fx-reflection,
        .fx-glitch {
          animation: none !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function ensureLayer() {
    if (document.getElementById(EFFECT_LAYER_ID)) return;

    const layer = document.createElement('div');
    layer.id = EFFECT_LAYER_ID;
    layer.className = 'effect-layer';
    layer.setAttribute('aria-hidden', 'true');

    const scan = document.createElement('i');
    scan.className = 'fx-scan';
    const noise = document.createElement('i');
    noise.className = 'fx-noise';
    const reflection = document.createElement('i');
    reflection.className = 'fx-reflection';
    const interference = document.createElement('i');
    interference.className = 'fx-interference';

    layer.appendChild(scan);
    layer.appendChild(noise);
    layer.appendChild(reflection);
    layer.appendChild(interference);
    document.body.appendChild(layer);
  }

  function applyBaseClasses() {
    document.body.classList.add('fx-active');

    document.querySelectorAll('.console-screen, .system-header, .hud-panel').forEach((node) => {
      node.classList.add('fx-glow');
    });

    document.querySelectorAll(hoverSelectors.join(', ')).forEach((node) => {
      node.classList.add('hover-futuristic', 'fx-cinematic');
    });
  }

  function scheduleGlitchBursts() {
    if (REDUCED_MOTION) return;

    function triggerOne() {
      const nodes = document.querySelectorAll(glitchSelectors.join(', '));
      if (!nodes.length) return;
      const node = nodes[Math.floor(Math.random() * nodes.length)];
      node.classList.add('fx-glitch');
      setTimeout(() => node.classList.remove('fx-glitch'), 220);
    }

    function loop() {
      const nextMs = 7000 + Math.random() * 10000;
      setTimeout(() => {
        triggerOne();
        if (Math.random() > 0.75) {
          setTimeout(triggerOne, 120 + Math.random() * 180);
        }
        loop();
      }, nextMs);
    }

    loop();
  }

  function scheduleInterference() {
    if (REDUCED_MOTION) return;

    const node = document.querySelector('.fx-interference');
    if (!node) return;

    function burst() {
      node.classList.add('is-on');
      setTimeout(() => node.classList.remove('is-on'), 90 + Math.random() * 140);
    }

    function loop() {
      const nextMs = 9000 + Math.random() * 15000;
      setTimeout(() => {
        burst();
        if (Math.random() > 0.82) {
          setTimeout(burst, 120);
        }
        loop();
      }, nextMs);
    }

    loop();
  }

  function setupCinematicHover() {
    if (REDUCED_MOTION || window.matchMedia('(hover: none)').matches) return;

    let rafId = 0;

    const elements = document.querySelectorAll('.fx-cinematic');
    elements.forEach((element) => {
      let entered = false;

      element.addEventListener('pointermove', (event) => {
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const rx = (0.5 - y) * 2;
          const ry = (x - 0.5) * 2;
          element.style.transform = `perspective(700px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(0)`;
        });
      }, { passive: true });

      element.addEventListener('pointerenter', () => {
        entered = true;
      }, { passive: true });

      element.addEventListener('pointerleave', () => {
        entered = false;
        element.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg) translateZ(0)';
      }, { passive: true });

      element.addEventListener('blur', () => {
        if (!entered) {
          element.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg) translateZ(0)';
        }
      });
    });
  }

  function handleBootRestart() {
    const overlay = document.getElementById('startup-overlay');
    if (!overlay) return;

    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    const fill = overlay.querySelector('.progress-fill');
    const percentEl = document.getElementById('boot-percent');
    if (fill) fill.style.width = '0%';
    if (percentEl) percentEl.textContent = '0%';

    setTimeout(() => {
      window.dispatchEvent(new Event('boot:restart-complete'));
    }, 50);
  }

  function initEffects() {
    ensureStyles();
    ensureLayer();
    applyBaseClasses();
    scheduleGlitchBursts();
    scheduleInterference();
    setupCinematicHover();

    const output = document.getElementById('terminal-output');
    if (output) output.classList.add('is-ready');
  }

  document.addEventListener('DOMContentLoaded', initEffects);

  window.addEventListener('boot:complete', () => {
    const output = document.getElementById('terminal-output');
    if (output) output.classList.add('is-ready');
  });

  window.addEventListener('boot:restart', handleBootRestart);
})();
