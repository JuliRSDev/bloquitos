// Original chiptune loop in A minor. 0 = rest, other values are MIDI notes. Eight steps per bar.
const LEAD = [
  [76, 0, 72, 74, 76, 0, 74, 72],
  [69, 0, 72, 77, 76, 0, 72, 69],
  [67, 72, 76, 79, 76, 72, 76, 0],
  [74, 0, 71, 67, 71, 74, 0, 0],
  [81, 0, 76, 0, 72, 0, 76, 0],
  [77, 0, 72, 0, 69, 72, 77, 0],
  [79, 0, 76, 0, 72, 0, 76, 79],
  [74, 76, 74, 71, 67, 0, 71, 74],
];
const BASS = [45, 41, 48, 43, 45, 41, 48, 43];

const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class MusicPlayer {
  /** @param {AudioContext} ctx @param {AudioNode} destination */
  constructor(ctx, destination) {
    this.ctx = ctx;
    this.destination = destination;
    this.timer = null;
    this.step = 0;
    this.nextTime = 0;
    this.tempo = 1;
  }

  setTempo(multiplier) {
    this.tempo = multiplier;
  }

  start() {
    if (this.timer !== null) return;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), 40);
  }

  stop() {
    if (this.timer === null) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  schedule() {
    const stepDuration = 60 / 150 / 2 / this.tempo;
    while (this.nextTime < this.ctx.currentTime + 0.2) {
      const bar = Math.floor(this.step / 8) % LEAD.length;
      const inBar = this.step % 8;
      const lead = LEAD[bar][inBar];
      if (lead) this.note(midiToHz(lead), this.nextTime, stepDuration * 1.6, 'square', 0.1);
      if (inBar % 2 === 0) this.note(midiToHz(BASS[bar]), this.nextTime, stepDuration * 1.8, 'triangle', 0.28);
      if (inBar === 4) this.note(midiToHz(BASS[bar] + 12), this.nextTime, stepDuration, 'sine', 0.12);
      this.nextTime += stepDuration;
      this.step++;
    }
  }

  note(freq, time, duration, type, volume) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(gain).connect(this.destination);
    osc.start(time);
    osc.stop(time + duration + 0.02);
  }
}
