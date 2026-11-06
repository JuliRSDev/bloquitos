const LINE_POINTS = [0, 100, 300, 500, 800];
const TSPIN_POINTS = [400, 800, 1200, 1600];

export function levelForLines(lines) {
  return Math.floor(lines / 10) + 1;
}

/** Milliseconds a piece takes to fall one row. */
export function gravityMs(level) {
  const l = Math.min(level, 20);
  return Math.max(1000 * Math.pow(0.8 - (l - 1) * 0.007, l - 1), 16);
}

export function scoreTSpinNoLines(level) {
  return TSPIN_POINTS[0] * level;
}

/**
 * @param {{ lines: number, tSpin: boolean, level: number, combo: number, backToBack: boolean }} input
 * `combo` is the number of consecutive clears before this one (0 for the first).
 * @returns {{ points: number, difficult: boolean, backToBackApplied: boolean }}
 */
export function scoreLineClear({ lines, tSpin, level, combo, backToBack }) {
  const base = tSpin ? TSPIN_POINTS[lines] : LINE_POINTS[lines];
  const difficult = lines === 4 || (tSpin && lines > 0);
  const backToBackApplied = difficult && backToBack;
  let points = base * level;
  if (backToBackApplied) points = Math.floor(points * 1.5);
  if (combo > 0) points += 50 * combo * level;
  return { points, difficult, backToBackApplied };
}
