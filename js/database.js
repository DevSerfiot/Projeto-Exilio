/* Database module for classified records */
(function () {
  const STATUS_ORDER = ['ativo', 'criptografado', 'oculto', 'bloqueado', 'corrompido'];

  const STATUS_META = {
    ativo: { label: 'ATIVO', className: 'is-active', contentLabel: 'Conteúdo' },
    criptografado: { label: 'CRIPTOGRAFADO', className: 'is-encrypted', contentLabel: 'Conteúdo protegido' },
    oculto: { label: 'OCULTO', className: 'is-hidden', contentLabel: 'Conteúdo oculto' },
    bloqueado: { label: 'BLOQUEADO', className: 'is-blocked', contentLabel: 'Conteúdo bloqueado' },
    corrompido: { label: 'CORROMPIDO', className: 'is-corrupted', contentLabel: 'Conteúdo corrompido' }
  };

  let cachedRecords = null;
  let cachedSource = null;
  let styleInjected = false;

  function normalizeText(value) {
    return String(value == null ? '' : value).trim();
  }

  function normalizeStatus(value) {
    const text = normalizeText(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    if (text.includes('corromp')) return 'corrompido';
    if (text.includes('ocult')) return 'oculto';
    if (text.includes('bloque')) return 'bloqueado';
    if (text.includes('criptograf') || text.includes('encrypted')) return 'criptografado';
    return 'ativo';
  }

  function normalizeRecords(source) {
    const list = Array.isArray(source) ? source : (source && Array.isArray(source.records) ? source.records : (source && Array.isArray(source.entries) ? source.entries : []));

    return list.map((record, index) => {
      const normalizedStatus = normalizeStatus(record.status);
      const registro = normalizeText(record.registro || record.id || `REG-${String(index + 1).padStart(3, '0')}`);

      return {
        registro,
        autor: normalizeText(record.autor || record.author || 'Desconhecido'),
        data: normalizeText(record.data || record.date || ''),
        nivelAcesso: normalizeText(record.nivelAcesso || record.nivel || record.accessLevel || '0'),
        status: normalizedStatus,
        conteudo: normalizeText(record.conteudo || record.content || ''),
        source: record
      };
    }).sort((a, b) => a.registro.localeCompare(b.registro, 'pt-BR'));
  }

  async function loadSource() {
    if (cachedSource) {
      return cachedSource;
    }

    if (!window.ExilioApp || typeof window.ExilioApp.filesystem?.loadData !== 'function') {
      return null;
    }

    cachedSource = await window.ExilioApp.filesystem.loadData('database');
    return cachedSource;
  }

  async function loadRecords(forceReload = false) {
    if (!forceReload && cachedRecords) {
      return cachedRecords;
    }

    const source = forceReload ? await window.ExilioApp.filesystem.loadData('database') : await loadSource();
    if (!source) {
      cachedRecords = null;
      return null;
    }

    cachedSource = source;
    cachedRecords = normalizeRecords(source);
    return cachedRecords;
  }

  function getStatusMeta(status) {
    return STATUS_META[normalizeStatus(status)] || STATUS_META.ativo;
  }

  function getMaskedContent(record) {
    const meta = getStatusMeta(record.status);

    if (record.status === 'corrompido') {
      return '<<DADOS CORROMPIDOS>>';
    }

    if (record.status === 'oculto') {
      return '<<REGISTRO OCULTO>>';
    }

    if (record.status === 'bloqueado') {
      return '<<ACESSO BLOQUEADO>>';
    }

    if (record.status === 'criptografado') {
      return '<<CONTEÚDO CRIPTOGRAFADO>>';
    }

    return record.conteudo || meta.contentLabel;
  }

  function getClassifiedRecords(records) {
    const groups = STATUS_ORDER.reduce((acc, status) => {
      acc[status] = [];
      return acc;
    }, {});

    (records || []).forEach((record) => {
      const status = STATUS_ORDER.includes(record.status) ? record.status : 'ativo';
      groups[status].push(record);
    });

    return groups;
  }

  function getStatusSummary(records) {
    return STATUS_ORDER.map((status) => ({
      status,
      label: STATUS_META[status].label,
      count: (records || []).filter((record) => record.status === status).length
    }));
  }

  function formatRecordLines(records) {
    const lines = [];

    (records || []).forEach((record, index) => {
      const meta = getStatusMeta(record.status);
      lines.push({ text: `Registro: ${record.registro}`, className: `console-line database-line ${meta.className}` });
      lines.push({ text: `Autor: ${record.autor}`, className: 'console-line database-line' });
      lines.push({ text: `Data: ${record.data || '-'}`, className: 'console-line database-line' });
      lines.push({ text: `Nível de acesso: ${record.nivelAcesso || '-'}`, className: 'console-line database-line' });
      lines.push({ text: `Status: ${meta.label}`, className: `console-line database-line ${meta.className}` });
      lines.push({ text: `${meta.contentLabel}: ${getMaskedContent(record)}`, className: `console-line database-line ${meta.className}` });

      if (index < records.length - 1) {
        lines.push({ text: ' ', className: 'console-line database-separator', instant: true });
      }
    });

    return lines;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function injectStyles() {
    if (styleInjected || document.getElementById('database-module-style')) {
      styleInjected = true;
      return;
    }

    const style = document.createElement('style');
    style.id = 'database-module-style';
    style.textContent = `
      .classified-db {
        display: grid;
        gap: 16px;
      }

      .classified-db__header {
        display: grid;
        gap: 8px;
      }

      .classified-db__eyebrow {
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        font-size: 0.72rem;
        color: rgba(255, 220, 220, 0.78);
      }

      .classified-db__title {
        margin: 0;
        font-size: 1.45rem;
        letter-spacing: 0.06em;
      }

      .classified-db__summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 10px;
      }

      .classified-db__summary-card {
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 10px 12px;
        background: rgba(10, 10, 10, 0.55);
      }

      .classified-db__summary-label {
        display: block;
        font-size: 0.72rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: rgba(220, 220, 220, 0.7);
      }

      .classified-db__summary-value {
        display: block;
        margin-top: 6px;
        font-size: 1.2rem;
        font-weight: 700;
      }

      .classified-db__records {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 12px;
      }

      .classified-db__record {
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        padding: 14px;
        background: linear-gradient(180deg, rgba(16, 16, 16, 0.92), rgba(9, 9, 9, 0.95));
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);
      }

      .classified-db__record header {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: baseline;
        margin-bottom: 10px;
      }

      .classified-db__record-id {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.98rem;
        letter-spacing: 0.08em;
      }

      .classified-db__record-status {
        font-size: 0.68rem;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: rgba(255, 255, 255, 0.72);
      }

      .classified-db__record dl {
        margin: 0;
        display: grid;
        gap: 8px;
      }

      .classified-db__record dl div {
        display: grid;
        gap: 4px;
      }

      .classified-db__record dt {
        font-size: 0.68rem;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: rgba(220, 220, 220, 0.66);
      }

      .classified-db__record dd {
        margin: 0;
        line-height: 1.45;
        color: rgba(245, 245, 245, 0.95);
        word-break: break-word;
      }

      .classified-db__record.is-corrupted {
        border-color: rgba(255, 92, 92, 0.35);
      }

      .classified-db__record.is-blocked {
        border-color: rgba(255, 193, 92, 0.35);
      }

      .classified-db__record.is-hidden {
        border-color: rgba(140, 140, 255, 0.35);
      }

      .classified-db__record.is-encrypted {
        border-color: rgba(86, 199, 255, 0.35);
      }

      .classified-db__record.is-active {
        border-color: rgba(103, 255, 137, 0.26);
      }

      .database-line.is-corrupted,
      .database-line.is-blocked,
      .database-line.is-hidden,
      .database-line.is-encrypted {
        color: rgba(255, 216, 216, 0.92);
      }

      .database-separator {
        opacity: 0.35;
      }
    `;

    document.head.appendChild(style);
    styleInjected = true;
  }

  function renderDatabaseView(records) {
    injectStyles();

    const view = document.getElementById('page-view');
    if (!view) {
      return;
    }

    const summary = getStatusSummary(records)
      .map((item) => `
        <article class="classified-db__summary-card">
          <span class="classified-db__summary-label">${escapeHtml(item.label)}</span>
          <strong class="classified-db__summary-value">${item.count}</strong>
        </article>
      `)
      .join('');

    const recordsMarkup = records.map((record) => {
      const meta = getStatusMeta(record.status);
      const content = getMaskedContent(record);

      return `
        <article class="classified-db__record ${meta.className}">
          <header>
            <strong class="classified-db__record-id">${escapeHtml(record.registro)}</strong>
            <span class="classified-db__record-status">${escapeHtml(meta.label)}</span>
          </header>
          <dl>
            <div>
              <dt>Autor</dt>
              <dd>${escapeHtml(record.autor)}</dd>
            </div>
            <div>
              <dt>Data</dt>
              <dd>${escapeHtml(record.data || '-')}</dd>
            </div>
            <div>
              <dt>Nível de acesso</dt>
              <dd>${escapeHtml(record.nivelAcesso || '-')}</dd>
            </div>
            <div>
              <dt>${escapeHtml(meta.contentLabel)}</dt>
              <dd>${escapeHtml(content)}</dd>
            </div>
          </dl>
        </article>
      `;
    }).join('');

    view.innerHTML = `
      <section class="classified-db">
        <div class="classified-db__header">
          <p class="classified-db__eyebrow">Base de dados / registros classificados</p>
          <h2 class="classified-db__title">Banco de Registros</h2>
          <p>Formato: Registro, Autor, Data, Nível de acesso, Status e Conteúdo. Alguns itens permanecem ocultos por protocolo.</p>
        </div>
        <div class="classified-db__summary">${summary}</div>
        <div class="classified-db__records">${recordsMarkup}</div>
      </section>
    `;
  }

  async function openDatabaseView() {
    const records = await loadRecords();
    if (!records || !records.length) {
      return [
        { text: 'Base de dados indisponível.', className: 'console-line alert-message' }
      ];
    }

    renderDatabaseView(records);

    const classified = getClassifiedRecords(records);
    const summary = getStatusSummary(records)
      .map((item) => `${item.label}: ${item.count}`)
      .join(' | ');

    return [
      { text: `Base carregada com ${records.length} registros.`, className: 'console-line status-line' },
      { text: summary, className: 'console-line status-line' },
      { text: 'Detalhes dos registros:', className: 'console-line status-line' },
      ...formatRecordLines(records),
      { text: `Classificações ativas: ${Object.keys(classified).length}`, className: 'console-line status-line' }
    ];
  }

  async function getConfig() {
    return loadSource();
  }

  window.ExilioApp = window.ExilioApp || {};
  window.ExilioApp.database = {
    getConfig,
    loadRecords,
    getClassifiedRecords,
    getStatusSummary,
    formatRecordLines,
    renderDatabaseView,
    openDatabaseView
  };
})();
