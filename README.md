# Bloquitos

Un juego de bloques que caen, hecho con cariño. HTML, CSS y JavaScript puro: sin dependencias ni build.

## Jugar

Abre la URL publicada. La dedicatoria por defecto es "Para mi niña 💗" (`DEFAULT_RECIPIENT` en `src/main.js`); para otro nombre: `?para=Nombre`.

En el celular: menú del navegador → "Agregar a pantalla de inicio" y se abre como una app.

**Teclado:** `←` `→` mover · `↑` girar · `Z` girar al revés · `↓` bajar · `Espacio` caer · `C` guardar pieza · `P` pausa.
**Celular:** botones en pantalla; toca el recuadro "Guardar" para reservar una pieza.

## Desarrollo

```
npm start   # servidor local en http://localhost:5173
npm test    # tests de la lógica (node:test, sin dependencias)
```

`src/game.js`, `board.js`, `pieces.js`, `bag.js` y `scoring.js` son lógica pura sin DOM (cubierta por tests). El resto es render, input, audio y UI.
