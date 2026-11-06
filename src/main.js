import { Game } from './game.js';
import { BoardRenderer } from './renderer.js';
import { PreviewCanvas } from './preview.js';
import { Ui } from './ui.js';
import { AudioEngine } from './audio.js';
import { InputController } from './input.js';
import { bindKeyboard, bindTouch } from './bindings.js';
import { createEventHandler } from './effects.js';
import { setHapticsEnabled, vibrate } from './haptics.js';
import { loadBest, loadSettings, saveBest, saveSettings } from './storage.js';

const NEXT_COUNT = 3;
const MAX_FRAME_MS = 100;

const ui = new Ui();
const settings = loadSettings();
const audio = new AudioEngine(settings);
const renderer = new BoardRenderer(document.getElementById('board'));
const holdView = new PreviewCanvas(document.getElementById('hold'));
const nextView = new PreviewCanvas(document.getElementById('next'));
let best = loadBest();

const game = new Game({
  onEvent: createEventHandler({
    audio, renderer, ui,
    getGame: () => game,
    onGameOver: showGameOver,
  }),
});

const input = new InputController({
  move: (dx) => game.move(dx),
  rotate: (dir) => game.rotate(dir),
  softDrop: (on) => game.setSoftDrop(on),
  hardDrop: () => game.hardDrop(),
  hold: () => game.holdPiece(),
  pause: togglePause,
});

function dedication() {
  const name = new URLSearchParams(location.search).get('para')?.trim().slice(0, 30);
  return name ? `Hecho con cariño para ${name} ♥` : 'Hecho con cariño ♥';
}

function showStart() {
  ui.showOverlay({
    title: 'Bloquitos',
    text: dedication(),
    help: true,
    primary: { label: 'Jugar', onClick: startGame },
  });
}

function startGame() {
  audio.unlock();
  game.start();
  ui.hideOverlay();
  audio.setLevel(1);
  audio.startMusic();
}

function showGameOver({ score, lines, level }) {
  const isRecord = score > best;
  if (isRecord) {
    best = score;
    saveBest(best);
  }
  ui.showOverlay({
    title: isRecord ? '¡Nuevo récord!' : 'Fin del juego',
    text: isRecord ? 'Lo hiciste increíble ♥' : 'Sigue intentando, ¡tú puedes!',
    stats: [`Puntos: ${score.toLocaleString('es')}`, `Líneas: ${lines}`, `Nivel: ${level}`],
    primary: { label: 'Jugar de nuevo', onClick: startGame },
  });
}

function resume() {
  game.togglePause();
  ui.hideOverlay();
  audio.startMusic();
}

function togglePause() {
  if (game.status === 'paused') {
    resume();
    return;
  }
  if (game.status !== 'playing') return;
  game.togglePause();
  audio.stopMusic();
  ui.showOverlay({
    title: 'Pausa',
    primary: { label: 'Continuar', onClick: resume },
    secondary: { label: 'Reiniciar', onClick: startGame },
  });
}

function refreshToggles() {
  ui.setToggle(ui.els.sound, settings.sound, 'Silenciar sonido', 'Activar sonido', settings.sound ? '🔊' : '🔇');
  ui.setToggle(ui.els.music, settings.music, 'Quitar música', 'Poner música', '♪');
  setHapticsEnabled(settings.sound);
}

function bindToggles() {
  ui.els.sound.addEventListener('click', (e) => {
    settings.sound = !settings.sound;
    audio.unlock();
    audio.setSound(settings.sound);
    saveSettings(settings);
    refreshToggles();
    e.currentTarget.blur();
  });
  ui.els.music.addEventListener('click', (e) => {
    settings.music = !settings.music;
    audio.unlock();
    audio.setMusic(settings.music);
    saveSettings(settings);
    refreshToggles();
    e.currentTarget.blur();
  });
}

let lastFrame = performance.now();
function frame(now) {
  const dt = Math.min(now - lastFrame, MAX_FRAME_MS);
  lastFrame = now;
  input.update(dt);
  game.update(dt);
  renderer.render(game, dt);
  ui.renderHud(game, best);
  nextView.draw(game.upcoming(NEXT_COUNT));
  holdView.draw(game.holdType ? [game.holdType] : [], !game.canHold);
  requestAnimationFrame(frame);
}

function handleResize() {
  renderer.resize();
  holdView.resize();
  nextView.resize();
}

bindKeyboard(input, () => ui.isOverlayOpen());
bindTouch(input, () => vibrate(8));
bindToggles();
refreshToggles();
new ResizeObserver(handleResize).observe(document.getElementById('app'));
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.status === 'playing') togglePause();
});
showStart();
requestAnimationFrame(frame);
