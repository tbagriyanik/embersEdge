
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
    filter.frequency.value = 350; // Daha düşük lowpass (rüzgar sesi daha derin)
    
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
        // Tiz olmayan kuş sesleri (1100-1800Hz)
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

  playUI(type: 'hover' | 'click' | 'open' | 'fanfare') {
    if (!this.ctx || !this.soundEnabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.connect(g); g.connect(this.ctx.destination);

    if (type === 'hover') {
      // Daha tok bir hover (600Hz)
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.05);
      g.gain.setValueAtTime(0.02, now);
      g.gain.linearRampToValueAtTime(0, now + 0.05);
    } else if (type === 'click') {
      // Daha tok bir click (500Hz -> 250Hz)
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(250, now + 0.1);
      g.gain.setValueAtTime(0.1, now);
      g.gain.linearRampToValueAtTime(0, now + 0.1);
    } else if (type === 'fanfare') {
      // Daha yumuşak kutlama tonları
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.setValueAtTime(440, now + 0.15);
      osc.frequency.setValueAtTime(554, now + 0.3);
      g.gain.setValueAtTime(0.08, now);
      g.gain.linearRampToValueAtTime(0.04, now + 0.6);
      g.gain.linearRampToValueAtTime(0, now + 1.2);
    }
    osc.start(); osc.stop(now + (type === 'fanfare' ? 1.2 : 0.1));
  },

  playGather(type: EntityType) {
    if (!this.ctx || !this.soundEnabled) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.connect(g); g.connect(this.ctx.destination);

    const rand = (min: number, max: number) => Math.random() * (max - min) + min;

    if (type.startsWith('tree')) {
      // Wood impact (110-140Hz)
      osc.type = 'triangle';
      const baseFreq = rand(110, 140);
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.2);
      g.gain.setValueAtTime(0.25, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      
      // Muted snap (300-500Hz)
      const snap = this.ctx.createOscillator();
      const snapG = this.ctx.createGain();
      snap.type = 'triangle';
      snap.frequency.setValueAtTime(rand(300, 500), now);
      snapG.gain.setValueAtTime(0.04, now);
      snapG.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      snap.connect(snapG); snapG.connect(this.ctx.destination);
      snap.start(); snap.stop(now + 0.08);

    } else if (type.startsWith('rock')) {
      // Deep stone thud (140-190Hz)
      osc.type = 'triangle';
      const baseFreq = rand(140, 190);
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      g.gain.setValueAtTime(0.35, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      // Low clink (500-800Hz)
      const clink = this.ctx.createOscillator();
      const clinkG = this.ctx.createGain();
      clink.type = 'sine';
      clink.frequency.setValueAtTime(rand(500, 800), now);
      clinkG.gain.setValueAtTime(0.06, now);
      clinkG.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      clink.connect(clinkG); clinkG.connect(this.ctx.destination);
      clink.start(); clink.stop(now + 0.1);

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
    // Daha tok ayak sesleri
    osc.frequency.setValueAtTime(80, now);
    g.gain.setValueAtTime(Math.min(0.025, volume * 0.12), now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    osc.start(); osc.stop(now + 0.15);
  },

  play(type: 'click' | 'gather' | 'craft' | 'eat' | 'step') {
    if (type === 'click') this.playUI('click');
    else if (type === 'craft') this.playUI('fanfare');
    else if (type === 'gather') this.playGather('bush_berry');
    else if (type === 'eat') this.playGather('bush_berry');
  }
};
