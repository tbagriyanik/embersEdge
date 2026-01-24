
import { TileType, EntityType } from '../types';

export const SoundManager = {
  ctx: null as AudioContext | null,
  ambienceStarted: false,
  isDay: true,
  soundEnabled: true,

  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  },

  updateAmbienceState(isDay: boolean, enabled: boolean) {
    this.isDay = isDay;
    this.soundEnabled = enabled;
    if (this.ctx && this.ctx.state === 'suspended' && enabled) {
      this.ctx.resume();
    }
  },

  startForestAmbience() {
    if (!this.ctx || this.ambienceStarted) return;
    this.ambienceStarted = true;

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    
    const windGain = this.ctx.createGain();
    windGain.gain.value = 0.02;

    whiteNoise.connect(filter);
    filter.connect(windGain);
    windGain.connect(this.ctx.destination);
    whiteNoise.start();

    const spawnBird = () => {
      if (!this.ctx) return;
      if (this.isDay && this.soundEnabled) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        const f = 2000 + Math.random() * 2000;
        osc.frequency.setValueAtTime(f, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(f + 500, this.ctx.currentTime + 0.1);
        g.gain.setValueAtTime(0, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.005, this.ctx.currentTime + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.3);
        osc.connect(g); g.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.4);
      }
      setTimeout(spawnBird, 5000 + Math.random() * 10000);
    };

    spawnBird();
  },

  playUI(type: 'hover' | 'click' | 'open' | 'fanfare') {
    if (!this.ctx || !this.soundEnabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.connect(g); g.connect(this.ctx.destination);

    if (type === 'hover') {
      osc.frequency.setValueAtTime(1000, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
      g.gain.setValueAtTime(0.02, now);
      g.gain.linearRampToValueAtTime(0, now + 0.05);
    } else if (type === 'click') {
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
      g.gain.setValueAtTime(0.1, now);
      g.gain.linearRampToValueAtTime(0, now + 0.1);
    } else if (type === 'fanfare') {
      const osc2 = this.ctx.createOscillator();
      const g2 = this.ctx.createGain();
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(659, now + 0.1);
      osc.frequency.setValueAtTime(880, now + 0.2);
      g.gain.setValueAtTime(0.1, now);
      g.gain.linearRampToValueAtTime(0.05, now + 0.5);
      g.gain.linearRampToValueAtTime(0, now + 1.0);
    }
    osc.start(); osc.stop(now + (type === 'fanfare' ? 1.0 : 0.1));
  },

  playGather(type: EntityType) {
    if (!this.ctx || !this.soundEnabled) return;
    const now = this.ctx.currentTime;
    const variation = 0.8 + Math.random() * 0.4;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.connect(g); g.connect(this.ctx.destination);

    if (type === 'tree') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150 * variation, now);
      osc.frequency.exponentialRampToValueAtTime(40 * variation, now + 0.1);
      g.gain.setValueAtTime(0.15, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    } else if (type === 'rock') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200 * variation, now);
      osc.frequency.exponentialRampToValueAtTime(800 * variation, now + 0.05);
      g.gain.setValueAtTime(0.1, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300 * variation, now);
      g.gain.setValueAtTime(0.05, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    }
    osc.start(); osc.stop(now + 0.2);
  },

  playFootstep(terrain: TileType, volume: number) {
    if (!this.ctx || !this.soundEnabled || this.ctx.state === 'suspended' || terrain === 'snow_tile') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.connect(g); g.connect(this.ctx.destination);
    osc.frequency.setValueAtTime(100, now);
    g.gain.setValueAtTime(Math.min(0.02, volume * 0.1), now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    osc.start(); osc.stop(now + 0.12);
  },

  play(type: 'click' | 'gather' | 'craft' | 'eat' | 'step') {
    if (type === 'click') this.playUI('click');
    else if (type === 'craft') this.playUI('fanfare');
    else if (type === 'gather') this.playGather('bush');
    else if (type === 'eat') this.playGather('bush');
  }
};
