const $ = (id) => document.getElementById(id);

const CLEAR_NAMES = { 1: 'Sencillo', 2: 'Doble', 3: 'Triple', 4: '¡CUÁDRUPLE!' };

/** All DOM updates live here; the game itself never touches the page. */
export class Ui {
  constructor() {
    this.els = {
      score: $('score'), level: $('level'), lines: $('lines'), best: $('best'),
      overlay: $('overlay'), title: $('overlay-title'), text: $('overlay-text'),
      stats: $('overlay-stats'), help: $('overlay-help'),
      primary: $('overlay-primary'), secondary: $('overlay-secondary'),
      callout: $('callout'), boardWrap: $('board-wrap'),
      pause: $('btn-pause'), sound: $('btn-sound'), music: $('btn-music'),
    };
    this.cache = {};
  }

  isOverlayOpen() {
    return !this.els.overlay.hidden;
  }

  renderHud(game, best) {
    this.setText('score', game.score.toLocaleString('es'));
    this.setText('level', String(game.level));
    this.setText('lines', String(game.lines));
    this.setText('best', Math.max(best, game.score).toLocaleString('es'));
  }

  setText(key, value) {
    if (this.cache[key] === value) return;
    this.cache[key] = value;
    this.els[key].textContent = value;
  }

  /**
   * @param {{ title: string, text?: string, stats?: string[], help?: boolean,
   *           primary: { label: string, onClick: () => void },
   *           secondary?: { label: string, onClick: () => void } }} options
   */
  showOverlay({ title, text = '', stats = [], help = false, primary, secondary }) {
    const { els } = this;
    els.title.textContent = title;
    els.text.textContent = text;
    els.text.hidden = text === '';
    els.stats.replaceChildren(...stats.map((line) => {
      const li = document.createElement('li');
      li.textContent = line;
      return li;
    }));
    els.stats.hidden = stats.length === 0;
    els.help.hidden = !help;
    els.primary.textContent = primary.label;
    els.primary.onclick = primary.onClick;
    els.secondary.hidden = !secondary;
    if (secondary) {
      els.secondary.textContent = secondary.label;
      els.secondary.onclick = secondary.onClick;
    }
    els.overlay.hidden = false;
    els.primary.focus({ preventScroll: true });
  }

  hideOverlay() {
    this.els.overlay.hidden = true;
  }

  callout(text, tone = 'normal') {
    const el = this.els.callout;
    el.textContent = text;
    el.dataset.tone = tone;
    el.classList.remove('is-show');
    void el.offsetWidth; // restart the CSS animation
    el.classList.add('is-show');
  }

  announceClear({ lines, tSpin, combo, backToBack }) {
    const parts = [];
    if (tSpin) parts.push('T-Spin');
    parts.push(CLEAR_NAMES[lines] ?? '');
    if (backToBack) parts.push('· Seguidos ×1.5');
    if (combo > 0) parts.push(`· Combo ×${combo}`);
    this.callout(parts.join(' ').trim(), lines >= 4 || tSpin ? 'big' : 'normal');
  }

  shake() {
    const el = this.els.boardWrap;
    el.classList.remove('is-shaking');
    void el.offsetWidth;
    el.classList.add('is-shaking');
  }

  setToggle(button, on, labelOn, labelOff, icon) {
    button.setAttribute('aria-pressed', String(on));
    button.setAttribute('aria-label', on ? labelOn : labelOff);
    button.dataset.off = String(!on);
    button.textContent = icon;
  }
}
