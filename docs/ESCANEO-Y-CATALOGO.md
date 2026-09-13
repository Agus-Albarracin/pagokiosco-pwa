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
- Catálogo: buscador, precios, existencias e indicadores. Solo consulta, sin acciones
  de alta, edición o reposición, incluso cuando está vacío.
- Agregar stock: escaneo principal para altas y reposiciones; búsqueda de productos
  existentes y alta sin código como alternativas.
- Altas y edición de datos se concentran en Agregar stock. El escaneo desde Vender
  agrega productos locales a la venta; un código desconocido indica dónde cargarlo.
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

## Publicación manual y PR

Base remota ya integrada: `origin/main` en `483276d`.
Las dos ramas nuevas están pendientes de push; no hace falta subir las ramas anteriores.

Ejecutar en PowerShell, en este orden (no requiere cambiar de rama):

```powershell
git -C "C:\Users\Agust\Desktop\pagokiosco" push -u origin feat/alta-por-escaneo
git -C "C:\Users\Agust\Desktop\pagokiosco" push -u origin feat/catalogo-agregar-stock
```

| Rama | Base del PR | Título propuesto |
| --- | --- | --- |
| `feat/alta-por-escaneo` | `main` | Alta y reposición de productos por escaneo |
| `feat/catalogo-agregar-stock` | `feat/alta-por-escaneo` | Separar Catálogo y Agregar stock con navegación deslizable |

El segundo PR puede revisarse con esa base para ver solo su cambio. Después de
integrar el primero, cambiar la base del segundo a `main` y revisar su diff.
Usar **Create a merge commit** conserva los commits pequeños y la relación entre ramas.

### Descripción del primer PR

Nuevo producto abre la cámara y consulta el nombre antes del alta. Un código ya
guardado abre una confirmación de unidades; la reposición suma stock de forma
atómica sin modificar precios. La carga manual sigue disponible si falta el
producto en el proveedor, no hay red o el artículo no tiene código.

Validación: 9 pruebas unitarias, 16 E2E, lint, TypeScript y build correctos.
Incluye decodificación con ZXing desde MediaStream sintético y cierre de cámara.

### Descripción del segundo PR

Deja Catálogo como consulta de precios y disponibilidad, y concentra altas,
edición y reposiciones en Agregar stock con el escáner como acción principal. La navegación
móvil permite deslizar entre Vender, Catálogo, Agregar stock y Caja, conservando
el carrito al cambiar de sección.

Validación: 9 pruebas unitarias, 19 E2E, lint y build correctos; el gesto móvil se
omite en escritorio. Capturas revisadas en ambas resoluciones. Pendiente probar
cámara física y actualización de la PWA tras el despliegue.

## Corrección de alcance de PLAN-07

Se quitaron los atajos Nuevo producto de Vender y Catálogo a pedido del usuario.
También se retiraron el alta del catálogo vacío y su edición de productos.
La edición se conserva en los resultados de búsqueda de Agregar stock.
Vender consulta únicamente los productos locales y, si falta un código, informa
que debe cargarse desde Agregar stock sin abrir el formulario ni consultar el proveedor.
El escaneo y autocompletado de nombres continúan en Agregar stock.
La corrección continúa en la misma rama, sobre el commit previo `2cae684`.

Verificación de la corrección: build y lint correctos. Pasaron 13 E2E en la primera
ejecución; 6 casos tenían un selector que también coincidía con el título de la
sección. Se acotó al diálogo y los 6 pasaron al repetirlos. Total: 19 E2E correctos
y el gesto móvil omitido en escritorio. Se revisó la captura móvil del catálogo
sin botones de alta ni edición.
