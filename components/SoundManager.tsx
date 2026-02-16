
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
    filter.frequency.value = 350;
    
    const windGain = this.ctx.createGain();
    windGain.gain.value = 0.02;

    whiteNoise.connect(filter);
    filter.connect(windGain);
    windGain.connect(this.ctx.destination);
    whiteNoise.start();

    // Occasional sounds
    const spawnBird = () => {
      if (!this.ctx) return;
      if (this.isDay && this.soundEnabled) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        const f = 1100 + Math.random() * 700;
        osc.frequency.setValueAtTime(f, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(f + 200, this.ctx.currentTime + 0.15);
        g.gain.setValueAtTime(0, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.004, this.ctx.currentTime + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4);
        osc.connect(g); g.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.5);
      }
      setTimeout(spawnBird, 8000 + Math.random() * 12000);
    };

    spawnBird();
  },

  playUI(type: 'hover' | 'click' | 'open' | 'fanfare' | 'equip') {
    if (!this.ctx || !this.soundEnabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.connect(g); g.connect(this.ctx.destination);

    if (type === 'hover') {
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.05);
      g.gain.setValueAtTime(0.02, now);
      g.gain.linearRampToValueAtTime(0, now + 0.05);
    } else if (type === 'click') {
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(250, now + 0.1);
      g.gain.setValueAtTime(0.1, now);
      g.gain.linearRampToValueAtTime(0, now + 0.1);
    } else if (type === 'equip') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
      g.gain.setValueAtTime(0.05, now);
      g.gain.linearRampToValueAtTime(0, now + 0.1);
    } else if (type === 'fanfare') {
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.setValueAtTime(440, now + 0.15);
      osc.frequency.setValueAtTime(554, now + 0.3);
      g.gain.setValueAtTime(0.08, now);
      g.gain.linearRampToValueAtTime(0.04, now + 0.6);
      g.gain.linearRampToValueAtTime(0, now + 1.2);
    }
    osc.start(); osc.stop(now + (type === 'fanfare' ? 1.2 : 0.1));
  },

  playToolAction(toolId: string | null) {
    if (!this.ctx || !this.soundEnabled) return;
    const now = this.ctx.currentTime;

    if (toolId === 'axe') {
      const noise = this.ctx.createBufferSource();
      const bufferSize = this.ctx.sampleRate * 0.1;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 1;

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.1, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      noise.connect(filter);
      filter.connect(g);
      g.connect(this.ctx.destination);
      noise.start();
    } else if (toolId === 'pickaxe') {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
      g.gain.setValueAtTime(0.08, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(g); g.connect(this.ctx.destination);
      osc.start(); osc.stop(now + 0.15);
    } else if (toolId?.includes('sword')) {
      const noise = this.ctx.createBufferSource();
      const bufferSize = this.ctx.sampleRate * 0.2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2000, now);
      filter.frequency.exponentialRampToValueAtTime(8000, now + 0.1);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.05, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      noise.connect(filter);
      filter.connect(g);
      g.connect(this.ctx.destination);
      noise.start();
    } else if (toolId === 'bow') {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
        g.gain.setValueAtTime(0.1, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(g); g.connect(this.ctx.destination);
        osc.start(); osc.stop(now + 0.2);
    }
  },

  playHostileAttack() {
    if (!this.ctx || !this.soundEnabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(40, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.4);
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(g); g.connect(this.ctx.destination);
    osc.start(); osc.stop(now + 0.5);
  },

  playGather(type: EntityType, toolId: string | null = null) {
    if (!this.ctx || !this.soundEnabled) return;
    const now = this.ctx.currentTime;
    
    this.playToolAction(toolId);

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.connect(g); g.connect(this.ctx.destination);

    const rand = (min: number, max: number) => Math.random() * (max - min) + min;

    if (type.startsWith('tree')) {
      osc.type = 'triangle';
      const baseFreq = rand(110, 140);
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.2);
      g.gain.setValueAtTime(0.25, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    } else if (type.startsWith('rock')) {
      osc.type = 'triangle';
      const baseFreq = rand(140, 190);
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      g.gain.setValueAtTime(0.35, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(rand(200, 280), now);
      g.gain.setValueAtTime(0.12, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    }

    osc.start(); osc.stop(now + 0.3);
  },

  playFootstep(terrain: TileType, volume: number) {
    if (!this.ctx || !this.soundEnabled || this.ctx.state === 'suspended' || terrain === 'snow_tile') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.connect(g); g.connect(this.ctx.destination);
    osc.frequency.setValueAtTime(80, now);
    g.gain.setValueAtTime(Math.min(0.025, volume * 0.12), now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    osc.start(); osc.stop(now + 0.15);
  },

  playBuild() {
    if (!this.ctx || !this.soundEnabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.linearRampToValueAtTime(50, now + 0.1);
    g.gain.setValueAtTime(0.1, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(g); g.connect(this.ctx.destination);
    osc.start(); osc.stop(now + 0.15);
  },

  play(type: 'click' | 'gather' | 'craft' | 'eat' | 'step' | 'build') {
    if (type === 'click') this.playUI('click');
    else if (type === 'craft') this.playUI('fanfare');
    else if (type === 'gather') this.playGather('bush_berry');
    else if (type === 'eat') this.playGather('bush_berry');
    else if (type === 'build') this.playBuild();
  }
};
