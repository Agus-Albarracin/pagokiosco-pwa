# Cobertura y verificación

La versión actual usa búsqueda local por marca y nombre. No incluye scanner,
permisos de cámara ni catálogos externos. Las reglas vigentes están en
[AGENTS.md](../AGENTS.md) y la estructura en
[FEATURE-ARCH-TARGET.md](architecture/FEATURE-ARCH-TARGET.md).

## Cobertura actual

| Área                                                                   | Evidencia                                                                                    |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Búsqueda parcial, tildes, marca y orden de palabras                    | `entities/product/search.test.ts` y `tests/e2e/local-search.spec.ts`                         |
| Validación de productos y precisión del stock                          | `entities/product/model.test.ts` y `tests/integration/weight.test.ts`                        |
| Margen, precio comercial e inversa                                     | `features/inventario/pricing.test.ts` y pruebas POS                                          |
| Persistencia, compatibilidad de marca y reposición concurrente         | `tests/integration/storage.test.ts`, `stock.test.ts` y `product-persistence.test.ts`         |
| Checkout atómico, idempotencia y concurrencia                          | `tests/integration/sales.test.ts`                                                            |
| Caja vacía y consolidación de ventas                                   | `features/caja/summary.test.ts`, `tests/integration/sales.test.ts` y `tests/e2e/pos.spec.ts` |
| Peso, merma y compatibilidad IndexedDB v1/v2                           | `tests/integration/weight.test.ts`, `weight-migration.test.ts` y `tests/e2e/weight.spec.ts`  |
| Separación de catálogo y stock; conservación del carrito al navegar    | `tests/e2e/catalog-stock.spec.ts` y `tests/e2e/pos.spec.ts`                                  |
| Operación offline, instalación y ausencia de cámara/servicios externos | `tests/e2e/pwa.spec.ts`                                                                      |
| Límites de arquitectura y APIs públicas                                | `scripts/eslint-architecture.mjs` y `tests/integration/architecture.test.mjs`                |

## Última verificación funcional

Tras la separación por funcionalidades del 24 de septiembre de 2026:

- Formato, ESLint y TypeScript aprobados.
- 11 pruebas de lógica e integración aprobadas.
- Build de producción aprobado, con generación de iconos y service worker.
- Playwright: 19 escenarios aprobados en escritorio y móvil; 1 omitido en
  escritorio porque comprueba navegación táctil exclusiva de móvil.

## Reproducir las comprobaciones

```powershell
npm run format:check
npm run lint
npm test
npm run build
npm run typecheck
npx playwright install chromium
npm run test:e2e
```

Playwright usa el build de producción y administra el servidor del puerto 3107.
Las capturas y trazas se generan en `test-results/` y no se versionan.

## Comprobaciones en un dispositivo físico

1. Instalar desde HTTPS en Android o iOS y verificar iconos y orientación.
2. Esperar la preparación offline, activar modo avión y volver a abrir la app.
3. Crear productos, vender por unidad y peso, registrar merma y verificar caja.
4. Contrastar gramos e importes con una balanza independiente y ventas conocidas.

Pixel 7 emulado no sustituye al dispositivo físico. Los eventos de instalación
se simulan y el peso se ingresa manualmente; no hay integración con una balanza.
