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
