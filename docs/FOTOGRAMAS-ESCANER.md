# Fotogramas y frecuencia del escáner

## Alcance

PLAN-SCAN-FRAMES: procesar fotogramas nuevos, regular los intentos por segundo y evaluar la calidad de imagen. Repositorio `pagokiosco-pwa`, rama `perf/fotogramas-escaneo`, base `feat/sonido-escaneo` (`92133a7`). La base conserva el lector vigente, su autoarranque y su sonido; esta tarea no depende del informe documental.

## Planificación de fotogramas

- `lib/scan-frames.ts` solicita notificaciones de nuevos fotogramas con `requestVideoFrameCallback` y deduplica por `presentedFrames`.
- En navegadores sin esa API utiliza `requestAnimationFrame`, deduplicando por el contador de fotogramas de `getVideoPlaybackQuality`. Si tampoco hay estadísticas utilizables, compara `currentTime`: es una aproximación compatible, no una garantía de identidad del fotograma en todos los navegadores antiguos.
- El máximo inicial es **10 intentos por segundo**, definido en `SCAN_ATTEMPTS_PER_SECOND`. Es un límite de procesamiento, no una modificación de los FPS de la cámara ni un rendimiento prometido. Los callbacks demasiado próximos se descartan; no se recuperan en una ráfaga posterior.
- `lib/scan-reader.ts` captura el vídeo una vez y llama al decodificador síncrono de `@zxing/library`. Prueba contraste normal y, solo si falla, contraste invertido sobre los mismos píxeles: hasta dos evaluaciones de polaridad por captura, con un máximo de 10 capturas por segundo. Esto evita depender de la alternancia global de colores del antiguo lector, que fallaba en la primera imagen EAN normal de un stream estático. Cada callback termina antes de solicitar el siguiente. Los fallos normales permiten seguir; un error inesperado libera la cámara y muestra la alternativa manual.
- El ciclo se registra antes de reproducir el vídeo para admitir streams con un único fotograma. Se cancela al aceptar un código o cerrar el escáner y se liberan las pistas, el vídeo y los recursos de ZXing.

El parámetro `300` del antiguo `BrowserMultiFormatReader` regulaba la espera después de lecturas exitosas, no la frecuencia de los intentos fallidos en la versión 0.21.3. El nuevo ciclo reemplaza esa planificación automática, manteniendo EAN-8/EAN-13, el fotograma completo y el sonido existente.

## Evaluación de calidad

`lib/scan-quality.ts` estima brillo, contraste y fuerza de los bordes. Las métricas se calculan sobre una copia del fotograma completo cuyo lado mayor mide como máximo 160 píxeles. Esa reducción sirve solo para evaluar calidad: ZXing continúa leyendo a resolución completa.

`lib/scan-quality-feedback.ts` evalúa como máximo dos veces por segundo, después de un intento fallido. Exige tres muestras consecutivas del mismo estado antes de cambiar la indicación. Mantiene los contadores fuera del estado de React y solo actualiza el mensaje cuando cambia de forma estable.

| Condición aproximada                                        | Indicación                                     |
| ----------------------------------------------------------- | ---------------------------------------------- |
| Al menos 90% de píxeles con luminancia ≤30 y promedio <35   | Buscá más luz para ver el código.              |
| Al menos 90% de píxeles con luminancia ≥240 y promedio >235 | Incliná el envase o buscá menos reflejo.       |
| Desvío de luminancia <12 y gradiente medio <3               | Mostrá las barras y mantené el celular quieto. |
| Recuperación durante tres muestras                          | Apuntá al código EAN de 8 o 13 dígitos.        |

Son heurísticas conservadoras, no un diagnóstico de autofocus. Poco detalle puede significar una superficie lisa, distancia o desenfoque; no se puede distinguir con certeza usando estas métricas. Los umbrales necesitan validación física y las métricas globales pueden omitir problemas locales sobre el código.

La evaluación **no descarta capturas ni demora la primera lectura**. Primero se intenta ZXing; solamente cuando no hay resultado se analiza calidad. Si el análisis no está disponible o falla, la decodificación continúa. Todo se ejecuta en el dispositivo, sin IA, descargas adicionales ni envío de imágenes.

## Comprobaciones

Las pruebas unitarias cubren frecuencia, duplicados, vídeo no disponible, cancelación, errores y fallback. Las pruebas de navegador utilizan imágenes EAN reales en un MediaStream de canvas para comprobar ZXing, el camino sin `requestVideoFrameCallback`, cambios de imagen, el límite entre intentos y la liberación de cámara al cerrar.

Las muestras sintéticas de calidad cubren iluminación extrema, superficies sin textura, barras con fondo blanco, transiciones suaves y ambas orientaciones. Las pruebas de navegador verifican además la recuperación desde una imagen oscura y que un fallo del análisis no bloquee una lectura posterior.

Estas comprobaciones no sustituyen pruebas de enfoque o batería en un teléfono físico. Antes de ajustar el máximo, comparar lecturas con buena y poca luz en los celulares disponibles, separando el tiempo de lectura del código del tiempo de consulta del nombre.

Referencia de la API: [MDN: requestVideoFrameCallback](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback).

## Resultado y entrega

- `npm test`: 22 pruebas aprobadas.
- `npm run typecheck`, `npm run lint` y `npm run build`: aprobados.
- `npm run test:e2e -- tests/e2e/scanner-frames.spec.ts tests/e2e/scan-sound.spec.ts tests/e2e/stock-scanning.spec.ts`: 18 pruebas aprobadas, distribuidas entre Chromium de escritorio y emulación Pixel 7. Incluye lectura normal e invertida, sonido, carga del nombre y stock.
- Commits: `perf(scanner): schedule fresh frames at a bounded scan rate` y `feat(scanner): guide capture with stable image quality feedback`.
- Pendiente: calibración de las heurísticas y evaluación de velocidad/consumo en cámaras físicas; no se afirma una mejora porcentual sin esa medición.

Push manual de esta rama, sin necesidad de cambiar de rama antes:

```powershell
git -C "C:\Users\Agust\Desktop\pagokiosco" push -u origin perf/fotogramas-escaneo
```

Destino inicial del PR: `feat/sonido-escaneo`. Primero integrar sus requisitos en orden: `feat/alta-por-escaneo`, `feat/catalogo-agregar-stock`, `feat/sonido-escaneo` y finalmente esta rama. Cuando la base esté integrada, revisar el diff contra `main` antes de redirigir el PR. Según las referencias remotas guardadas localmente, las tres ramas requisito están sincronizadas; no se realizó un fetch en esta tarea para comprobar cambios posteriores en GitHub.
