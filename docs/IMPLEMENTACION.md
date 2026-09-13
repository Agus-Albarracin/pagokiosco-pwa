# Bitácora del MVP

## Alcance y decisiones

PagoKiosco registra ventas; no cobra dinero ni verifica transferencias. Un comercio,
un navegador y una moneda (ARS). IndexedDB es la fuente de verdad local. No hay
cuentas, sincronización ni backend de inventario. El proxy solo sugiere nombres.
El catálogo comienza vacío para evitar mezclar datos ficticios con ventas reales.
Los artículos sin EAN reciben un SKU interno. Se vende por unidades enteras;
los productos pesables se registran mediante importe libre.

## Plan de ramas

Referencias PLAN son propuestas locales para GitHub Projects, no issues publicados.
Base inicial: `master` en `084bb25`. No hay remoto configurado.

| Ítem | Rama | Base | Aceptación |
|---|---|---|---|
| PLAN-01 | feat/inventario-local | master (084bb25) | precios, alta/edición, stock incremental y persistencia |
| PLAN-02 | feat/consulta-ean | feat/inventario-local | proxy mínimo y cámara EAN-8/EAN-13 |
| PLAN-03 | feat/venta-caja | feat/consulta-ean | carrito, venta atómica y resumen por período |
| PLAN-04 | feat/pwa-offline | feat/venta-caja | instalación, operación offline y guía verificable |

Cada base dependiente incorpora funcionalidades utilizadas por el siguiente paso.
Los cambios previos del usuario en AGENTS.md y .agents/ se preservan sin incluirlos.

## PLAN-01 · Dominio

- DTO mínimo, validación de valores finitos, unidades enteras y precio positivo.
- Redondeo comercial a $50, margen inverso con costo cero definido como 0.
- Totales en centavos para reducir errores de coma flotante.
- Pruebas de límites y fórmulas mediante node:test y tsx.

### Persistencia

- IndexedDB v1: productos por EAN/SKU y ventas con índice Unix `createdAt`.
- Alta y reposición leen y escriben stock en una única transacción.
- Se rechazan códigos duplicados y se espera el commit antes de mostrar éxito.
- Prueba con fake-indexeddb verifica dos ingresos concurrentes sin pérdida de stock.

### Interfaz

- Catálogo con búsqueda, stock bajo y formulario accesible en dialog nativo.
- Paleta crema/azul de AGENTS.md, controles de 48px y disposición móvil.
- Márgenes rápidos, edición de precio inversa y preferencia local de margen.
- Tipografía del sistema para no depender de descargas externas al compilar/offline.
- Lint excluye skills vendorizadas y artefactos de prueba.
