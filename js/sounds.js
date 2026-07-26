/* Optional ambient and interaction sounds */
(function () {
  const audioState = {
    enabled: false,
    context: null,
    masterGain: null,
    unlocked: false
  };

  function getAudioContext() {
    if (audioState.context) return audioState.context;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;

    const context = new AudioContext();
    const gain = context.createGain();
    gain.gain.value = 0.035;
    gain.connect(context.destination);

    audioState.context = context;
    audioState.masterGain = gain;
    return context;
  }

  function ensureReady() {
    const context = getAudioContext();
    if (!context) return null;

    if (context.state === 'suspended') {
      context.resume();
    }

    return context;
  }

  function playTone({
    frequency,
    duration,
    type = 'sine',
    volume = 0.08,
    slideTo,
    delay = 0,
    detune = 0
  }) {
    const context = ensureReady();
    if (!context || !audioState.masterGain || !audioState.enabled) return;

    const now = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = type;
    oscillator.detune.value = detune;
    oscillator.frequency.setValueAtTime(frequency, now);

    if (slideTo) {
      oscillator.frequency.exponentialRampToValueAtTime(slideTo, now + Math.max(duration * 0.6, 0.08));
    }

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioState.masterGain);

    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  function playSound(name) {
    if (!audioState.enabled) return;

    const soundConfigs = {
      boot: [
        { frequency: 180, duration: 0.12, type: 'sawtooth', volume: 0.06, slideTo: 220 },
        { frequency: 260, duration: 0.16, type: 'triangle', volume: 0.05, slideTo: 320, delay: 0.1 }
      ],
      typing: [
        { frequency: 720, duration: 0.04, type: 'square', volume: 0.025, slideTo: 760 }
      ],
      error: [
        { frequency: 340, duration: 0.1, type: 'sawtooth', volume: 0.05, slideTo: 220 },
        { frequency: 220, duration: 0.14, type: 'triangle', volume: 0.04, slideTo: 180, delay: 0.08 }
      ],
      alert: [
        { frequency: 900, duration: 0.09, type: 'square', volume: 0.04, slideTo: 840 },
        { frequency: 780, duration: 0.09, type: 'square', volume: 0.03, slideTo: 720, delay: 0.08 }
      ],
      confirmation: [
        { frequency: 520, duration: 0.08, type: 'triangle', volume: 0.04, slideTo: 640 },
        { frequency: 700, duration: 0.09, type: 'triangle', volume: 0.03, slideTo: 820, delay: 0.08 }
      ],
      click: [
        { frequency: 680, duration: 0.04, type: 'square', volume: 0.02, slideTo: 620 }
      ],
      'system-started': [
        { frequency: 440, duration: 0.1, type: 'triangle', volume: 0.04, slideTo: 560 },
        { frequency: 660, duration: 0.12, type: 'triangle', volume: 0.03, slideTo: 780, delay: 0.1 },
        { frequency: 880, duration: 0.14, type: 'triangle', volume: 0.025, slideTo: 980, delay: 0.2 }
      ]
    };

    const patterns = soundConfigs[name];
    if (!patterns) return;

    patterns.forEach((pattern) => playTone(pattern));
  }

  function setEnabled(value) {
    audioState.enabled = Boolean(value);
    if (audioState.enabled) {
      ensureReady();
    }
  }

  function toggleEnabled() {
    const next = !audioState.enabled;
    setEnabled(next);
    if (next) {
      playSound('confirmation');
    }
    return next;
  }

  function bindToggleButton() {
    const button = document.getElementById('audio-toggle');
    if (!button) return;

    const render = () => {
      const label = audioState.enabled ? 'Sons: ON' : 'Sons: OFF';
      button.textContent = label;
      button.setAttribute('aria-pressed', String(audioState.enabled));
    };

    button.addEventListener('click', (event) => {
      event.preventDefault();
      const next = toggleEnabled();
      if (next) {
        button.classList.add('is-enabled');
      } else {
        button.classList.remove('is-enabled');
      }
      render();
    });

    render();
  }

  function bindGlobalClicks() {
    document.addEventListener('click', (event) => {
      if (event.target instanceof Element && event.target.closest('#audio-toggle')) {
        return;
      }

      if (audioState.enabled) {
        playSound('click');
      }
    });
  }

  function init() {
    bindToggleButton();
    bindGlobalClicks();
  }

  document.addEventListener('DOMContentLoaded', init);

  window.ExilioApp = window.ExilioApp || {};
  window.ExilioApp.playSound = playSound;
  window.ExilioApp.setSoundEnabled = setEnabled;
  window.ExilioApp.toggleSoundEnabled = toggleEnabled;
})();
