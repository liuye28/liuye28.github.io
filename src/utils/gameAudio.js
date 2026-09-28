import { safeGetItem, safeSetItem } from './storage.js';

const MUTE_STORAGE_KEY = 'games_sound_muted';

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

class GameAudioEngine {
  constructor() {
    this._muted = safeGetItem(MUTE_STORAGE_KEY) === 'true';
  }

  isMuted() {
    return this._muted;
  }

  setMuted(muted) {
    this._muted = Boolean(muted);
    safeSetItem(MUTE_STORAGE_KEY, String(this._muted));
  }

  toggleMute() {
    this.setMuted(!this._muted);
    return this._muted;
  }

  _playTone(freq, type, duration, gainValue = 0.1, delay = 0) {
    if (this._muted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime + delay;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(gainValue, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // 容错降级
    }
  }

  playMove() {
    this._playTone(320, 'sine', 0.05, 0.04);
  }

  playEat() {
    this._playTone(523.25, 'triangle', 0.08, 0.1, 0); // C5
    this._playTone(659.25, 'triangle', 0.12, 0.1, 0.06); // E5
  }

  playMerge() {
    this._playTone(440, 'triangle', 0.08, 0.08, 0);
    this._playTone(880, 'sine', 0.15, 0.1, 0.05);
  }

  playFlip() {
    this._playTone(480, 'sine', 0.04, 0.05);
  }

  playExplosion() {
    this._playTone(110, 'sawtooth', 0.35, 0.2);
    this._playTone(70, 'triangle', 0.45, 0.2, 0.05);
  }

  playWin() {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      this._playTone(freq, 'triangle', 0.25, 0.12, idx * 0.1);
    });
  }

  playLose() {
    const notes = [440, 415.3, 392, 349.23];
    notes.forEach((freq, idx) => {
      this._playTone(freq, 'sawtooth', 0.22, 0.08, idx * 0.12);
    });
  }
}

export const gameAudio = new GameAudioEngine();
