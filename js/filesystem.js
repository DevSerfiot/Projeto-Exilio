/* File system data facade */
(function () {
  const DATA_PATHS = {
    logs: './data/logs.json',
    files: './data/files.json',
    commands: './data/commands.json',
    timeline: './data/timeline.json',
    database: './data/database.json'
  };

  const FILESYSTEM_DESCRIPTIONS = {
    ls: 'Lista arquivos e pastas do diretório atual',
    pwd: 'Mostra o caminho atual',
    cd: 'Navega entre diretórios',
    cat: 'Exibe o conteúdo de um arquivo',
    tree: 'Mostra a árvore de diretórios',
    find: 'Busca por nome de arquivo ou pasta',
    grep: 'Busca por texto dentro dos arquivos',
    mkdir: 'Cria um novo diretório',
    clear: 'Limpa o terminal',
    open: 'Abre um arquivo narrativo',
    help: 'Mostra ajuda dos comandos do filesystem'
  };

  const state = {
    tree: null,
    cwd: '/',
    loaded: false
  };

  async function loadData(key) {
    const url = DATA_PATHS[key];
    if (!url) {
      return null;
    }

    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Falha ao carregar ${key}`);
      }

      return response.json();
    } catch (error) {
      console.warn(`[filesystem] ${error.message}`);
      return null;
    }
  }

  async function loadAll() {
    const result = {};
    for (const key of Object.keys(DATA_PATHS)) {
      result[key] = await loadData(key);
    }
    return result;
  }

  function toContentString(content) {
    if (Array.isArray(content)) {
      return content.map((item) => String(item)).join('\n');
    }

    return String(content || '');
  }

  function normalizePath(path) {
    const raw = String(path || '/').replace(/\\+/g, '/');
    const parts = raw.split('/').filter(Boolean);
    const stack = [];

    parts.forEach((part) => {
      if (part === '.' || part === '') {
        return;
      }

      if (part === '..') {
        stack.pop();
        return;
      }

      stack.push(part);
    });

    return `/${stack.join('/')}`.replace(/\/+/g, '/');
  }

  function resolvePath(inputPath, basePath = state.cwd) {
    const raw = String(inputPath || '').trim();
    if (!raw || raw === '.') {
      return normalizePath(basePath);
    }

    if (raw.startsWith('/')) {
      return normalizePath(raw);
    }

    return normalizePath(`${basePath}/${raw}`);
  }

  async function ensureLoaded() {
    if (state.loaded && state.tree) {
      return true;
    }

    const fsData = await loadData('files');
    if (!fsData || !fsData.root || fsData.root.type !== 'dir') {
      return false;
    }

    state.tree = fsData.root;
    state.loaded = true;
    if (!state.cwd) {
      state.cwd = '/';
    }
    return true;
  }

  function getNodeByPath(absPath) {
    const path = normalizePath(absPath);
    if (!state.tree) {
      return null;
    }

    if (path === '/') {
      return state.tree;
    }

    const segments = path.split('/').filter(Boolean);
    let cursor = state.tree;

    for (const segment of segments) {
      if (!cursor.children || !Array.isArray(cursor.children)) {
        return null;
      }

      cursor = cursor.children.find((child) => child.name === segment) || null;
      if (!cursor) {
        return null;
      }
    }

    return cursor;
  }

  function sortChildren(children) {
    return (children || []).slice().sort((a, b) => {
      if (a.type === 'dir' && b.type !== 'dir') return -1;
      if (a.type !== 'dir' && b.type === 'dir') return 1;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }

  function getParentPath(absPath) {
    const segments = normalizePath(absPath).split('/').filter(Boolean);
    if (!segments.length) {
      return '/';
    }

    segments.pop();
    return `/${segments.join('/')}` || '/';
  }

  function createStatusLine(text) {
    return { text, className: 'console-line status-line' };
  }

  function createErrorLine(text) {
    return { text, className: 'console-line alert-message' };
  }

  function commandLs(targetPath) {
    const absPath = resolvePath(targetPath || '.', state.cwd);
    const node = getNodeByPath(absPath);
    if (!node) {
      return [createErrorLine(`ls: caminho não encontrado: ${absPath}`)];
    }

    if (node.type !== 'dir') {
      return [createStatusLine(node.name)];
    }

    const entries = sortChildren(node.children).map((child) => (
      child.type === 'dir' ? `${child.name}/` : child.name
    ));

    if (!entries.length) {
      return [createStatusLine('(vazio)')];
    }

    return entries.map((entry) => ({ text: entry, className: 'console-line' }));
  }

  function commandPwd() {
    return [createStatusLine(state.cwd)];
  }

  function commandCd(targetPath) {
    const destination = resolvePath(targetPath || '/', state.cwd);
    const node = getNodeByPath(destination);
    if (!node) {
      return [createErrorLine(`cd: caminho não encontrado: ${destination}`)];
    }

    if (node.type !== 'dir') {
      return [createErrorLine(`cd: não é um diretório: ${destination}`)];
    }

    state.cwd = destination;
    return [createStatusLine(`Diretório atual: ${state.cwd}`)];
  }

  function commandCat(targetPath) {
    if (!targetPath) {
      return [createErrorLine('cat: informe um arquivo. Exemplo: cat logs/incident-076.log')];
    }

    const absPath = resolvePath(targetPath, state.cwd);
    const node = getNodeByPath(absPath);
    if (!node) {
      return [createErrorLine(`cat: arquivo não encontrado: ${absPath}`)];
    }

    if (node.type !== 'file') {
      return [createErrorLine(`cat: não é um arquivo: ${absPath}`)];
    }

    const content = toContentString(node.content);
    return content.split('\n').map((line) => ({ text: line, className: 'console-line' }));
  }

  function renderTree(node, prefix, lines) {
    const sorted = sortChildren(node.children || []);
    sorted.forEach((child, index) => {
      const isLast = index === sorted.length - 1;
      const branch = isLast ? '└── ' : '├── ';
      const childLabel = child.type === 'dir' ? `${child.name}/` : child.name;
      lines.push({ text: `${prefix}${branch}${childLabel}`, className: 'console-line' });

      if (child.type === 'dir') {
        const nextPrefix = `${prefix}${isLast ? '    ' : '│   '}`;
        renderTree(child, nextPrefix, lines);
      }
    });
  }

  function commandTree(targetPath) {
    const absPath = resolvePath(targetPath || '.', state.cwd);
    const node = getNodeByPath(absPath);
    if (!node) {
      return [createErrorLine(`tree: caminho não encontrado: ${absPath}`)];
    }

    const lines = [];
    const rootLabel = node.type === 'dir' ? `${absPath === '/' ? '/' : `${node.name}/`}` : node.name;
    lines.push({ text: rootLabel, className: 'console-line' });

    if (node.type === 'dir') {
      renderTree(node, '', lines);
    }

    return lines;
  }

  function walkTree(node, absPath, visitor) {
    if (!node || typeof node !== 'object') {
      return;
    }

    visitor(node, absPath);
    if (node.type !== 'dir' || !Array.isArray(node.children)) {
      return;
    }

    node.children.forEach((child) => {
      if (!child || typeof child.name !== 'string') {
        return;
      }

      const childPath = normalizePath(`${absPath}/${child.name}`);
      walkTree(child, childPath, visitor);
    });
  }

  function commandFind(query, targetPath) {
    if (!query) {
      return [createErrorLine('find: informe um termo. Exemplo: find report')];
    }

    const basePath = resolvePath(targetPath || '.', state.cwd);
    const node = getNodeByPath(basePath);
    if (!node) {
      return [createErrorLine(`find: caminho não encontrado: ${basePath}`)];
    }

    const term = String(query).toLowerCase();
    const matches = [];

    walkTree(node, basePath, (currentNode, currentPath) => {
      if (currentNode.name.toLowerCase().includes(term)) {
        matches.push(currentNode.type === 'dir' ? `${currentPath}/` : currentPath);
      }
    });

    if (!matches.length) {
      return [createStatusLine('find: nenhum resultado encontrado')];
    }

    return matches.map((match) => ({ text: match, className: 'console-line' }));
  }

  function commandGrep(query, targetPath) {
    if (!query) {
      return [createErrorLine('grep: informe um termo. Exemplo: grep alerta /')];
    }

    const basePath = resolvePath(targetPath || '.', state.cwd);
    const node = getNodeByPath(basePath);
    if (!node) {
      return [createErrorLine(`grep: caminho não encontrado: ${basePath}`)];
    }

    const term = String(query).toLowerCase();
    const results = [];

    walkTree(node, basePath, (currentNode, currentPath) => {
      if (currentNode.type !== 'file') {
        return;
      }

      const lines = toContentString(currentNode.content).split('\n');
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(term)) {
          results.push(`${currentPath}:${index + 1}: ${line}`);
        }
      });
    });

    if (!results.length) {
      return [createStatusLine('grep: nenhum trecho correspondente')];
    }

    return results.map((line) => ({ text: line, className: 'console-line' }));
  }

  function commandMkdir(targetPath) {
    if (!targetPath) {
      return [createErrorLine('mkdir: informe o diretório. Exemplo: mkdir archive/new-sector')];
    }

    const absPath = resolvePath(targetPath, state.cwd);
    if (absPath === '/') {
      return [createErrorLine('mkdir: não é possível criar o diretório raiz')];
    }

    const existing = getNodeByPath(absPath);
    if (existing) {
      return [createErrorLine(`mkdir: já existe: ${absPath}`)];
    }

    const parentPath = getParentPath(absPath);
    const parent = getNodeByPath(parentPath);
    if (!parent || parent.type !== 'dir') {
      return [createErrorLine(`mkdir: diretório pai não encontrado: ${parentPath}`)];
    }

    const name = absPath.split('/').filter(Boolean).pop();
    parent.children = parent.children || [];
    parent.children.push({
      name,
      type: 'dir',
      children: []
    });

    return [createStatusLine(`Diretório criado: ${absPath}`)];
  }

  function commandOpen(targetPath) {
    const catLines = commandCat(targetPath);
    if (catLines[0] && String(catLines[0].text || '').startsWith('cat:')) {
      return catLines.map((line) => ({
        ...line,
        text: line.text.replace(/^cat:/, 'open:')
      }));
    }

    return [createStatusLine(`Abrindo arquivo ${resolvePath(targetPath || '', state.cwd)}...`), ...catLines];
  }

  function commandHelp() {
    const lines = [createStatusLine('Comandos do filesystem virtual:')];
    Object.keys(FILESYSTEM_DESCRIPTIONS).forEach((command) => {
      lines.push({ text: `${command} - ${FILESYSTEM_DESCRIPTIONS[command]}`, className: 'console-line' });
    });
    return lines;
  }

  async function executeCommand(rawCommand) {
    const ok = await ensureLoaded();
    if (!ok) {
      return {
        handled: false,
        lines: [createErrorLine('filesystem: falha ao carregar data/files.json')]
      };
    }

    const normalized = String(rawCommand || '').replace(/\s+/g, ' ').trim();
    if (!normalized) {
      return { handled: false, lines: [] };
    }

    const parts = normalized.split(' ');
    const command = parts[0].toLowerCase();

    if (!FILESYSTEM_DESCRIPTIONS[command]) {
      return { handled: false, lines: [] };
    }

    if (command === 'clear') {
      return { handled: false, lines: [] };
    }

    if (command === 'help') {
      if (parts[1] && parts[1].toLowerCase() !== 'fs' && parts[1].toLowerCase() !== 'filesystem') {
        return { handled: false, lines: [] };
      }

      return { handled: true, lines: commandHelp() };
    }

    if (command === 'ls') {
      return { handled: true, lines: commandLs(parts[1]) };
    }

    if (command === 'pwd') {
      return { handled: true, lines: commandPwd() };
    }

    if (command === 'cd') {
      return { handled: true, lines: commandCd(parts[1]) };
    }

    if (command === 'cat') {
      return { handled: true, lines: commandCat(parts[1]) };
    }

    if (command === 'tree') {
      return { handled: true, lines: commandTree(parts[1]) };
    }

    if (command === 'find') {
      return { handled: true, lines: commandFind(parts[1], parts[2]) };
    }

    if (command === 'grep') {
      return { handled: true, lines: commandGrep(parts[1], parts[2]) };
    }

    if (command === 'mkdir') {
      return { handled: true, lines: commandMkdir(parts[1]) };
    }

    if (command === 'open') {
      return { handled: true, lines: commandOpen(parts[1]) };
    }

    return { handled: false, lines: [] };
  }

  function getPromptLabel() {
    const currentPath = state.cwd === '/' ? '~' : state.cwd;
    return `root@exilio:${currentPath}$`;
  }

  function getFilesystemCommandList() {
    return Object.keys(FILESYSTEM_DESCRIPTIONS);
  }

  window.ExilioApp = window.ExilioApp || {};
  window.ExilioApp.filesystem = {
    loadData,
    loadAll,
    executeCommand,
    getPromptLabel,
    getFilesystemCommandList
  };
})();
