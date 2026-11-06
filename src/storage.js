const BEST_KEY = 'bloquitos.best';
const SETTINGS_KEY = 'bloquitos.settings';

const DEFAULT_SETTINGS = { sound: true, music: true };

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // private mode / blocked storage: the game still works, just without persistence
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore, see read()
  }
}

export function loadBest() {
  const value = Number(read(BEST_KEY));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function saveBest(score) {
  write(BEST_KEY, String(score));
}

export function loadSettings() {
  try {
    const parsed = JSON.parse(read(SETTINGS_KEY) ?? '{}');
    return {
      sound: typeof parsed.sound === 'boolean' ? parsed.sound : DEFAULT_SETTINGS.sound,
      music: typeof parsed.music === 'boolean' ? parsed.music : DEFAULT_SETTINGS.music,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  write(SETTINGS_KEY, JSON.stringify(settings));
}
