/* Terminal rendering and command input */
(function () {
  const DEFAULT_PROMPT = 'root@exilio:~$';

  const state = {
    history: [],
    historyIndex: -1,
    draftValue: '',
    autocompleteItems: [],
    autocompleteIndex: -1,
    commandQueue: Promise.resolve(),
    renderAudioTickAt: 0,
    scrollRafId: 0,
    inputResizeRafId: 0,
    pendingInputForResize: null
  };

  function getPromptLabel() {
    if (window.ExilioApp && typeof window.ExilioApp.getPromptLabel === 'function') {
      return window.ExilioApp.getPromptLabel() || DEFAULT_PROMPT;
    }

    return DEFAULT_PROMPT;
  }

  function getAvailableCommands() {
    if (window.ExilioApp && typeof window.ExilioApp.getCommandPalette === 'function') {
      return window.ExilioApp.getCommandPalette();
    }

    return [];
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function colorizeCommand(command) {
    const [head, ...tail] = command.split(/\s+/);
    const parts = [];

    if (head) {
      parts.push(`<span class="command-token command-token--name">${escapeHtml(head)}</span>`);
    }

    if (tail.length) {
      parts.push(`<span class="command-token command-token--args"> ${escapeHtml(tail.join(' '))}</span>`);
    }

    return parts.join('');
  }

  function scrollTerminalToBottom() {
    const output = document.getElementById('terminal-output');
    if (!output) return;

    output.scrollTop = output.scrollHeight;
  }

  function scheduleTerminalScroll(force = false) {
    const output = document.getElementById('terminal-output');
    if (!output) return;

    // Evita forcar scroll quando usuario esta navegando historico manualmente.
    if (!force) {
      const distanceToBottom = output.scrollHeight - output.scrollTop - output.clientHeight;
      if (distanceToBottom > 84) {
        return;
      }
    }

    if (state.scrollRafId) return;

    state.scrollRafId = requestAnimationFrame(() => {
      state.scrollRafId = 0;
      scrollTerminalToBottom();
    });
  }

  function typeTextIntoElement(element, text, callback) {
    element.textContent = '';
    element.classList.add('typing');
    element.classList.add('visible');
    element.classList.remove('hidden-text');

    let i = 0;

    function stepChar() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        scheduleTerminalScroll();
        if (window.ExilioApp && typeof window.ExilioApp.playSound === 'function') {
          const now = performance.now();
          if (now - state.renderAudioTickAt >= 42) {
            state.renderAudioTickAt = now;
            window.ExilioApp.playSound('typing');
          }
        }
        i += 1;
        const delay = 12 + Math.random() * 26;
        setTimeout(stepChar, delay);
      } else {
        element.classList.remove('typing');
        if (typeof callback === 'function') {
          setTimeout(callback, 90 + Math.random() * 140);
        }
      }
    }

    stepChar();
  }

  function normalizeLine(line) {
    if (typeof line === 'string') {
      return {
        text: line,
        className: 'console-line'
      };
    }

    return {
      text: String(line && line.text ? line.text : ''),
      className: line && line.className ? line.className : 'console-line',
      instant: Boolean(line && line.instant)
    };
  }

  function appendTerminalLine(entry, callback = null) {
    const output = document.getElementById('terminal-output');
    if (!output) return;

    const lineData = normalizeLine(entry);

    const line = document.createElement('div');
    line.className = lineData.className;
    line.classList.add('hidden-text');
    output.appendChild(line);

    if (lineData.instant) {
      line.textContent = lineData.text;
      line.classList.add('visible');
      line.classList.remove('hidden-text');
      if (typeof callback === 'function') {
        callback();
      }
      scheduleTerminalScroll(true);
      return;
    }

    typeTextIntoElement(line, lineData.text, () => {
      if (typeof callback === 'function') {
        callback();
      }
      scheduleTerminalScroll(true);
    });
  }

  function renderCommandEntry(command, callback = null) {
    const output = document.getElementById('terminal-output');
    if (!output || !command) return;

    const line = document.createElement('div');
    line.className = 'console-line command-entry';

    const prompt = document.createElement('span');
    prompt.className = 'prompt-inline';
    prompt.textContent = `${getPromptLabel()} `;

    const commandText = document.createElement('span');
    commandText.className = 'command-text';
    commandText.classList.add('hidden-text');

    const cursor = document.createElement('span');
    cursor.className = 'terminal-cursor';

    line.append(prompt, commandText, cursor);
    output.appendChild(line);

    typeTextIntoElement(commandText, command, () => {
      commandText.innerHTML = colorizeCommand(command);
      if (typeof callback === 'function') {
        callback();
      }
      scheduleTerminalScroll(true);
    });
  }

  function typeTerminalLines(lines, index = 0) {
    return new Promise((resolve) => {
      if (index >= lines.length) {
        resolve();
        return;
      }

      appendTerminalLine(lines[index], () => {
        typeTerminalLines(lines, index + 1).then(resolve);
      });
    });
  }

  function setupTerminalOutput() {
    const output = document.getElementById('terminal-output');
    if (!output) return;

    output.querySelectorAll('.caret').forEach((node) => node.remove());
  }

  function syncPromptLabels() {
    const prompt = document.querySelector('.prompt');
    if (prompt) {
      prompt.textContent = `${getPromptLabel()} `;
    }
  }

  function autoResizeInput(input) {
    if (!input || input.tagName !== 'TEXTAREA') return;

    state.pendingInputForResize = input;
    if (state.inputResizeRafId) return;

    state.inputResizeRafId = requestAnimationFrame(() => {
      state.inputResizeRafId = 0;
      const activeInput = state.pendingInputForResize;
      if (!activeInput) return;

      activeInput.style.height = 'auto';
      const nextHeight = Math.min(activeInput.scrollHeight, 148);
      const heightAsText = `${nextHeight}px`;
      if (activeInput.style.height !== heightAsText) {
        activeInput.style.height = heightAsText;
      }
    });
  }

  function getSelectionIndex(input) {
    if (typeof input.selectionStart === 'number') {
      return input.selectionStart;
    }

    return input.value.length;
  }

  function getCurrentLineBounds(value, caretIndex) {
    const start = value.lastIndexOf('\n', Math.max(0, caretIndex - 1)) + 1;
    const lineBreakIndex = value.indexOf('\n', caretIndex);
    const end = lineBreakIndex === -1 ? value.length : lineBreakIndex;
    return { start, end };
  }

  function getAutocompleteContext(input) {
    const caretIndex = getSelectionIndex(input);
    const bounds = getCurrentLineBounds(input.value, caretIndex);
    const line = input.value.slice(bounds.start, bounds.end);
    return {
      caretIndex,
      bounds,
      line,
      prefix: line.trim().toLowerCase()
    };
  }

  function createAutocompleteElement(input) {
    const host = input.closest('.terminal-input-shell');
    if (!host) return null;

    let list = host.querySelector('.terminal-autocomplete');
    if (list) return list;

    list = document.createElement('div');
    list.className = 'terminal-autocomplete hidden';
    list.setAttribute('role', 'listbox');
    host.appendChild(list);
    return list;
  }

  function hideAutocomplete(input) {
    const list = createAutocompleteElement(input);
    if (!list) return;
    state.autocompleteItems = [];
    state.autocompleteIndex = -1;
    list.innerHTML = '';
    list.classList.add('hidden');
  }

  function renderAutocomplete(input, items) {
    const list = createAutocompleteElement(input);
    if (!list) return;

    if (!items.length) {
      hideAutocomplete(input);
      return;
    }

    list.innerHTML = '';
    list.classList.remove('hidden');
    state.autocompleteItems = items;
    state.autocompleteIndex = state.autocompleteIndex < 0 ? 0 : Math.min(state.autocompleteIndex, items.length - 1);

    items.forEach((item, index) => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'terminal-autocomplete__item';
      option.classList.toggle('is-active', index === state.autocompleteIndex);
      option.textContent = item;
      option.addEventListener('mousedown', (event) => {
        event.preventDefault();
        applyAutocompleteSelection(input, index);
      });
      list.appendChild(option);
    });
  }

  function refreshAutocomplete(input) {
    const { prefix } = getAutocompleteContext(input);
    if (!prefix || prefix.includes(' ')) {
      hideAutocomplete(input);
      return;
    }

    const items = getAvailableCommands().filter((command) => command.startsWith(prefix));
    renderAutocomplete(input, items.slice(0, 8));
  }

  function replaceCurrentLine(input, nextLine) {
    const caretIndex = getSelectionIndex(input);
    const bounds = getCurrentLineBounds(input.value, caretIndex);
    const valueBefore = input.value.slice(0, bounds.start);
    const valueAfter = input.value.slice(bounds.end);
    input.value = `${valueBefore}${nextLine}${valueAfter}`;
    const nextCaret = valueBefore.length + nextLine.length;
    input.setSelectionRange(nextCaret, nextCaret);
    autoResizeInput(input);
  }

  function applyAutocompleteSelection(input, index = state.autocompleteIndex) {
    const selected = state.autocompleteItems[index];
    if (!selected) return false;
    replaceCurrentLine(input, selected);
    state.draftValue = input.value;
    hideAutocomplete(input);
    return true;
  }

  function moveAutocompleteSelection(input, direction) {
    if (!state.autocompleteItems.length) return false;

    const delta = direction === 'down' ? 1 : -1;
    const nextIndex = (state.autocompleteIndex + delta + state.autocompleteItems.length) % state.autocompleteItems.length;
    state.autocompleteIndex = nextIndex;
    renderAutocomplete(input, state.autocompleteItems);
    return true;
  }

  function insertAtCursor(input, text) {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const valueBefore = input.value.slice(0, start);
    const valueAfter = input.value.slice(end);
    input.value = `${valueBefore}${text}${valueAfter}`;
    const nextCaret = start + text.length;
    input.setSelectionRange(nextCaret, nextCaret);
    autoResizeInput(input);
    state.draftValue = input.value;
  }

  function canUseHistoryOnArrow(input, direction) {
    const hasMultipleLines = input.value.includes('\n');
    if (!hasMultipleLines) return true;

    const caretIndex = getSelectionIndex(input);
    const bounds = getCurrentLineBounds(input.value, caretIndex);
    if (direction === 'up') {
      return bounds.start === 0 && caretIndex === bounds.start;
    }

    return bounds.end === input.value.length && caretIndex === input.value.length;
  }

  function handleHistoryNavigation(input, direction) {
    if (!state.history.length) return;

    if (direction === 'up') {
      if (state.historyIndex < 0) {
        state.historyIndex = state.history.length - 1;
      } else {
        state.historyIndex = Math.max(0, state.historyIndex - 1);
      }
    } else {
      if (state.historyIndex < 0) {
        state.historyIndex = state.history.length;
      } else {
        state.historyIndex = Math.min(state.history.length, state.historyIndex + 1);
      }
    }

    if (state.historyIndex >= state.history.length) {
      input.value = state.draftValue;
      state.historyIndex = state.history.length;
      return;
    }

    input.value = state.history[state.historyIndex];
    autoResizeInput(input);
    state.draftValue = input.value;
  }

  function submitCommand(input) {
    const value = input.value.replace(/\r/g, '').trim();
    if (!value) return;

    state.history.push(value);
    state.historyIndex = state.history.length;
    state.draftValue = '';
    input.value = '';
    autoResizeInput(input);
    hideAutocomplete(input);

    state.commandQueue = state.commandQueue
      .catch(() => undefined)
      .then(() => new Promise((resolve) => {
      renderCommandEntry(value, () => {
        let execution;
        try {
          execution = window.ExilioApp && typeof window.ExilioApp.executeCommand === 'function'
            ? window.ExilioApp.executeCommand(value)
            : Promise.reject(new Error('executeCommand indisponível'));
        } catch (error) {
          execution = Promise.reject(error);
        }

        Promise.resolve(execution)
          .catch(() => {
            const errorLines = [
              { text: 'Falha ao executar o comando.', className: 'console-line alert-message' }
            ];

            if (window.ExilioApp && typeof window.ExilioApp.typeTerminalLines === 'function') {
              return window.ExilioApp.typeTerminalLines(errorLines);
            }

            return typeTerminalLines(errorLines);
          })
          .finally(() => {
            input.focus();
            resolve();
          });
      });
    }));
  }

  function submitTerminalCommand(command) {
    const input = document.getElementById('terminal-input');
    if (!input) return;
    input.value = command;
    state.draftValue = command;
    autoResizeInput(input);
    submitCommand(input);
  }

  function copyTerminalOutput() {
    const output = document.getElementById('terminal-output');
    const button = document.getElementById('copy-terminal-button');
    if (!output || !button) return;

    const text = output.innerText.trim();
    if (!text) return;

    const copyText = async () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }

      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      return copied;
    };

    copyText()
      .then((copied) => {
        button.textContent = copied ? 'Copiado!' : 'Falha';
        button.classList.toggle('is-copied', copied);
        setTimeout(() => {
          button.textContent = 'Copiar saída';
          button.classList.remove('is-copied');
        }, 1400);
      })
      .catch(() => {
        button.textContent = 'Falha';
        button.classList.remove('is-copied');
        setTimeout(() => {
          button.textContent = 'Copiar saída';
        }, 1400);
      });
  }

  function setupTerminalInput() {
    const input = document.getElementById('terminal-input');
    const button = document.getElementById('copy-terminal-button');
    const clearButton = document.getElementById('clear-terminal-button');
    if (!input) return;

    syncPromptLabels();
    autoResizeInput(input);

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        if (!applyAutocompleteSelection(input)) {
          insertAtCursor(input, '  ');
        }
      } else if (event.key === 'ArrowUp') {
        if (moveAutocompleteSelection(input, 'up')) {
          event.preventDefault();
          return;
        }

        if (!canUseHistoryOnArrow(input, 'up')) {
          return;
        }

        event.preventDefault();
        handleHistoryNavigation(input, 'up');
      } else if (event.key === 'ArrowDown') {
        if (moveAutocompleteSelection(input, 'down')) {
          event.preventDefault();
          return;
        }

        if (!canUseHistoryOnArrow(input, 'down')) {
          return;
        }

        event.preventDefault();
        handleHistoryNavigation(input, 'down');
      } else if (event.key === 'Enter' && event.shiftKey) {
        event.preventDefault();
        insertAtCursor(input, '\n');
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (window.ExilioApp && typeof window.ExilioApp.playSound === 'function') {
          window.ExilioApp.playSound('confirmation');
        }
        submitCommand(input);
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        input.value = '';
        state.draftValue = '';
        autoResizeInput(input);
        hideAutocomplete(input);
      } else if (event.key === 'Escape') {
        hideAutocomplete(input);
      }
    });

    input.addEventListener('input', () => {
      state.draftValue = input.value;
      autoResizeInput(input);
      refreshAutocomplete(input);
      if (window.ExilioApp && typeof window.ExilioApp.playSound === 'function' && input.value.length % 2 === 0) {
        window.ExilioApp.playSound('typing');
      }
    });

    input.addEventListener('click', () => refreshAutocomplete(input));

    input.addEventListener('blur', () => {
      setTimeout(() => hideAutocomplete(input), 120);
    });

    if (button) {
      button.addEventListener('click', copyTerminalOutput);
    }

    if (clearButton) {
      clearButton.addEventListener('click', () => {
        submitTerminalCommand('clear');
      });
    }

    setTimeout(() => input.focus(), 180);
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupTerminalOutput();
    setupTerminalInput();
    scheduleTerminalScroll(true);
  });

  window.addEventListener('boot:complete', () => {
    const input = document.getElementById('terminal-input');
    if (input) input.focus();
  });

  window.addEventListener('beforeunload', () => {
    if (state.scrollRafId) {
      cancelAnimationFrame(state.scrollRafId);
      state.scrollRafId = 0;
    }

    if (state.inputResizeRafId) {
      cancelAnimationFrame(state.inputResizeRafId);
      state.inputResizeRafId = 0;
    }

    state.pendingInputForResize = null;
  });

  window.ExilioApp = window.ExilioApp || {};
  window.ExilioApp.typeTerminalLines = typeTerminalLines;
  window.ExilioApp.renderCommandEntry = renderCommandEntry;
  window.ExilioApp.copyTerminalOutput = copyTerminalOutput;
  window.ExilioApp.submitTerminalCommand = submitTerminalCommand;
  window.ExilioApp.getCommandHistory = () => state.history.slice();
  window.ExilioApp.clearTerminalOutput = () => {
    const output = document.getElementById('terminal-output');
    if (!output) return;
    output.innerHTML = '';
  };
  window.ExilioApp.focusTerminalInput = () => {
    const input = document.getElementById('terminal-input');
    if (!input) return;
    input.focus();
  };
})();
