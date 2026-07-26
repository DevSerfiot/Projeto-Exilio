/* Clock widget */
(function () {
  let rafId = 0;
  let lastSecond = -1;

  function updateClock() {
    const now = new Date();
    if (now.getSeconds() === lastSecond) {
      return;
    }
    lastSecond = now.getSeconds();

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const timeValue = `${hours}:${minutes}:${seconds}`;
    const dateValue = `${String(now.getDate()).padStart(2, '0')} ${now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()} ${now.getFullYear()}`;

    const clockElement = document.getElementById('hora');
    if (clockElement) {
      clockElement.textContent = timeValue;
    }

    const systemTimeElement = document.getElementById('system-time');
    if (systemTimeElement) {
      systemTimeElement.textContent = timeValue;
    }

    const systemDateElement = document.getElementById('system-date');
    if (systemDateElement) {
      systemDateElement.textContent = dateValue;
    }
  }

  function tick() {
    if (!document.hidden) {
      updateClock();
    }

    rafId = window.requestAnimationFrame(tick);
  }

  function startClock() {
    if (rafId) return;
    updateClock();
    rafId = window.requestAnimationFrame(tick);
  }

  function stopClock() {
    if (!rafId) return;
    window.cancelAnimationFrame(rafId);
    rafId = 0;
  }

  document.addEventListener('DOMContentLoaded', () => {
    startClock();
  });

  window.addEventListener('beforeunload', stopClock);
})();
