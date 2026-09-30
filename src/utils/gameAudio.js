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

  get muted() {
    return this._muted;
  }

  set muted(val) {
    this.setMuted(val);
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

  _getContext() {
    return getAudioContext();
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

  playGomokuStone() {
    if (this.muted) return;
    const ctx = this._getContext();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      // 280Hz 阻尼正弦衰减
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.09);

      // 白噪声瞬态（微小撞击质感）
      if (typeof ctx.createBuffer === 'function') {
        const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * 0.015));
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.3;
        }
        const noise = ctx.createBufferSource();
        const noiseGain = ctx.createGain();
        noise.buffer = buffer;
        noiseGain.gain.setValueAtTime(0.2, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
        noise.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(t);
        noise.stop(t + 0.016);
      }
    } catch {
      // 容错降级
    }
  }

  playTetrisDrop() {
    if (this.muted) return;
    const ctx = this._getContext();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.13);
    } catch {
      // 容错降级
    }
  }

  playTetrisClear(lines = 1) {
    if (this.muted) return;
    const ctx = this._getContext();
    if (!ctx) return;
    try {
      const baseFreqs = lines >= 4
        ? [440, 554.37, 659.25, 880]
        : lines === 3
        ? [392, 493.88, 587.33]
        : lines === 2
        ? [440, 554.37]
        : [523.25];
      baseFreqs.forEach((freq, idx) => {
        const t = ctx.currentTime + idx * 0.055;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = lines >= 4 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(lines >= 4 ? 0.2 : 0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.19);
      });
    } catch {
      // 容错降级
    }
  }

  playTetrisFanfare() {
    this.playWin();
  }

  playSudokuPencil() {
    if (this.muted) return;
    const ctx = this._getContext();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.04);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    } catch {
      // 容错降级
    }
  }

  playSudokuErase() {
    if (this.muted) return;
    const ctx = this._getContext();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.06);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.07);
    } catch {
      // 容错降级
    }
  }

  playSudokuError() {
    if (this.muted) return;
    const ctx = this._getContext();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.16);
    } catch {
      // 容错降级
    }
  }
}

export const gameAudio = new GameAudioEngine();
