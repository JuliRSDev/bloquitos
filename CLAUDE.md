# Bloquitos — contexto del proyecto

Juego de bloques que caen, hecho como regalo para la novia del dueño (dedicatoria "Para mi niña 💗"). Se juega sobre todo en **celular, en vertical**. Publicado en GitHub Pages: https://julirsdev.github.io/bloquitos/ (repo `JuliRSDev/bloquitos`, rama `main`; cada push a `main` se publica solo).

Idea a futuro: convertirlo en app propia para Play Store / App Store, con mecánicas distintas a Tetris (ver "Hoja de ruta" y "Propiedad intelectual").

## Comandos

```
npm start   # servidor local http://localhost:5173 (scripts/serve.js)
npm test    # node --test "test/*.test.js" (26 tests, sin dependencias)
node scripts/make-icons.js   # regenera los PNG de icons/ (mismo dibujo que icons/icon.svg)
```

No hay typecheck, lint ni build: es JavaScript puro con módulos ES, sin dependencias. No agregar dependencias sin preguntar.

## Arquitectura (src/)

Lógica pura, sin DOM, cubierta por tests:
- `constants.js` — tamaño del tablero (10x20 visibles + 2 ocultas), tiempos, colores.
- `pieces.js` — formas, rotaciones y tablas de wall kicks SRS (y hacia abajo en coordenadas de tablero).
- `board.js` — colisión, bloqueo, líneas completas, caída, chequeo de T-spin (3 esquinas).
- `bag.js` — randomizador 7-bag (acepta `rng` para tests deterministas).
- `scoring.js` — puntos, niveles, gravedad, combos, back-to-back.
- `game.js` — máquina de estados (`Game`). No toca el DOM: avisa por `onEvent(type, data)` con `start, move, rotate, hold, lock, harddrop, clear, tspin, levelup, pause, gameover`.

Capa de presentación:
- `main.js` — arranque y cableado (loop, pausa, overlays, ajustes).
- `effects.js` — traduce eventos del juego a sonido, vibración, partículas y mensajes. **Punto de extensión principal** para nuevas mecánicas visuales.
- `renderer.js`, `blocks.js`, `particles.js`, `preview.js` — canvas del tablero, bloques, partículas, hold/siguiente.
- `ui.js` — todo el DOM (HUD, overlays, mensajes). El juego nunca toca la página.
- `input.js` — acciones abstractas con auto-repeat (DAS 160 ms / ARR 45 ms). `bindings.js` — teclado y botones táctiles (`data-action`).
- `audio.js`, `music.js` — sonido y música sintetizados con Web Audio (sin archivos). `haptics.js` — vibración. `storage.js` — récord y ajustes en localStorage (con try/catch).

CSS: `css/style.css` (layout mobile-first, media query de escritorio al final) y `css/touch.css` (botones táctiles).

## Decisiones tomadas

- **Mobile-first**: tablero con altura `--board-h` calculada con `100dvh - --chrome-h`; ajustar `--chrome-h` si cambia el alto del HUD o de los botones.
- **Original a propósito**: nombre, arte, música y textos son propios; no se usa la marca ni la melodía de Tetris.
- **Lógica separada del DOM** para poder testearla y reutilizarla (p. ej. al envolver la app para tiendas).
- Dedicatoria: `DEFAULT_RECIPIENT` en `main.js`; `?para=Nombre` la sobrescribe (se escribe con `textContent`, nunca `innerHTML`).
- Archivos de código < 300 líneas, una responsabilidad por archivo.

## Pendientes y rarezas conocidas

- No probado en celular real (solo emulación en Chrome). Sonido y vibración sin verificar.
- En pruebas automáticas, el botón de sonido/música cambió de estado solo dos veces; no se reprodujo con teclado ni clics. Probablemente del entorno de prueba; vigilar en dispositivo real.
- Sin service worker: no funciona sin internet y la fuente (Google Fonts) se carga de la red.
- El efecto visual de limpiar línea solo está validado por tests, no visto en pantalla.
- Orientación horizontal en celular no está optimizada.

## Plan acordado con el dueño (decidido el 2026-11-05)

**Regla principal: esta versión NO se modifica.** Es el regalo para la novia y debe seguir funcionando igual en https://julirsdev.github.io/bloquitos/. Aproximadamente en una semana (≈ 2026-11-12) se hace una **copia del proyecto** (carpeta/repo nuevo, p. ej. `bloquitos-app`) y todas las mejoras para tiendas se hacen ahí. No hacer cambios de funcionalidad aquí salvo que el dueño lo pida expresamente.

Decisiones para la versión de tiendas (la copia):
1. **Mecánica propia: poderes por combos.** Al hacer combos o cuádruples se ganan poderes (ideas: bomba, congelar el tiempo, borrar una fila, cambiar la pieza). Encaja en la arquitectura actual: la lógica va en `game.js`/módulo nuevo (con tests), los efectos visuales/sonoros en `effects.js`. Otras ideas descartadas por ahora, para considerar después: modo aventura con mundos/jefes, piezas con formas propias, retos diarios.
2. **Empaquetado: Capacitor** sobre la misma web app (Android + iOS). Agrega dependencias (`@capacitor/*`); el dueño ya aprobó Capacitor, pero confirmar versiones/plugins concretos antes de instalar. Pendiente: cuentas de desarrollador (Google Play: pago único; Apple: pago anual, y compilar iOS requiere Mac o un servicio de build en la nube), iconos y capturas por tienda, política de privacidad, clasificación de contenido.
3. **Monetización por fases:** primero **gratis y sin anuncios**; cuando tenga muchas descargas, recién ahí anuncios y otras formas de monetizar. Mientras tanto no integrar SDK de anuncios ni compras.

Otros pendientes para la versión de tiendas:
- Mejorar "mucho" el juego en general (pulido visual, animaciones, más sonidos, ajustes, tutorial, estadísticas).
- Service worker + modo offline; empaquetar la fuente en local en vez de Google Fonts.
- Probar en dispositivos reales (sonido, vibración, notch/safe areas, orientación).
- Revisar nombre "Bloquitos" (que no esté registrado) y revisión legal por parecido con Tetris antes de publicar.

## Propiedad intelectual (no es asesoría legal)

Las reglas de un juego no se protegen por derechos de autor, pero la empresa dueña de Tetris ha ganado casos y hace retirar clones de las tiendas por apariencia y "sensación" casi idéntica. Para reducir riesgo: nombre, arte y sonido propios (ya hecho), evitar piezas/colores/UI idénticos a los suyos y añadir mecánicas realmente distintas. Antes de publicar en tiendas conviene una revisión legal y buscar que el nombre no esté registrado.
