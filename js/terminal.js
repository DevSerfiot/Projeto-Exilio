/* Terminal rendering and command input */
(function () {
  const state = {
    history: [],
    historyIndex: -1,
    draftValue: ''
  };

  function scrollTerminalToBottom() {
    const output = document.getElementById('terminal-output');
    if (!output) return;

    output.scrollTop = output.scrollHeight;
    output.scrollTo({ top: output.scrollHeight, behavior: 'smooth' });
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

  function appendTerminalLine(text, className = 'console-line', callback = null) {
    const output = document.getElementById('terminal-output');
    if (!output) return;

    const line = document.createElement('div');
    line.className = className;
    line.classList.add('hidden-text');
    output.appendChild(line);

    typeTextIntoElement(line, text, () => {
      if (typeof callback === 'function') {
        callback();
      }
      setTimeout(scrollTerminalToBottom, 40);
    });
  }

  function renderCommandEntry(command) {
    const output = document.getElementById('terminal-output');
    if (!output || !command) return;

    const line = document.createElement('div');
    line.className = 'console-line command-entry';

    const prompt = document.createElement('span');
    prompt.className = 'prompt-inline';
    prompt.textContent = 'root@exilio:~$';

    const commandText = document.createElement('span');
    commandText.className = 'command-text';
    commandText.textContent = command;

    const cursor = document.createElement('span');
    cursor.className = 'terminal-cursor';

    line.append(prompt, commandText, cursor);
    output.appendChild(line);
    requestAnimationFrame(scrollTerminalToBottom);
  }

  function typeTerminalLines(lines, index = 0) {
    if (index >= lines.length) return;

    appendTerminalLine(lines[index], 'console-line', () => {
      typeTerminalLines(lines, index + 1);
    });
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
  }

  function submitCommand(input) {
    const value = input.value.trim();
    if (!value) return;

    renderCommandEntry(value);
    state.history.push(value);
    state.historyIndex = state.history.length;
    state.draftValue = '';

    window.ExilioApp.executeCommand(value);
    input.value = '';
    input.focus();
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

    copyText().then((copied) => {
      button.textContent = copied ? 'Copiado!' : 'Falha';
      button.classList.toggle('is-copied', copied);
      setTimeout(() => {
        button.textContent = 'Copiar saída';
        button.classList.remove('is-copied');
      }, 1400);
    });
  }

  function setupTerminalInput() {
    const input = document.getElementById('terminal-input');
    const button = document.getElementById('copy-terminal-button');
    if (!input) return;

    input.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        handleHistoryNavigation(input, 'up');
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        handleHistoryNavigation(input, 'down');
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (window.ExilioApp && typeof window.ExilioApp.playSound === 'function') {
          window.ExilioApp.playSound('confirmation');
        }
        submitCommand(input);
      }
    });

    input.addEventListener('input', () => {
      state.draftValue = input.value;
      if (window.ExilioApp && typeof window.ExilioApp.playSound === 'function' && input.value.length % 2 === 0) {
        window.ExilioApp.playSound('typing');
      }
    });

    if (button) {
      button.addEventListener('click', copyTerminalOutput);
    }

    setTimeout(() => input.focus(), 180);
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupTerminalInput();
    scrollTerminalToBottom();
  });

  window.addEventListener('boot:complete', () => {
    const input = document.getElementById('terminal-input');
    if (input) input.focus();
  });

  window.ExilioApp = window.ExilioApp || {};
  window.ExilioApp.typeTerminalLines = typeTerminalLines;
  window.ExilioApp.renderCommandEntry = renderCommandEntry;
  window.ExilioApp.copyTerminalOutput = copyTerminalOutput;
})();
