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

## Comprobaciones

Las pruebas unitarias cubren frecuencia, duplicados, vídeo no disponible, cancelación, errores y fallback. Las pruebas de navegador utilizan imágenes EAN reales en un MediaStream de canvas para comprobar ZXing, el camino sin `requestVideoFrameCallback`, cambios de imagen, el límite entre intentos y la liberación de cámara al cerrar.

Estas comprobaciones no sustituyen pruebas de enfoque o batería en un teléfono físico. Antes de ajustar el máximo, comparar lecturas con buena y poca luz en los celulares disponibles, separando el tiempo de lectura del código del tiempo de consulta del nombre.

Referencia de la API: [MDN: requestVideoFrameCallback](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback).
