# Venta por peso y registro de merma

## Alcance

PLAN-PESO · Vender fiambres por peso. Repositorio: pagokiosco-pwa.
Rama: `feat/venta-por-peso`. Base: `feat/busqueda-marca-producto` (`9e2600c`),
necesaria para seleccionar los productos desde el catálogo local sin scanner.
La referencia remota se comparó con los datos guardados localmente, sin fetch.

## Uso

1. En **Agregar stock → Crear producto**, elegir **Por peso (kg)**.
2. Cargar nombre, marca opcional, costo y precio por kilo, y el peso real recibido.
   Por ejemplo: jamón cocido, costo $6.000/kg, precio $10.000/kg y 8,250 kg iniciales.
3. En **Vender**, buscar el producto. Elegir 100/200/300 g o escribir el peso exacto
   indicado por una balanza común. Confirmar el peso lo agrega al carrito.
4. **Cambiar peso** corrige la cantidad total de ese producto en el carrito.
   Seleccionarlo otra vez desde el buscador suma otra porción al mismo producto.
   **Quitar** elimina la línea. El stock se descuenta solo al confirmar la venta.
5. En **Agregar stock**, reponer con **Kilos a agregar**.
6. Para corteza, recortes o descarte, usar **Registrar merma**: gramos y motivo.
   El botón Confirmar merma descuenta stock y guarda fecha y motivo, sin ingresos.

La balanza no está conectada a la aplicación. Los pesos se ingresan manualmente.
El registro de merma se conserva localmente; esta versión no incluye una pantalla
de historial de mermas ni valoración monetaria de las pérdidas.

## Cálculos y compatibilidad

- `stock` y `qty` son gramos enteros para `unidadVenta: 'peso'`; costo y precio
  son por kilo. Para `unidadVenta: 'unidad'` o campo ausente mantienen su significado anterior.
- 8,250 kg son 8250 g. Vender 235 g a $10.000/kg genera $2.350 y deja 8015 g.
- Se aceptan hasta tres decimales en kilos y gramos enteros en venta/merma.
- El precio calculado por margen mantiene el redondeo a $50 por kilo. Cada subtotal
  del carrito se redondea al centavo y se suma con el mismo cálculo en checkout.
- El tipo de venta queda fijo tras crear el producto. No se convierten automáticamente
  los productos existentes, ya que convertir unidades a gramos cambiaría el stock.
- IndexedDB pasa de v1 a v2 agregando `waste`; conserva productos, ventas e índices.
  Las operaciones de merma son atómicas e idempotentes por ID; checkout conserva
  su validación de stock actual, precio, concurrencia y reintentos.
- El catálogo presenta kilos y unidades por separado. Stock bajo: hasta 500 g o
  5 unidades. La caja cuenta productos por línea y conserva los importes históricos.

## Registro de implementación

1. Modelo opcional de unidad de venta, conversión de kilos a gramos y subtotales comunes.
2. Persistencia compatible y registro atómico de merma; pruebas de venta mixta,
   concurrencia, duplicación, cantidades inválidas y falta de stock.
3. Formularios de alta/reposición, selector de peso, edición del carrito y merma.
4. Catálogo y caja adaptados para evitar mezclar gramos con unidades.
5. Prueba de migración desde una base v1 y flujo E2E en escritorio y móvil, incluyendo
   venta, reposición y merma sin conexión y persistencia tras recargar.
6. Reglas actualizadas en AGENTS.md v2.2.

## Verificación

Verificado el 15 de septiembre de 2026:

- `npm test`: 9 pruebas aprobadas, incluida migración v1 → v2 y venta mixta.
- `npm run lint`: aprobado.
- `npm run build`: aprobado; genera la versión PWA con su service worker.
- `npm run typecheck`: aprobado.
- `npm run test:e2e`: 19 pruebas aprobadas y 1 omitida (gesto móvil en escritorio).
  El flujo por peso pasó en Chromium de escritorio y Pixel 7 emulado.
- Capturas móviles del selector de gramos y stock revisadas; sin desborde horizontal.
- `git diff --check`: aprobado.

Las pruebas usaron una balanza simulada mediante entrada manual de gramos, sin
hardware conectado. Queda la comprobación manual en el Samsung A15 físico.

## Commits y entrega

1. `feat(inventory): support weighted sales and atomic waste records`
2. `feat(pos): add weight entry and waste workflows`
3. `docs(inventory): document weighted sales and verification`

La dependencia `feat/busqueda-marca-producto` ya coincide con su referencia remota
guardada localmente; no se requiere repetir ese push según esa comparación.
Push pendiente, manual, desde cualquier ubicación de PowerShell:

```powershell
git -C "C:\Users\Agust\Desktop\pagokiosco" push -u origin feat/venta-por-peso
```

El PR de esta rama apunta inicialmente a `feat/busqueda-marca-producto`.
Integrar primero la dependencia; si ya fue integrada, revisar el diff contra
`main` antes de cambiar el destino. No se publicaron ramas ni PR automáticamente.

Para probar esta versión instalada, reconstruir/publicar la PWA y aceptar su
actualización. Cerrar pestañas de versiones anteriores si bloquean la actualización
de IndexedDB; no borrar el almacenamiento, ya que contiene el inventario y las ventas.
