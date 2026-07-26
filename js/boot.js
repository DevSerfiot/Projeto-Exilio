/* Boot sequence and startup overlay */
(function () {
  let animationFrameId = null;
  let typingTimeoutId = null;
  let completionTimeoutId = null;

  function clearBootTimers() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    if (typingTimeoutId) {
      clearTimeout(typingTimeoutId);
      typingTimeoutId = null;
    }

    if (completionTimeoutId) {
      clearTimeout(completionTimeoutId);
      completionTimeoutId = null;
    }
  }

  function setShellVisibility(isReady) {
    const shell = document.getElementById('app-shell');
    if (!shell) return;

    shell.classList.toggle('is-ready', isReady);
  }

  function typeLineIntoOutput(output, text, callback) {
    const line = document.createElement('div');
    line.className = 'startup-line';
    output.appendChild(line);

    let index = 0;

    function stepChar() {
      if (index < text.length) {
        line.textContent += text.charAt(index);
        index += 1;
        typingTimeoutId = setTimeout(stepChar, 18 + Math.random() * 20);
      } else {
        line.classList.add('is-visible');
        if (typeof callback === 'function') {
          typingTimeoutId = setTimeout(callback, 140);
        }
      }
    }

    stepChar();
  }

  function startBootSequence(durationMs = 6500) {
    clearBootTimers();

    const overlay = document.getElementById('startup-overlay');
    const fill = overlay && overlay.querySelector('.progress-fill');
    const percentEl = document.getElementById('boot-percent');
    const output = document.getElementById('startup-output');

    if (!overlay || !fill || !percentEl || !output) return;

    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    setShellVisibility(false);
    output.innerHTML = '';
    fill.style.width = '0%';
    percentEl.textContent = '0%';

    const bootLines = [
      'Sistema Inicializando...',
      'Carregando módulos...',
      'Verificando Integridade...',
      'Conectando Banco de Dados...',
      'Recuperando Registros...',
      'Registro encontrado.',
      'Status da Superfície:',
      'HOSTIL',
      'População:',
      '0,03%',
      'Acesso Concedido.'
    ];

    let lineIndex = 0;
    const start = performance.now();

    function typeNextLine() {
      if (lineIndex >= bootLines.length) return;

      typeLineIntoOutput(output, bootLines[lineIndex], () => {
        lineIndex += 1;
        if (lineIndex < bootLines.length) {
          typeNextLine();
        }
      });
    }

    function step(now) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      const percent = Math.round(t * 100);

      fill.style.width = percent + '%';
      percentEl.textContent = percent + '%';

      if (t < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        completionTimeoutId = setTimeout(() => {
          overlay.classList.add('hidden');
          overlay.setAttribute('aria-hidden', 'true');
          setShellVisibility(true);
          const input = document.getElementById('terminal-input');
          if (input) input.focus();
          if (window.ExilioApp && typeof window.ExilioApp.playSound === 'function') {
            window.ExilioApp.playSound('system-started');
          }
          window.dispatchEvent(new CustomEvent('boot:complete'));
        }, 300);
      }
    }

    if (window.ExilioApp && typeof window.ExilioApp.playSound === 'function') {
      window.ExilioApp.playSound('boot');
    }

    typeNextLine();
    animationFrameId = requestAnimationFrame(step);
  }

  function initBoot() {
    setTimeout(() => startBootSequence(6500), 180);
  }

  document.addEventListener('DOMContentLoaded', initBoot);

  window.addEventListener('boot:restart', () => {
    startBootSequence(6500);
  });
})();
