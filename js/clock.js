/* Clock widget */
(function () {
  function updateClock() {
    const now = new Date();
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

  document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    setInterval(updateClock, 1000);
  });
})();
