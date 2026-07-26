/* Terminal command pages and command handler */
(function () {
  const terminalPages = {
    help: {
      title: 'Lista de comandos disponíveis',
      description: 'Use qualquer um destes comandos para navegar pelo projeto.',
      items: [
        'help — Lista de comandos disponíveis',
        'about — História do Projeto Exílio',
        'logs — Registros encontrados',
        'reg-001 — Registro de inicialização',
        'reg-014 — Registro de comunicação',
        'reg-032 — Registro de rastreamento',
        'reg-089 — Registro de contingência',
        'reg-114 — Registro de navegação',
        'reg-198 — Registro de transmissão',
        'team — Equipe',
        'download <senha> — Baixar o modpack',
        'discord — Link do Discord',
        'social — Redes sociais',
        'status — Estado do sistema',
        'online — Status da conexão',
        'archive — Arquivo de registros',
        'timeline — Linha do tempo do projeto',
        'protocol — Protocolo de segurança',
        'credits — Créditos',
        'clear — Limpa o terminal',
        'reboot — Reinicia o sistema',
        'exit — Encerra a sessão',
        'start — Reinicia a animação de boot',
        'play trailer — Reproduz o trailer'
      ]
    },
    about: {
      title: 'História do Projeto Exílio',
      description: 'O Projeto Exílio é uma experiência narrativa em formato terminal, com foco em sobrevivência, mistério e atmosfera.',
      items: [
        'O projeto nasceu como uma homenagem ao estilo de terminal retro.',
        'Cada comando revela uma nova camada da história e da identidade visual.',
        'A proposta é unir estética, immersion e interação simples.'
      ]
    },
    logs: {
      title: 'Registros encontrados',
      description: 'Os principais registros revelam sinais de atividade antiga, falhas de comunicação e presença de estruturas ocultas.',
      items: [
        'Registro 01 — Transmissão interrompida.',
        'Registro 02 — Sinais de presença anômala.',
        'Registro 03 — Mapa parcial do setor sul.'
      ]
    },
    'reg-001': {
      title: 'Registro REG-001',
      description: 'Registro de inicialização do sistema confirmando a ativação da sequência de boot.',
      items: [
        'Boot detectado: sucesso.',
        'Módulo de interface: online.',
        'Transmissão de contingência: aguardando sincronização.'
      ]
    },
    'reg-014': {
      title: 'Registro REG-014',
      description: 'Registro de comunicação com o núcleo local e sinais de verificação parcial.',
      items: [
        'Canal primário: estável.',
        'Sinal secundário: intermitente.',
        'Último pacote recebido: 14/07/2026.'
      ]
    },
    'reg-032': {
      title: 'Registro REG-032',
      description: 'Registro de rastreamento associado ao setor de navegação externa.',
      items: [
        'Ponto de referência: localizado.',
        'Trajetória parcial: preservada.',
        'Anomalia de posicionamento: não confirmada.'
      ]
    },
    'reg-089': {
      title: 'Registro REG-089',
      description: 'Registro de contingência capturado durante uma falha de sincronização.',
      items: [
        'Falha de sincronização: detectada.',
        'Módulo de backup: ativo.',
        'Estado geral: operante.'
      ]
    },
    'reg-114': {
      title: 'Registro REG-114',
      description: 'Registro de navegação com evidências de atividade recente em rotas internas.',
      items: [
        'Rota interna: reaberta.',
        'Sinal de presença: confirmado.',
        'Nível de risco: moderado.'
      ]
    },
    'reg-198': {
      title: 'Registro REG-198',
      description: 'Registro de transmissão contendo metadados de emergência e contexto de isolamento.',
      items: [
        'Transmissão: recebida com ruído.',
        'Origem: canal de backup.',
        'Contexto: isolamento parcial do ambiente.'
      ]
    },
    team: {
      title: 'Equipe',
      description: 'A equipe por trás do Projeto Exílio reúne designers, desenvolvedores e narradores.',
      items: [
        'Direção criativa — Frost',
        'Desenvolvimento — Alsyen',
        'Design visual — Frost',
        'Roteiro — Alsyen'
      ]
    },
    download: {
      title: 'Baixar o modpack',
      description: 'O acesso ao download exige autenticação por senha.',
      items: [
        'Digite download <senha> para autorizar o acesso.',
        'Protegido por senha para evitar downloads não autorizados.',
        'O modpack está disponível pela página oficial após autenticação.'
      ]
    },
    discord: {
      title: 'Link do Discord',
      description: 'Entre no servidor para acompanhar atualizações, eventos e conversas da comunidade.',
      links: [
        { label: 'Discord', url: 'https://discord.gg/WfSZdEzvX' }
      ],
      items: [
        'Servidor oficial: discord.gg/exilio',
        'Acesso liberado para membros e visitantes.'
      ]
    },
    social: {
      title: 'Redes sociais',
      description: 'Siga o projeto nas redes para ver novidades e bastidores.',
      links: [
        { label: 'TikTok', url: 'https://www.tiktok.com/@projetoexilio_ofc?lang=pt' },
        { label: 'YouTube', url: 'https://www.youtube.com/@Projetoexilio' },
        { label: 'X / Twitter', url: 'https://x.com/ProjetoExilio' }
      ],
      items: [
        'Instagram — @projetoexilio',
        'X — @projetoexilio',
        'YouTube — Projeto Exílio'
      ]
    },
    status: {
      title: 'Status do sistema',
      description: 'O ambiente está operacional e pronto para navegação.',
      items: [
        'Conexão: estável',
        'Nível de atividade: alto',
        'Última sincronização: 19/07/2026'
      ]
    },
    online: {
      title: 'Estado de conexão',
      description: 'Os nós de comunicação permanecem ativos e online.',
      items: [
        'Rede local: ativa',
        'Servidor remoto: disponível',
        'Transmissão contínua: habilitada'
      ]
    },
    archive: {
      title: 'Arquivo de registros',
      description: 'O acervo reúne entradas anteriores do projeto e dados de emergência.',
      items: [
        'Registro 04 — Canal de comunicação preservado.',
        'Registro 05 — Mapa parcial da rota sul.',
        'Registro 06 — Log de contingência sincronizado.'
      ]
    },
    timeline: {
      title: 'Linha do tempo',
      description: 'A evolução do projeto segue em etapas de descoberta e expansão.',
      items: [
        '2024 — Primeiros protótipos narrativos.',
        '2025 — Estrutura terminal e estética consolidada.',
        '2026 — Expansão para conteúdo interativo e comunidade.'
      ]
    },
    protocol: {
      title: 'Protocolo de segurança',
      description: 'As rotinas de segurança foram revisadas para manter o sistema estável.',
      items: [
        'Autenticação local: ativa',
        'Monitoramento remoto: habilitado',
        'Contingência de emergência: disponível'
      ]
    },
    credits: {
      title: 'Créditos',
      description: 'O projeto é fruto de uma colaboração entre criação, desenvolvimento e narrativa.',
      items: [
        'Direção criativa — Frost + Alsyen',
        'Programação — Alsyen',
        'Design — Frost + Alsyen',
        'Roteiro — Alsyen + Frost',
        'Agradecimentos especiais — Comunidade e apoiadores'
      ]
    },
    map: {
      title: 'Mapa',
      description: 'Visão das rotas e coordenadas disponíveis para a missão.',
      items: [
        'Setor alfa — Coordenadas 02.17.45',
        'Setor beta — Coordenadas 14.03.12',
        'Ponto de encontro — Coordenadas 08.08.08'
      ]
    },
    'status-global': {
      title: 'Status Global',
      description: 'Visor de métricas e alertas globais do sistema.',
      items: [
        'Operação geral — ESTÁVEL',
        'Rede — ONLINE',
        'Integridade de núcleo — 94%',
        'Ameaça atual — 7%'
      ]
    },
    start: {
      title: 'Animação de boot',
      description: 'A sequência de inicialização foi reiniciada e a tela de boot foi reativada.',
      items: [
        'A animação de abertura está pronta para rodar.',
        'O sistema retornou ao estado inicial.'
      ]
    },
    reboot: {
      title: 'Reinicialização',
      description: 'O sistema será reiniciado e a sequência de boot voltará a rodar.',
      items: [
        'A interface será reestabelecida.',
        'Os módulos serão carregados novamente.'
      ]
    },
    exit: {
      title: 'Sessão encerrada',
      description: 'A sessão do terminal foi encerrada com segurança.',
      items: [
        'Acesso local finalizado.',
        'Você pode reabrir o terminal quando quiser.'
      ]
    },
    'play trailer': {
      title: 'Trailer',
      description: 'O trailer foi preparado para reprodução na próxima atualização.',
      items: [
        'O vídeo será exibido em uma seção dedicada.',
        'A experiência de narrativa continua em desenvolvimento.'
      ]
    }
  };

  const DOWNLOAD_PASSWORD_SECRET = 'NDg5OQ==';

  function isValidDownloadPassword(value) {
    try {
      return btoa(String(value).split('').reverse().join('')) === DOWNLOAD_PASSWORD_SECRET;
    } catch (error) {
      return false;
    }
  }

  const APP_LOGIN_CREDENTIALS = {
    user: 'root',
    pass: 'Exilio#42'
  };

  const TAB_ACCESS = {
    Terminal: 'help',
    Registros: 'logs',
    Sistema: 'status',
    Protocolos: 'protocol',
    Arquivos: 'archive',
    Mapa: 'map',
    Equipe: 'team',
    Créditos: 'credits',
    'Status Global': 'status-global'
  };

  const appState = {
    activeTab: 'Terminal',
    pendingTab: null,
    authenticated: false
  };

  function setActiveNavItem(label) {
    document.querySelectorAll('.main-nav li').forEach((item) => {
      item.classList.toggle('active', item.textContent.trim() === label);
    });
  }

  function openLoginOverlay(tabLabel) {
    const overlay = document.getElementById('login-overlay');
    const loginUser = document.getElementById('login-user');
    const loginPass = document.getElementById('login-pass');
    if (!overlay || !loginUser || !loginPass) return;

    appState.pendingTab = tabLabel;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    loginUser.value = '';
    loginPass.value = '';
    loginUser.focus();
  }

  function closeLoginOverlay() {
    const overlay = document.getElementById('login-overlay');
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    appState.pendingTab = null;
  }

  function handleNavClick(event) {
    const label = event.currentTarget.textContent.trim();
    if (label === 'Terminal') {
      setActiveNavItem(label);
      renderTerminalPage('help');
      appState.activeTab = label;
      return;
    }

    if (!appState.authenticated) {
      openLoginOverlay(label);
      return;
    }

    const page = TAB_ACCESS[label] || 'help';
    setActiveNavItem(label);
    renderTerminalPage(page);
    appState.activeTab = label;
  }

  function setupNavigation() {
    document.querySelectorAll('.main-nav li').forEach((item) => {
      item.addEventListener('click', handleNavClick);
    });
  }

  function handleLoginSubmit(event) {
    event.preventDefault();
    const userInput = document.getElementById('login-user');
    const passInput = document.getElementById('login-pass');
    if (!userInput || !passInput) return;

    const providedUser = userInput.value.trim();
    const providedPass = passInput.value;

    if (providedUser === APP_LOGIN_CREDENTIALS.user && providedPass === APP_LOGIN_CREDENTIALS.pass) {
      appState.authenticated = true;
      closeLoginOverlay();
      if (appState.pendingTab) {
        const page = TAB_ACCESS[appState.pendingTab] || 'help';
        setActiveNavItem(appState.pendingTab);
        renderTerminalPage(page);
        appState.activeTab = appState.pendingTab;
        appState.pendingTab = null;
      }
      return;
    }

    const output = document.getElementById('terminal-output');
    if (output) {
      output.innerHTML = '';
      window.ExilioApp.typeTerminalLines([`Falha de autenticação. Usuário ou senha incorretos.`]);
    }
  }

  function setupLoginOverlay() {
    const loginForm = document.getElementById('login-form');
    const cancelButton = document.getElementById('login-cancel');

    if (loginForm) {
      loginForm.addEventListener('submit', handleLoginSubmit);
    }

    if (cancelButton) {
      cancelButton.addEventListener('click', closeLoginOverlay);
    }
  }

  function setupQuickCommandButtons() {
    document.querySelectorAll('.quick-commands button').forEach((button) => {
      button.addEventListener('click', () => {
        const command = button.textContent.trim().toLowerCase();
        if (window.ExilioApp && typeof window.ExilioApp.executeCommand === 'function') {
          window.ExilioApp.executeCommand(command);
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupQuickCommandButtons();
    setupNavigation();
    setupLoginOverlay();
  });

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderTerminalPage(command) {
    const view = document.getElementById('page-view');
    if (!view) return;

    const page = terminalPages[command] || terminalPages.help;
    const itemsMarkup = (page.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const linksMarkup = (page.links || []).map((link) => `
      <a class="social-link" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
        <span class="social-link__label">${escapeHtml(link.label)}</span>
        <span class="social-link__url">${escapeHtml(link.url)}</span>
      </a>
    `).join('');

    view.innerHTML = `
      <h2>${escapeHtml(page.title)}</h2>
      <p>${escapeHtml(page.description)}</p>
      ${page.links ? `<div class="social-links">${linksMarkup}</div>` : ''}
      ${page.items ? `<ul>${itemsMarkup}</ul>` : ''}
    `;
  }

  function executeCommand(rawCommand) {
    const command = rawCommand.trim().toLowerCase();
    if (!command) return;

    const output = document.getElementById('terminal-output');
    if (!output) return;

    const lines = [rawCommand];

    if (command === 'clear') {
      output.innerHTML = '';
      renderTerminalPage('help');
      lines.push('Terminal limpo. Digite help para ver os comandos.');
      if (window.ExilioApp && typeof window.ExilioApp.playSound === 'function') {
        window.ExilioApp.playSound('confirmation');
      }
      window.ExilioApp.typeTerminalLines(lines);
      return;
    }

    if (command === 'reboot') {
      window.dispatchEvent(new Event('boot:restart'));
      renderTerminalPage(command);
      lines.push(`Página carregada: ${terminalPages[command].title}`);
      window.ExilioApp.typeTerminalLines(lines);
      return;
    }

    if (command === 'exit') {
      renderTerminalPage(command);
      lines.push('Sessão encerrada. O terminal pode ser reaberto quando necessário.');
      window.ExilioApp.typeTerminalLines(lines);
      return;
    }

    if (command === 'start') {
      window.dispatchEvent(new Event('boot:restart'));
      renderTerminalPage(command);
      lines.push(`Página carregada: ${terminalPages[command].title}`);
      window.ExilioApp.typeTerminalLines(lines);
      return;
    }

    if (command === 'download') {
      lines.push('Senha necessária. Use download <senha> para continuar.');
      lines.push('Acesso negado até que a senha correta seja informada.');
      renderTerminalPage('help');
      if (window.ExilioApp && typeof window.ExilioApp.playSound === 'function') {
        window.ExilioApp.playSound('error');
      }
      window.ExilioApp.typeTerminalLines(lines);
      return;
    }

    if (command.startsWith('download ')) {
      const [_, providedPassword] = command.split(/\s+/);
      if (!isValidDownloadPassword(providedPassword)) {
        lines.push('Senha incorreta. Acesso ao download bloqueado.');
        renderTerminalPage('help');
        if (window.ExilioApp && typeof window.ExilioApp.playSound === 'function') {
          window.ExilioApp.playSound('error');
        }
        window.ExilioApp.typeTerminalLines(lines);
        return;
      }

      renderTerminalPage('download');
      lines.push('Senha validada. Acesso ao download autorizado.');
      if (window.ExilioApp && typeof window.ExilioApp.playSound === 'function') {
        window.ExilioApp.playSound('alert');
      }
      window.ExilioApp.typeTerminalLines(lines);
      return;
    }

    if (!terminalPages[command]) {
      lines.push(`Comando não reconhecido: ${rawCommand}`);
      lines.push('Digite help para ver os comandos disponíveis.');
      renderTerminalPage('help');
      if (window.ExilioApp && typeof window.ExilioApp.playSound === 'function') {
        window.ExilioApp.playSound('error');
      }
      window.ExilioApp.typeTerminalLines(lines);
      return;
    }

    renderTerminalPage(command);
    lines.push(`Página carregada: ${terminalPages[command].title}`);
    if (window.ExilioApp && typeof window.ExilioApp.playSound === 'function') {
      window.ExilioApp.playSound('alert');
    }
    window.ExilioApp.typeTerminalLines(lines);
  }

  window.ExilioApp = window.ExilioApp || {};
  window.ExilioApp.executeCommand = executeCommand;
})();
