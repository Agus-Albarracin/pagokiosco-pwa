# Catálogo local por marca y producto

## Decisión vigente

PLAN-SEARCH reemplaza el scanner por un buscador escrito sobre el catálogo local de cada comercio. Se retira el scanner por completo, junto con ZXing, su sonido, la evaluación de fotogramas y el proxy de Open Food Facts. No hay consultas a GS1 ni a otro catálogo externo.

Repositorio: `pagokiosco-pwa`. Rama: `feat/busqueda-marca-producto`. Base: `perf/fotogramas-escaneo`, commit `ff879c9`, cuya versión del lector se reemplaza. No hay dependencia con la rama del informe de investigación.

## Reglas y comportamiento

- **Vender:** buscar por marca o nombre, seleccionar un producto local y confirmar la venta como antes. Sin altas desde esta sección.
- **Catálogo:** búsqueda, precio y disponibilidad; solo consulta.
- **Agregar stock:** buscar, reponer y editar productos; crear productos si todavía no están cargados.
- Búsqueda con palabras parciales, en cualquier orden, ignorando mayúsculas, tildes y espacios extra. Todas las palabras deben coincidir. Ejemplo: `AGUI cafe` encuentra `Café molido`, marca `Águila`.
- La marca es opcional, de hasta 80 caracteres. Un producto sin marca sigue siendo válido, especialmente para artículos sueltos y registros anteriores.
- Las nuevas altas generan un SKU interno sin pedir código de barras. La clave persistida sigue llamándose `ean` por compatibilidad con los productos, carritos y ventas existentes. Los datos existentes no se borran ni se renumeran.
- La búsqueda normalizada se prepara una vez por actualización del catálogo. Cada pulsación filtra ese índice en memoria, sin llamadas de red ni permisos de cámara.
- IndexedDB continúa siendo local al dispositivo y al origen. Este cambio no agrega base en la nube, cuentas ni sincronización entre comercios o dispositivos.

## Implementación

1. `entities/product`, `features/inventario/save-product.ts` e `infrastructure/indexeddb.ts`: marca opcional, persistencia compatible y búsqueda compartida. La reposición y las ventas conservan marca e identificador. Una edición antigua que omita la marca no la borra.
2. Componentes de venta, catálogo, stock y formulario: búsqueda como entrada principal, marca visible y alta sin código. Se eliminan los accesos a cámara y la consulta de nombres remotos.
3. Se retiran módulos, dependencia, estilos y pruebas exclusivos del scanner/proxy. Las pruebas de caja, stock, persistencia, instalación y operación offline se adaptan al flujo escrito.
4. `AGENTS.md` pasa a v2.1 y README documenta el flujo vigente. Las reglas locales de negocio que ya estaban en AGENTS.md se conservan, actualizando identificación y catálogo; el resto del contrato financiero y offline permanece vigente.

## Verificación

Las solicitudes de ejecutar `npm test` y `npm run typecheck` fueron rechazadas durante esta tarea. Por ello no se informa que las nuevas pruebas, lint, tipos, build o E2E hayan pasado. Se revisaron estáticamente los imports, referencias retiradas y cambios de archivos; `git diff --check` no reportó errores de whitespace.

Pruebas preparadas:

- Unitarias: normalización, marca y nombre combinados, registros sin marca, persistencia de marca durante edición/reposición y validación de longitud.
- E2E: alta sin código, búsqueda por marca y nombre, edición de marca, reposición, catálogo de solo lectura, venta/caja, búsqueda offline y ausencia de solicitudes de cámara o catálogo externo.

Cuando se autorice verificar, ejecutar:

```powershell
npm test
npm run lint
npm run build
npm run typecheck
npm run test:e2e
```

El build debe preceder al chequeo de tipos porque `.next/types` todavía puede contener referencias generadas a la ruta eliminada `/api/products`. No se modifican manualmente esos archivos generados.

Probar después en el Samsung A15: crear un producto con marca, buscar usando fragmentos y sin tildes, reponer stock, vender y repetir sin conexión. Para recibir esta versión de la PWA es necesario reconstruir/publicar los assets y cerrar las pestañas de la versión anterior.

## Entrega

Los commits separan `feat(catalog): add brand-aware local product search` del reemplazo del flujo y sus reglas, `feat(catalog): replace scanning with local search workflows`. El PR inicial apunta a `perf/fotogramas-escaneo`; una vez integrada esa base, revisar el diff antes de apuntarlo a `main`. No hubo fetch en esta tarea: las referencias remotas locales muestran esa base sincronizada.

Publicación manual, después de completar las verificaciones pendientes:

```powershell
git -C "C:\Users\Agust\Desktop\pagokiosco" push -u origin feat/busqueda-marca-producto
```
