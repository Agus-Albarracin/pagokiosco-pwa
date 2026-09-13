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

## PLAN-07 · Catálogo y navegación

Propuesto: `feat/catalogo-agregar-stock`, dependiente de PLAN-06 por el flujo de escaneo.
Separar Vender, Catálogo, Agregar stock y Caja. Navegación táctil horizontal en móvil.
El catálogo permite consultar y editar; Agregar stock concentra altas y reposiciones.
