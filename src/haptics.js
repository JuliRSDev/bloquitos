let enabled = true;

export function setHapticsEnabled(on) {
  enabled = on;
}

/** Short vibration on phones that support it (Android). Silently does nothing elsewhere. */
export function vibrate(pattern) {
  if (!enabled || typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(pattern);
}
