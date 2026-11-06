const DAS_MS = 160; // delay before a held direction starts repeating
const ARR_MS = 45; // repeat interval

/**
 * Turns press/release of abstract actions (from keyboard or touch) into game calls,
 * including auto-repeat for left/right.
 * @param {{ move: (dx: number) => void, rotate: (dir: 1 | -1) => void, softDrop: (on: boolean) => void,
 *           hardDrop: () => void, hold: () => void, pause: () => void }} actions
 */
export class InputController {
  constructor(actions) {
    this.actions = actions;
    this.dirs = [];
    this.dasTimer = 0;
    this.repeating = false;
  }

  press(action) {
    switch (action) {
      case 'left':
      case 'right':
        if (this.dirs.includes(action)) return;
        this.dirs.push(action);
        this.resetRepeat();
        this.actions.move(action === 'left' ? -1 : 1);
        break;
      case 'down': this.actions.softDrop(true); break;
      case 'rotateCW': this.actions.rotate(1); break;
      case 'rotateCCW': this.actions.rotate(-1); break;
      case 'hardDrop': this.actions.hardDrop(); break;
      case 'hold': this.actions.hold(); break;
      case 'pause': this.actions.pause(); break;
      default: break;
    }
  }

  release(action) {
    if (action === 'left' || action === 'right') {
      this.dirs = this.dirs.filter((d) => d !== action);
      this.resetRepeat();
    } else if (action === 'down') {
      this.actions.softDrop(false);
    }
  }

  releaseAll() {
    this.dirs = [];
    this.resetRepeat();
    this.actions.softDrop(false);
  }

  resetRepeat() {
    this.dasTimer = 0;
    this.repeating = false;
  }

  update(dt) {
    const dir = this.dirs[this.dirs.length - 1];
    if (!dir) return;
    this.dasTimer += dt;
    if (!this.repeating) {
      if (this.dasTimer < DAS_MS) return;
      this.repeating = true;
      this.dasTimer -= DAS_MS;
    }
    const dx = dir === 'left' ? -1 : 1;
    while (this.dasTimer >= ARR_MS) {
      this.actions.move(dx);
      this.dasTimer -= ARR_MS;
    }
  }
}
