# Alta por escaneo y catálogo separado

## PLAN-06 · Alta y reposición por escaneo

Rama `feat/alta-por-escaneo`, base `origin/main` en `483276d`.
La base incorpora la corrección de Open Food Facts v3 del PR 5.

- Nuevo producto comienza con cámara; código manual y artículos sin código son alternativas.
- Producto nuevo: EAN y nombre sugerido llegan juntos al formulario; confirmar costo, margen y unidades.
- Producto existente: confirmar cantidad en una ficha de reposición, con una unidad inicial.
- La reposición actualiza únicamente stock y fecha dentro de una transacción IndexedDB.
- El escaneo de alta usa una intención diferente a vender, incluso desde la pantalla de venta.
- La cámara se detiene al detectar, cerrar el diálogo o elegir la alternativa manual.

Verificación: 9 pruebas unitarias, lint, TypeScript y build correctos. Las 16 pruebas
E2E pasan en Chromium y móvil emulado. La prueba nueva entrega un EAN-13 dibujado
en un MediaStream a ZXing: identifica `7798113302458`, precarga el nombre de la
respuesta controlada y suma stock sin agregarlo al carrito. La cámara física queda
pendiente de comprobar en el teléfono después del despliegue.

## PLAN-07 · Catálogo y navegación

Rama `feat/catalogo-agregar-stock`, base `feat/alta-por-escaneo` en `8e4fbb6`.
Depende de PLAN-06 porque reutiliza la consulta de nombres, el escáner y la reposición atómica.

- Navegación: Vender, Catálogo, Agregar stock y Caja. En móvil admite desplazamiento
  nativo hacia ambos lados; mantiene visible la opción seleccionada.
- Catálogo: buscador, precios, existencias, indicadores y edición de datos del producto.
  La edición ya no contiene un campo para ingresar stock.
- Agregar stock: escaneo principal para altas y reposiciones; búsqueda de productos
  existentes y alta sin código como alternativas.
- Nuevo producto también abre el escáner desde Vender y Catálogo.
- El carrito se conserva al navegar entre las cuatro secciones.

Verificación: build (incluye TypeScript), lint y 9 pruebas unitarias correctos.
19 E2E correctos; 1 omitido porque el gesto horizontal solo aplica a móvil.
Se comprobó lectura real de ZXing sobre un fotograma sintético, autocompletado,
alta desde Agregar stock, reposición local, precios intactos, carrito al navegar,
persistencia tras recarga, operación offline y desplazamiento táctil en ambos sentidos.
Las capturas de Catálogo y Agregar stock se revisaron en escritorio y Pixel 7 emulado.

## Probar en el celular

1. Publicar e integrar las ramas en orden y esperar el despliegue HTTPS.
2. Cerrar todas las pestañas y la PWA anterior; volver a abrir con conexión para
   activar la nueva versión. No borrar el almacenamiento: ahí están los productos y ventas.
3. Abrir Agregar stock → Escanear producto y conceder permiso de cámara.
4. Escanear un producto nuevo. Si existe en Open Food Facts, el alta muestra su
   nombre sugerido. Completar costo, margen y unidades; guardar.
5. Escanear el mismo producto: debe abrir la cantidad para reponer, conservando el precio.
6. Revisar las existencias en Catálogo y deslizar la navegación para llegar a Caja.

La cámara física, Safari/iOS y el despliegue no se verificaron en este entorno.
