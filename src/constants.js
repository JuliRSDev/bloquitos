export const COLS = 10;
export const VISIBLE_ROWS = 20;
export const HIDDEN_ROWS = 2;
export const ROWS = VISIBLE_ROWS + HIDDEN_ROWS;

export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;
export const CLEAR_ANIM_MS = 360;

export const PIECE_TYPES = /** @type {const} */ (['I', 'O', 'T', 'S', 'Z', 'J', 'L']);

export const PIECE_COLORS = {
  I: '#5ee7ff',
  O: '#ffe066',
  T: '#c084fc',
  S: '#6ee7a0',
  Z: '#ff6b8b',
  J: '#6b8cff',
  L: '#ffa94d',
};
