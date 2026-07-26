/* Timeline module and smooth animated rendering */
(function () {
  const DEFAULT_TIMELINE_EVENTS = [
    { year: '2051', title: 'Projeto iniciado' },
    { year: '2054', title: 'Primeira missão' },
    { year: '2057', title: 'Falha do reator' },
    { year: '2061', title: 'Evacuação' },
    { year: '2064', title: 'Silêncio' },
    { year: '2070', title: 'Reconexão' }
  ];

  function normalizeEvent(event) {
    return {
      year: String(event && event.year ? event.year : '').trim(),
      title: String(event && event.title ? event.title : '').trim()
    };
  }

  async function loadTimelineEvents() {
    const loader = window.ExilioApp && window.ExilioApp.filesystem && typeof window.ExilioApp.filesystem.loadData === 'function'
      ? window.ExilioApp.filesystem.loadData
      : null;

    if (!loader) {
      return DEFAULT_TIMELINE_EVENTS.slice();
    }

    const timelineData = await loader('timeline');
    const loadedEvents = timelineData && Array.isArray(timelineData.events)
      ? timelineData.events.map(normalizeEvent).filter((event) => event.year && event.title)
      : [];

    if (!loadedEvents.length) {
      return DEFAULT_TIMELINE_EVENTS.slice();
    }

    return loadedEvents;
  }

  function createTimelineItem(event, index, total) {
    const item = document.createElement('li');
    item.className = 'timeline-item';
    item.style.setProperty('--item-index', String(index));

    const year = document.createElement('span');
    year.className = 'timeline-year';
    year.textContent = event.year;

    const title = document.createElement('p');
    title.className = 'timeline-title';
    title.textContent = event.title;

    item.append(year, title);

    if (index < total - 1) {
      const connector = document.createElement('span');
      connector.className = 'timeline-connector';
      connector.textContent = '↓';
      item.appendChild(connector);
    }

    return item;
  }

  function animateTimelineItems(container) {
    const items = container.querySelectorAll('.timeline-item');
    items.forEach((item, index) => {
      window.setTimeout(() => {
        item.classList.add('timeline-item--visible');
      }, 110 * index);
    });
  }

  async function renderTimelinePage() {
    const view = document.getElementById('page-view');
    if (!view) {
      return;
    }

    const events = await loadTimelineEvents();
    const timelineItems = events.map((event, index) => createTimelineItem(event, index, events.length));

    view.innerHTML = '';

    const title = document.createElement('h2');
    title.textContent = 'Linha do tempo';

    const subtitle = document.createElement('p');
    subtitle.textContent = 'Marcos críticos da operação Exílio.';

    const list = document.createElement('ol');
    list.className = 'timeline-list';
    timelineItems.forEach((item) => list.appendChild(item));

    view.append(title, subtitle, list);
    view.classList.add('timeline-view');

    requestAnimationFrame(() => {
      animateTimelineItems(list);
    });
  }

  async function getTerminalTimelineLines() {
    const events = await loadTimelineEvents();
    const lines = [{ text: 'Linha do tempo carregada:', className: 'console-line status-line' }];

    events.forEach((event, index) => {
      lines.push({ text: `${event.year}  ${event.title}`, className: 'console-line' });
      if (index < events.length - 1) {
        lines.push({ text: '↓', className: 'console-line status-line' });
      }
    });

    return lines;
  }

  function patchTimelineCommand() {
    if (!window.ExilioApp || typeof window.ExilioApp.executeCommand !== 'function') {
      return false;
    }

    if (window.ExilioApp.timeline && window.ExilioApp.timeline.patched) {
      return true;
    }

    const originalExecuteCommand = window.ExilioApp.executeCommand;

    window.ExilioApp.executeCommand = async function executeTimelineAware(rawCommand) {
      const normalizedCommand = String(rawCommand || '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (normalizedCommand !== 'timeline') {
        return originalExecuteCommand.call(this, rawCommand);
      }

      await renderTimelinePage();
      const lines = await getTerminalTimelineLines();

      if (window.ExilioApp && typeof window.ExilioApp.playSound === 'function') {
        window.ExilioApp.playSound('alert');
      }

      if (window.ExilioApp && typeof window.ExilioApp.typeTerminalLines === 'function') {
        return window.ExilioApp.typeTerminalLines(lines);
      }

      return null;
    };

    window.ExilioApp.timeline = window.ExilioApp.timeline || {};
    window.ExilioApp.timeline.patched = true;
    window.ExilioApp.timeline.renderPage = renderTimelinePage;
    window.ExilioApp.timeline.getLines = getTerminalTimelineLines;
    return true;
  }

  function initTimelineModule() {
    if (patchTimelineCommand()) {
      return;
    }

    let attempts = 0;
    const maxAttempts = 20;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (patchTimelineCommand() || attempts >= maxAttempts) {
        window.clearInterval(timer);
      }
    }, 120);
  }

  document.addEventListener('DOMContentLoaded', initTimelineModule);
})();
