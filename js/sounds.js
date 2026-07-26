/* Audio manager for interface feedback and ambience */
(function () {
  const STORAGE_KEY = 'exilio.audio.state.v1';
  const DEFAULT_VOLUME = 0.42;

  const state = {
    enabled: false,
    muted: false,
    volume: DEFAULT_VOLUME,
    context: null,
    masterGain: null,
    ambience: {
      static: null,
      fans: null,
      radio: null,
      interference: null
    },
    keyboardTickAt: 0,
    randomStaticTimerId: null,
    userActivated: false
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function loadSavedState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      state.enabled = Boolean(parsed.enabled);
      state.muted = Boolean(parsed.muted);
      state.volume = clamp(Number(parsed.volume), 0, 1);
      if (!Number.isFinite(state.volume)) {
        state.volume = DEFAULT_VOLUME;
      }
    } catch (error) {
      state.enabled = false;
      state.muted = false;
      state.volume = DEFAULT_VOLUME;
    }
  }

  function persistState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        enabled: state.enabled,
        muted: state.muted,
        volume: state.volume
      }));
    } catch (error) {
      // Ignore quota/private mode errors.
    }
  }

  function getAudioContext() {
    if (state.context) return state.context;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;

    const context = new AudioContext();
    const masterGain = context.createGain();

    masterGain.gain.value = 0;
    masterGain.connect(context.destination);

    state.context = context;
    state.masterGain = masterGain;
    return context;
  }

  function ensureReady() {
    const context = getAudioContext();
    if (!context) return null;

    if (context.state === 'suspended') {
      const resumed = context.resume();
      if (resumed && typeof resumed.catch === 'function') {
        resumed.catch(() => {
          // Browser can block autoplay until the first user interaction.
        });
      }
    }

    return context;
  }

  function markUserActivated() {
    state.userActivated = true;
    ensureReady();
  }

  function getEffectiveVolume() {
    if (!state.enabled || state.muted) return 0;
    return clamp(state.volume, 0, 1);
  }

  function applyMasterVolume() {
    if (!state.masterGain || !state.context) return;
    const now = state.context.currentTime;
    const value = getEffectiveVolume() * 0.9;
    state.masterGain.gain.cancelScheduledValues(now);
    state.masterGain.gain.setTargetAtTime(value, now, 0.03);
  }

  function createNoiseBuffer(context) {
    const length = context.sampleRate * 2;
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
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
    if (!context || !state.masterGain || !state.enabled || state.muted) return;

    const now = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = type;
    oscillator.detune.value = detune;
    oscillator.frequency.setValueAtTime(Math.max(1, frequency), now);

    if (slideTo) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), now + Math.max(duration * 0.6, 0.08));
    }

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gainNode);
    gainNode.connect(state.masterGain);

    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);
  }

  function stopAmbient(name) {
    const entry = state.ambience[name];
    if (!entry) return;

    if (entry.intervalId) {
      clearInterval(entry.intervalId);
    }

    if (Array.isArray(entry.stops)) {
      entry.stops.forEach((stopFn) => {
        try {
          stopFn();
        } catch (error) {
          // Best effort cleanup.
        }
      });
    }

    state.ambience[name] = null;
  }

  function startStatic() {
    if (state.ambience.static) return;

    const context = ensureReady();
    if (!context || !state.masterGain) return;

    const source = context.createBufferSource();
    source.buffer = createNoiseBuffer(context);
    source.loop = true;

    const filter = context.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1800;

    const gainNode = context.createGain();
    gainNode.gain.value = 0.05;

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(state.masterGain);
    source.start();

    state.ambience.static = {
      stops: [() => source.stop(), () => source.disconnect(), () => filter.disconnect(), () => gainNode.disconnect()]
    };
  }

  function startFans() {
    if (state.ambience.fans) return;

    const context = ensureReady();
    if (!context || !state.masterGain) return;

    const hum = context.createOscillator();
    hum.type = 'sawtooth';
    hum.frequency.value = 58;

    const flutter = context.createOscillator();
    flutter.type = 'triangle';
    flutter.frequency.value = 0.27;

    const flutterGain = context.createGain();
    flutterGain.gain.value = 6;

    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 210;

    const gainNode = context.createGain();
    gainNode.gain.value = 0.05;

    flutter.connect(flutterGain);
    flutterGain.connect(hum.frequency);
    hum.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(state.masterGain);

    hum.start();
    flutter.start();

    state.ambience.fans = {
      stops: [
        () => hum.stop(),
        () => flutter.stop(),
        () => hum.disconnect(),
        () => flutter.disconnect(),
        () => flutterGain.disconnect(),
        () => filter.disconnect(),
        () => gainNode.disconnect()
      ]
    };
  }

  function startRadio() {
    if (state.ambience.radio) return;

    const context = ensureReady();
    if (!context || !state.masterGain) return;

    const noise = context.createBufferSource();
    noise.buffer = createNoiseBuffer(context);
    noise.loop = true;

    const band = context.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 920;
    band.Q.value = 2.4;

    const carrier = context.createOscillator();
    carrier.type = 'triangle';
    carrier.frequency.value = 460;

    const carrierGain = context.createGain();
    carrierGain.gain.value = 0.012;

    const noiseGain = context.createGain();
    noiseGain.gain.value = 0.035;

    noise.connect(band);
    band.connect(noiseGain);
    noiseGain.connect(state.masterGain);

    carrier.connect(carrierGain);
    carrierGain.connect(state.masterGain);

    noise.start();
    carrier.start();

    const intervalId = setInterval(() => {
      const now = context.currentTime;
      const next = 820 + Math.random() * 260;
      band.frequency.setTargetAtTime(next, now, 0.2);
      carrier.frequency.setTargetAtTime(380 + Math.random() * 220, now, 0.2);
    }, 1400);

    state.ambience.radio = {
      intervalId,
      stops: [
        () => noise.stop(),
        () => carrier.stop(),
        () => noise.disconnect(),
        () => band.disconnect(),
        () => noiseGain.disconnect(),
        () => carrier.disconnect(),
        () => carrierGain.disconnect()
      ]
    };
  }

  function startInterference() {
    if (state.ambience.interference) return;

    const context = ensureReady();
    if (!context || !state.masterGain) return;

    const source = context.createBufferSource();
    source.buffer = createNoiseBuffer(context);
    source.loop = true;

    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2400;
    filter.Q.value = 6;

    const tremolo = context.createOscillator();
    tremolo.type = 'square';
    tremolo.frequency.value = 4.2;

    const tremoloGain = context.createGain();
    tremoloGain.gain.value = 0.02;

    const gainNode = context.createGain();
    gainNode.gain.value = 0.02;

    tremolo.connect(tremoloGain);
    tremoloGain.connect(gainNode.gain);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(state.masterGain);

    source.start();
    tremolo.start();

    state.ambience.interference = {
      stops: [
        () => source.stop(),
        () => tremolo.stop(),
        () => source.disconnect(),
        () => filter.disconnect(),
        () => tremolo.disconnect(),
        () => tremoloGain.disconnect(),
        () => gainNode.disconnect()
      ]
    };
  }

  function playClick() {
    playTone({ frequency: 760, duration: 0.035, type: 'square', volume: 0.025, slideTo: 660 });
  }

  function playKeyboard() {
    playTone({ frequency: 1180, duration: 0.022, type: 'square', volume: 0.028, slideTo: 1100 });
  }

  function playBeep() {
    playTone({ frequency: 520, duration: 0.08, type: 'triangle', volume: 0.075, slideTo: 700 });
    playTone({ frequency: 760, duration: 0.07, type: 'triangle', volume: 0.058, delay: 0.07, slideTo: 860 });
  }

  function playAlarm() {
    playTone({ frequency: 960, duration: 0.08, type: 'square', volume: 0.07, slideTo: 820 });
    playTone({ frequency: 740, duration: 0.08, type: 'square', volume: 0.058, delay: 0.09, slideTo: 620 });
  }

  function playBoot() {
    playTone({ frequency: 180, duration: 0.12, type: 'sawtooth', volume: 0.06, slideTo: 250 });
    playTone({ frequency: 260, duration: 0.16, type: 'triangle', volume: 0.05, slideTo: 360, delay: 0.1 });
  }

  function playSystemStarted() {
    playTone({ frequency: 430, duration: 0.11, type: 'triangle', volume: 0.04, slideTo: 560 });
    playTone({ frequency: 660, duration: 0.12, type: 'triangle', volume: 0.03, slideTo: 790, delay: 0.1 });
    playTone({ frequency: 880, duration: 0.14, type: 'triangle', volume: 0.025, slideTo: 990, delay: 0.2 });
  }

  function setAmbientEnabled(name, value) {
    const enabled = Boolean(value);

    if (!enabled) {
      stopAmbient(name);
      return;
    }

    if (name === 'static') startStatic();
    if (name === 'fans') startFans();
    if (name === 'radio') startRadio();
    if (name === 'interference') startInterference();
  }

  function stopAllAmbience() {
    stopAmbient('static');
    stopAmbient('fans');
    stopAmbient('radio');
    stopAmbient('interference');
  }

  function playRandomStaticBurst(durationMs = 950) {
    if (!state.enabled || state.muted) return;

    const context = ensureReady();
    if (!context || !state.masterGain) return;

    const source = context.createBufferSource();
    source.buffer = createNoiseBuffer(context);

    const band = context.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 1300 + Math.random() * 2000;
    band.Q.value = 1.5 + Math.random() * 3;

    const burstGain = context.createGain();
    const now = context.currentTime;
    const duration = Math.max(0.25, durationMs / 1000);

    burstGain.gain.setValueAtTime(0.0001, now);
    burstGain.gain.exponentialRampToValueAtTime(0.035, now + 0.04);
    burstGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.connect(band);
    band.connect(burstGain);
    burstGain.connect(state.masterGain);

    source.start(now);
    source.stop(now + duration + 0.03);

    source.onended = () => {
      source.disconnect();
      band.disconnect();
      burstGain.disconnect();
    };
  }

  function clearRandomStaticScheduler() {
    if (state.randomStaticTimerId) {
      clearTimeout(state.randomStaticTimerId);
      state.randomStaticTimerId = null;
    }
  }

  function scheduleRandomStaticEvent() {
    clearRandomStaticScheduler();
    if (!state.enabled) return;

    const minDelay = 18000;
    const maxDelay = 42000;
    const delay = Math.floor(minDelay + Math.random() * (maxDelay - minDelay));

    state.randomStaticTimerId = setTimeout(() => {
      state.randomStaticTimerId = null;
      if (!state.enabled) return;

      playRandomStaticBurst(600 + Math.random() * 800);

      if (window.ExilioApp && window.ExilioApp.notifications && typeof window.ExilioApp.notifications.alert === 'function') {
        window.ExilioApp.notifications.alert('Chiado detectado no canal de rádio. Possível tentativa de contato.', {
          title: 'Contato de Rádio',
          duration: 3400
        });
      }

      scheduleRandomStaticEvent();
    }, delay);
  }

  function startDefaultAmbience() {
    if (!state.enabled) return;
    scheduleRandomStaticEvent();
  }

  function applyEnabledState() {
    if (state.enabled) {
      ensureReady();
      startDefaultAmbience();
    } else {
      clearRandomStaticScheduler();
      stopAllAmbience();
    }

    applyMasterVolume();
    persistState();
    renderControls();
  }

  function setEnabled(value) {
    state.enabled = Boolean(value);
    applyEnabledState();
  }

  function toggleEnabled() {
    setEnabled(!state.enabled);
    if (state.enabled) {
      markUserActivated();
      playBeep();
      setTimeout(() => {
        if (state.enabled && !state.muted) {
          playBeep();
        }
      }, 45);
    }
    return state.enabled;
  }

  function setMuted(value) {
    state.muted = Boolean(value);
    applyMasterVolume();
    persistState();
    renderControls();
  }

  function toggleMuted() {
    setMuted(!state.muted);
    return state.muted;
  }

  function setVolume(value) {
    state.volume = clamp(Number(value), 0, 1);
    if (!Number.isFinite(state.volume)) {
      state.volume = DEFAULT_VOLUME;
    }
    applyMasterVolume();
    persistState();
    renderControls();
  }

  function playSound(name) {
    if (!state.enabled) return;

    const key = String(name || '').toLowerCase();

    if (key === 'click') return playClick();
    if (key === 'typing' || key === 'teclado' || key === 'keyboard') return playKeyboard();
    if (key === 'beep' || key === 'confirmation') return playBeep();
    if (key === 'error' || key === 'alert' || key === 'alarm' || key === 'alarme') return playAlarm();
    if (key === 'boot') return playBoot();
    if (key === 'system-started') return playSystemStarted();

    if (key === 'static' || key === 'estatica') return playRandomStaticBurst(900);
    if (key === 'fans' || key === 'fan' || key === 'ventiladores') return setAmbientEnabled('fans', true);
    if (key === 'radio') return setAmbientEnabled('radio', true);
    if (key === 'interference' || key === 'interferencias') return setAmbientEnabled('interference', true);
  }

  function ensureAudioStyles() {
    if (document.getElementById('audio-controls-style')) return;

    const style = document.createElement('style');
    style.id = 'audio-controls-style';
    style.textContent = `
      .audio-controls {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-left: 6px;
      }

      .audio-mute {
        min-width: 62px;
      }

      .audio-mute.is-muted {
        border-color: rgba(255, 90, 90, 0.75);
        color: #ffd0d0;
      }

      .audio-volume {
        width: 112px;
        accent-color: #ff5e5e;
        cursor: pointer;
      }

      .audio-volume-value {
        min-width: 38px;
        font-size: 0.74rem;
        letter-spacing: 0.08em;
        opacity: 0.9;
      }
    `;

    document.head.appendChild(style);
  }

  function ensureControls() {
    const headerStatus = document.querySelector('.header-status');
    const toggle = document.getElementById('audio-toggle');
    if (!headerStatus || !toggle) return null;

    ensureAudioStyles();

    let controls = document.getElementById('audio-controls');
    if (!controls) {
      controls = document.createElement('div');
      controls.id = 'audio-controls';
      controls.className = 'audio-controls';

      const muteButton = document.createElement('button');
      muteButton.type = 'button';
      muteButton.id = 'audio-mute';
      muteButton.className = 'terminal-action audio-mute';
      muteButton.setAttribute('aria-pressed', 'false');

      const volumeRange = document.createElement('input');
      volumeRange.type = 'range';
      volumeRange.id = 'audio-volume';
      volumeRange.className = 'audio-volume';
      volumeRange.min = '0';
      volumeRange.max = '100';
      volumeRange.step = '1';
      volumeRange.setAttribute('aria-label', 'Volume de áudio');

      const volumeValue = document.createElement('span');
      volumeValue.id = 'audio-volume-value';
      volumeValue.className = 'audio-volume-value';

      controls.appendChild(muteButton);
      controls.appendChild(volumeRange);
      controls.appendChild(volumeValue);
      headerStatus.insertBefore(controls, headerStatus.querySelector('.status-pill'));

      toggle.addEventListener('click', (event) => {
        event.preventDefault();
        toggleEnabled();
      });

      muteButton.addEventListener('click', (event) => {
        event.preventDefault();
        if (!state.enabled) {
          setEnabled(true);
        }
        toggleMuted();
      });

      volumeRange.addEventListener('input', () => {
        if (!state.enabled) {
          setEnabled(true);
        }
        setVolume(Number(volumeRange.value) / 100);
      });

      volumeRange.addEventListener('change', () => {
        playBeep();
      });
    }

    return controls;
  }

  function renderControls() {
    const toggle = document.getElementById('audio-toggle');
    const controls = ensureControls();
    if (!toggle || !controls) return;

    const muteButton = document.getElementById('audio-mute');
    const volumeRange = document.getElementById('audio-volume');
    const volumeValue = document.getElementById('audio-volume-value');

    toggle.textContent = state.enabled ? 'Sons: ON' : 'Sons: OFF';
    toggle.setAttribute('aria-pressed', String(state.enabled));
    toggle.classList.toggle('is-enabled', state.enabled);

    if (muteButton) {
      muteButton.textContent = state.muted ? 'Mute: ON' : 'Mute: OFF';
      muteButton.setAttribute('aria-pressed', String(state.muted));
      muteButton.classList.toggle('is-muted', state.muted);
      muteButton.disabled = !state.enabled;
    }

    if (volumeRange) {
      volumeRange.value = String(Math.round(clamp(state.volume, 0, 1) * 100));
      volumeRange.disabled = !state.enabled;
    }

    if (volumeValue) {
      volumeValue.textContent = `${Math.round(clamp(state.volume, 0, 1) * 100)}%`;
    }
  }

  function bindInteractionSounds() {
    const unlockAudio = () => {
      markUserActivated();
    };

    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });

    document.addEventListener('keydown', (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key.length !== 1 && event.key !== 'Backspace' && event.key !== 'Enter') return;

      const now = performance.now();
      if (now - state.keyboardTickAt < 35) return;
      state.keyboardTickAt = now;
      playKeyboard();
    });

    window.addEventListener('exilio:event', (event) => {
      const detail = event && event.detail ? event.detail : null;
      const type = detail && detail.type ? String(detail.type).toLowerCase() : 'system';

      if (type === 'error' || type === 'alert') {
        playAlarm();
      } else {
        playBeep();
      }

      if (Math.random() > 0.55) {
        playRandomStaticBurst(450 + Math.random() * 550);
      }
    });
  }

  function bindBootAudioHooks() {
    window.addEventListener('boot:complete', () => {
      if (state.enabled) {
        setAmbientEnabled('radio', false);
        playSystemStarted();
      }
    });

    window.addEventListener('boot:restart', () => {
      if (state.enabled) {
        playBoot();
      }
    });
  }

  function init() {
    loadSavedState();
    ensureControls();
    renderControls();
    bindInteractionSounds();
    bindBootAudioHooks();
    applyEnabledState();
  }

  document.addEventListener('DOMContentLoaded', init);

  window.ExilioApp = window.ExilioApp || {};
  window.ExilioApp.playSound = playSound;
  window.ExilioApp.setSoundEnabled = setEnabled;
  window.ExilioApp.toggleSoundEnabled = toggleEnabled;
  window.ExilioApp.setSoundMuted = setMuted;
  window.ExilioApp.toggleSoundMuted = toggleMuted;
  window.ExilioApp.setSoundVolume = setVolume;
  window.ExilioApp.getSoundState = () => ({
    enabled: state.enabled,
    muted: state.muted,
    volume: state.volume
  });
  window.ExilioApp.setAmbientSound = setAmbientEnabled;
})();
