/* Visual effects and boot restart handling */
(function () {
  function applyStartupEffects() {
    const output = document.getElementById('terminal-output');
    if (output) {
      output.classList.add('is-ready');
    }
  }

  function createParticles() {
    const layer = document.getElementById('particle-layer');
    if (!layer) return;

    layer.innerHTML = '';
    const count = window.innerWidth < 768 ? 16 : 24;

    for (let i = 0; i < count; i += 1) {
      const particle = document.createElement('span');
      particle.className = 'particle';
      const size = 2 + Math.random() * 3;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.setProperty('--particle-delay', `${Math.random() * 6}s`);
      particle.style.setProperty('--particle-duration', `${10 + Math.random() * 8}s`);
      particle.style.setProperty('--particle-x', `${(Math.random() - 0.5) * 120}px`);
      particle.style.setProperty('--particle-y', `${(Math.random() - 0.5) * 90}px`);
      layer.appendChild(particle);
    }
  }

  function enhanceInteractiveEffects() {
    document.querySelectorAll('.hud-card, .terminal-action, .status-pill, .page-view, .control').forEach((element) => {
      element.classList.add('hover-futuristic');
    });

    document.querySelectorAll('.console-header h1, .brand-name, .startup-brand, .hud-panel__eyebrow').forEach((element) => {
      element.classList.add('glitch-text');
    });

    document.querySelectorAll('.status-pill.status-online, .startup-status').forEach((element) => {
      element.classList.add('alert-blink');
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

  document.addEventListener('DOMContentLoaded', () => {
    applyStartupEffects();
    enhanceInteractiveEffects();
    createParticles();
  });

  window.addEventListener('resize', createParticles);

  window.addEventListener('boot:complete', () => {
    applyStartupEffects();
  });

  window.addEventListener('boot:restart', handleBootRestart);
})();
