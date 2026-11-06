import { MusicPlayer } from './music.js';

const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const CLEAR_ARPEGGIOS = {
  1: [72, 76],
  2: [72, 76, 79],
  3: [72, 76, 79, 84],
  4: [72, 76, 79, 84, 88, 91],
};

/** Everything is synthesized with Web Audio, so there are no audio files to load. */
export class AudioEngine {
  constructor({ sound, music }) {
    this.sound = sound;
    this.musicEnabled = music;
    this.ctx = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.music = null;
    this.wantsMusic = false;
    this.noiseBuffer = null;
  }

  /** Browsers only allow audio after a user gesture, so call this from a click/tap. */
  unlock() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      this.ctx = new AudioContextClass();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain.connect(this.ctx.destination);
      this.musicGain.connect(this.ctx.destination);
      this.music = new MusicPlayer(this.ctx, this.musicGain);
      this.applyVolumes();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  applyVolumes() {
    if (!this.ctx) return;
    this.sfxGain.gain.value = this.sound ? 0.6 : 0;
    this.musicGain.gain.value = this.sound && this.musicEnabled ? 0.5 : 0;
  }

  setSound(on) {
    this.sound = on;
    this.applyVolumes();
  }

  setMusic(on) {
    this.musicEnabled = on;
    this.applyVolumes();
  }

  startMusic() {
    this.wantsMusic = true;
    if (this.music) this.music.start();
  }

  stopMusic() {
    this.wantsMusic = false;
    if (this.music) this.music.stop();
  }

  setLevel(level) {
    if (this.music) this.music.setTempo(Math.min(1 + (level - 1) * 0.04, 1.5));
  }

  tone(freq, start, duration, { type = 'square', volume = 0.2, to = null } = {}) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(this.sfxGain);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  noise(start, duration, volume) {
    if (!this.noiseBuffer) {
      const length = this.ctx.sampleRate * 0.3;
      this.noiseBuffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter).connect(gain).connect(this.sfxGain);
    source.start(start);
    source.stop(start + duration);
  }

  arpeggio(notes, step, options) {
    const now = this.ctx.currentTime;
    notes.forEach((note, i) => this.tone(midiToHz(note), now + i * step, step * 2.2, options));
  }

  play(name, data = {}) {
    if (!this.ctx || !this.sound) return;
    const now = this.ctx.currentTime;
    switch (name) {
      case 'move': this.tone(300, now, 0.03, { type: 'square', volume: 0.05 }); break;
      case 'rotate': this.tone(520, now, 0.06, { type: 'triangle', volume: 0.14, to: 700 }); break;
      case 'lock': this.tone(130, now, 0.09, { type: 'sine', volume: 0.3, to: 70 }); break;
      case 'harddrop':
        this.tone(220, now, 0.14, { type: 'sawtooth', volume: 0.18, to: 50 });
        this.noise(now, 0.12, 0.3);
        break;
      case 'hold': this.arpeggio([67, 74], 0.05, { type: 'triangle', volume: 0.14 }); break;
      case 'clear': this.arpeggio(CLEAR_ARPEGGIOS[data.lines] ?? CLEAR_ARPEGGIOS[1], 0.06, { type: 'square', volume: 0.13 }); break;
      case 'tspin': this.arpeggio([69, 73, 76, 81], 0.05, { type: 'triangle', volume: 0.16 }); break;
      case 'levelup': this.arpeggio([72, 76, 79, 84, 88], 0.07, { type: 'triangle', volume: 0.18 }); break;
      case 'gameover': this.arpeggio([67, 64, 60, 55, 48], 0.16, { type: 'sawtooth', volume: 0.1 }); break;
      default: break;
    }
  }
}
