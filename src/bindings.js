const KEY_MAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowDown: 'down', KeyS: 'down',
  ArrowUp: 'rotateCW', KeyW: 'rotateCW', KeyX: 'rotateCW',
  KeyZ: 'rotateCCW', ControlLeft: 'rotateCCW', ControlRight: 'rotateCCW',
  Space: 'hardDrop',
  KeyC: 'hold', ShiftLeft: 'hold', ShiftRight: 'hold',
  KeyP: 'pause', Escape: 'pause',
};

/** @param {import('./input.js').InputController} input @param {() => boolean} isOverlayOpen */
export function bindKeyboard(input, isOverlayOpen) {
  window.addEventListener('keydown', (e) => {
    const action = KEY_MAP[e.code];
    if (!action || e.metaKey || e.altKey) return;
    // While a menu is open only pause/resume is a game key; the rest keeps its native behaviour.
    if (isOverlayOpen() && action !== 'pause') return;
    e.preventDefault();
    if (!e.repeat) input.press(action);
  });
  window.addEventListener('keyup', (e) => {
    const action = KEY_MAP[e.code];
    if (action) input.release(action);
  });
  window.addEventListener('blur', () => input.releaseAll());
}

/** Any element with data-action becomes a touch button. */
export function bindTouch(input, onPress) {
  document.querySelectorAll('[data-action]').forEach((el) => {
    const action = el.dataset.action;
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      el.classList.add('is-down');
      onPress(action);
      input.press(action);
    });
    const release = () => {
      el.classList.remove('is-down');
      input.release(action);
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('lostpointercapture', release);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  });
}
