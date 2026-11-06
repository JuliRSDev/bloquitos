import { vibrate } from './haptics.js';

/**
 * Maps game events to sound, vibration, particles and on-screen messages.
 * @param {{ audio: import('./audio.js').AudioEngine, renderer: import('./renderer.js').BoardRenderer,
 *           ui: import('./ui.js').Ui, getGame: () => import('./game.js').Game,
 *           onGameOver: (data: { score: number, lines: number, level: number }) => void }} deps
 */
export function createEventHandler({ audio, renderer, ui, getGame, onGameOver }) {
  return (type, data) => {
    switch (type) {
      case 'move':
        audio.play('move');
        break;
      case 'rotate':
        audio.play('rotate');
        break;
      case 'hold':
        audio.play('hold');
        vibrate(12);
        break;
      case 'lock':
        audio.play('lock');
        break;
      case 'harddrop':
        audio.play('harddrop');
        renderer.dust(data.cells);
        vibrate(18);
        if (data.distance > 3) ui.shake();
        break;
      case 'clear':
        audio.play('clear', data);
        renderer.burstRows(getGame().board, data.rows, data.lines);
        ui.announceClear(data);
        vibrate(data.lines >= 4 ? [30, 40, 60] : 30);
        if (data.lines >= 4) ui.shake();
        break;
      case 'tspin':
        audio.play('tspin');
        ui.callout('T-Spin', 'big');
        break;
      case 'levelup':
        audio.play('levelup');
        audio.setLevel(data.level);
        ui.callout(`Nivel ${data.level}`, 'level');
        break;
      case 'gameover':
        audio.stopMusic();
        audio.play('gameover');
        vibrate([80, 60, 160]);
        onGameOver(data);
        break;
      default:
        break;
    }
  };
}
