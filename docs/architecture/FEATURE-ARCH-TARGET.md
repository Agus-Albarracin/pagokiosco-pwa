# Arquitectura por funcionalidades — PagoKiosco

Fecha: 2026-09-24. Base inspeccionada: `73f990690fbc25a5c6a6f923ccb4f57cf12b1eca`,
con el reformateo local pendiente. Propuesta producida con `feature-arch`.

**Estado: separación aprobada, aplicada y verificada.** El usuario confirmó
cuatro funcionalidades separadas: catálogo, inventario, venta y caja. Los nombres
de carpetas mantienen esa terminología. No se crea una carpeta global de contextos.

## 1. Contexto y problemas de la estructura original

- Next.js 16.3.5, App Router y React 19.2.8. La única página es `app/page.tsx`.
- Las cuatro secciones se seleccionan mediante estado local; no son rutas distintas.
- IndexedDB v2 es la fuente persistente del dispositivo. No hay estado remoto,
  sincronización externa ni consultas de productos desde Server Components.
- React Context mantiene el carrito; `useState` mantiene formularios y selección.
- CSS global con Tailwind disponible; Prettier y Stylelint ya configurados.
- Tests con Node, tsx y fake-indexeddb; pruebas de navegador con Playwright.
- `components/kiosk.tsx` mezcla composición, lectura del catálogo, navegación,
  selección de productos y coordinación de tres formularios de inventario.
- `lib/domain.ts` mezcla contratos de producto, líneas de venta, importes y caja.
- `lib/storage.ts` mezcla apertura de la base, lectura y mutación de productos.
- `lib/sales.ts` mezcla checkout, lectura histórica y fechas de cierre.

**Reglas aplicadas:** [struct-feature-folders](../../.agents/skills/feature-arch/references/struct-feature-folders.md),
[struct-app-layer](../../.agents/skills/feature-arch/references/struct-app-layer.md).

## 2. Funcionalidades confirmadas

| Funcionalidad | Responsabilidad                                                    | Evidencia actual                            |
| ------------- | ------------------------------------------------------------------ | ------------------------------------------- |
| `catalogo`    | Buscar y consultar precios y disponibilidad; no modifica productos | RN-01.4 y `components/catalog.tsx`          |
| `inventario`  | Alta, edición, reposición y merma                                  | RN-03/RN-07 y formularios de stock          |
| `venta`       | Carrito, peso, importe libre y checkout atómico                    | RN-05/RN-07 y `pos.tsx`, `cart-context.tsx` |
| `caja`        | Lectura de ventas, cierre diario y métricas                        | RN-05 y `cashbook.tsx`                      |

PWA, navegación y composición pertenecen a la aplicación. Producto y venta
persistida son entidades del negocio, no nuevas funcionalidades de interfaz.

**Reglas aplicadas:** [name-feature-naming](../../.agents/skills/feature-arch/references/name-feature-naming.md),
[bound-feature-size](../../.agents/skills/feature-arch/references/bound-feature-size.md).

## 3. Decisiones de arquitectura

| Decisión     | Elección y motivo                                                         | Alternativa considerada                                              |
| ------------ | ------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Capas        | `app`, `features`, `entities`, `infrastructure`, `shared`                 | Poner todos los contratos en `shared` ocultaría el dominio           |
| Comunicación | Props y callbacks coordinados desde `app`                                 | No se necesita un bus de eventos ni un store global nuevo            |
| Estado       | Mantener Context y estado local                                           | No introducir Zustand o TanStack Query en esta reorganización        |
| Persistencia | IndexedDB v2 y transacciones existentes                                   | Ninguna migración de esquema ni backend nuevo                        |
| API pública  | Un `index.ts` pequeño por funcionalidad; sin barrels internos encadenados | Imports profundos acoplarían consumidores a la estructura interna    |
| Contextos    | Junto a la funcionalidad propietaria                                      | Evitar `contexts/` global como agrupación por tipo técnico           |
| Rutas        | Conservar `/` y las cuatro vistas actuales                                | Crear rutas cambiaría navegación y ciclo de vida                     |
| CSS          | Mantener `app/globals.css` en esta migración                              | Extraer CSS Modules se reserva para otra tarea por riesgo de cascada |

`infrastructure/indexeddb.ts` es una adaptación explícita: contiene el esquema
local del negocio y no se presenta como utilidad genérica en `shared`. Solo abre
la base y ofrece primitivas de transacción; no contiene checkout ni reposición.
`entities` es la capa de contratos de negocio utilizada por más de una funcionalidad.
No se adopta el resto de capas de Feature-Sliced Design.

`shared/lib/money.ts` mantiene `money` y `cents` como utilidades de representación
monetaria del proyecto. Las fórmulas de margen pertenecen a inventario; los
subtotales de peso pertenecen a la entidad venta.

**Reglas aplicadas:** [struct-shared-layer](../../.agents/skills/feature-arch/references/struct-shared-layer.md),
[struct-optional-segments](../../.agents/skills/feature-arch/references/struct-optional-segments.md),
[import-avoid-barrel-files](../../.agents/skills/feature-arch/references/import-avoid-barrel-files.md).

## 4. Árbol objetivo

Rutas relativas a la raíz del repositorio. Se enumeran los archivos de código
afectados; configuraciones, assets, scripts de PWA y documentación existente se
conservan salvo los ajustes explícitos del plan.

```text
app/
  page.tsx
  layout.tsx
  globals.css
  _components/
    kiosk.tsx
    workspace-nav.tsx
    pwa.tsx
  _hooks/
    use-products.ts
features/
  catalogo/
    index.ts
    catalog.tsx
  inventario/
    index.ts
    inventory-workspace.tsx
    stock-entry.tsx
    product-form.tsx
    stock-receipt.tsx
    waste-form.tsx
    save-product.ts
    stock.ts
    pricing.ts
    pricing.test.ts
  venta/
    index.ts
    pos.tsx
    cart-context.tsx
    weight-picker.tsx
    checkout.ts
  caja/
    index.ts
    cashbook.tsx
    list-sales.ts
    summary.ts
    summary.test.ts
entities/
  product/
    index.ts
    model.ts
    model.test.ts
    search.ts
    search.test.ts
    list-products.ts
  sale/
    index.ts
    model.ts
infrastructure/
  indexeddb.ts
shared/
  ui/
    modal.tsx
  lib/
    money.ts
    date.ts
tests/
  integration/
    architecture.test.mjs
    product-persistence.test.ts
    storage.test.ts
    stock.test.ts
    sales.test.ts
    weight.test.ts
    weight-migration.test.ts
  e2e/
    catalog-stock.spec.ts
    local-search.spec.ts
    pos.spec.ts
    pwa.spec.ts
    weight.spec.ts
docs/
  architecture/
    FEATURE-ARCH-TARGET.md
scripts/
  eslint-architecture.mjs
  test.mjs
```

Las funcionalidades son planas mientras su tamaño lo permita. No crear directorios
vacíos `hooks`, `contexts`, `types` o `api` por plantilla. `cart-context.tsx` queda
al lado de `pos.tsx`; sus consumidores siguen siendo internos a venta.

**Reglas aplicadas:** [struct-feature-self-contained](../../.agents/skills/feature-arch/references/struct-feature-self-contained.md),
[struct-flat-hierarchy](../../.agents/skills/feature-arch/references/struct-flat-hierarchy.md),
[struct-optional-segments](../../.agents/skills/feature-arch/references/struct-optional-segments.md).

## 5. APIs públicas exactas

La aplicación importa estos entrypoints. Las funcionalidades no importan otras
funcionalidades, ni siquiera a través de sus APIs públicas.

```ts
// features/catalogo/index.ts
export { Catalog } from "./catalog";

// features/inventario/index.ts
export { InventoryWorkspace } from "./inventory-workspace";

// features/venta/index.ts
export { Pos } from "./pos";
export { CartProvider } from "./cart-context";

// features/caja/index.ts
export { Cashbook } from "./cashbook";
```

`useCart`, `checkout`, `saveProduct`, `addStock`, `recordWaste`, los formularios
y las funciones de caja no se exportan a otras funcionalidades. Las pruebas de
integración pueden importar estos servicios directamente como excepción de tests;
esa excepción no habilita imports profundos en código de producción.

Contratos inferiores:

```ts
// entities/product/index.ts
export type { Product, SaleUnit } from "./model";
export { isWeight, quantityLabel, kilogramsToGrams, validateProduct } from "./model";
export { createProductSearch, normalizeSearch } from "./search";
export { listProducts } from "./list-products";

// entities/sale/index.ts
export type { CartLine, PaymentMethod, Sale } from "./model";
export { lineCents } from "./model";
```

El modelo de venta usa `SaleUnit` e `isWeight` del modelo de producto. Esta
dependencia entre entidades es unidireccional y explícita; producto no importa venta.
La entidad producto ofrece lectura; las escrituras quedan en inventario y checkout.

**Reglas aplicadas:** [import-public-api](../../.agents/skills/feature-arch/references/import-public-api.md),
[bound-interface-contracts](../../.agents/skills/feature-arch/references/bound-interface-contracts.md),
[import-type-only](../../.agents/skills/feature-arch/references/import-type-only.md).

## 6. Matriz de dependencias

Fila importa columna. `via app` significa que no hay import directo y que la
coordinación se realiza por props/callbacks desde aplicación.

| Origen     | catálogo  | inventario | venta   | caja      |
| ---------- | --------- | ---------- | ------- | --------- |
| catálogo   | allowed   | via app    | via app | forbidden |
| inventario | via app   | allowed    | via app | forbidden |
| venta      | via app   | via app    | allowed | via app   |
| caja       | forbidden | forbidden  | via app | allowed   |

| Capa             | Puede importar                                                           | No puede importar                |
| ---------------- | ------------------------------------------------------------------------ | -------------------------------- |
| `app`            | APIs públicas de features y entities, shared                             | Internos de features             |
| `features`       | Archivos propios, entities, infrastructure, shared                       | Otras features, app              |
| `entities`       | Modelos de entidades según dependencia declarada, infrastructure, shared | features, app                    |
| `infrastructure` | APIs del navegador y utilidades genéricas                                | entities, features, app          |
| `shared`         | shared, React y APIs genéricas                                           | Todas las capas de negocio y app |

Configurar controles de importación que contemplen aliases y rutas relativas,
incluidos reexports. No basta con bloquear una única forma de escribir el import.

**Reglas aplicadas:** [import-unidirectional-flow](../../.agents/skills/feature-arch/references/import-unidirectional-flow.md),
[import-no-cross-feature](../../.agents/skills/feature-arch/references/import-no-cross-feature.md),
[bound-feature-isolation](../../.agents/skills/feature-arch/references/bound-feature-isolation.md).

## 7. Propiedad del estado y de los datos

| Propietario                  | Estado local / responsabilidad                                                                       | Persistencia                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------- |
| `app/_hooks/use-products.ts` | Snapshot de productos, loading, error, refresh y listener de focus para las tres vistas consumidoras | Lee mediante `entities/product` |
| `catalogo`                   | Texto de búsqueda; resultados derivados de products                                                  | Solo lectura                    |
| `inventario`                 | Editor, producto a reponer, merma, formularios y sus errores                                         | Mutaciones products/waste       |
| `venta`                      | Carrito en Context, selector de gramos, pago, confirmación y errores                                 | Checkout products/sales         |
| `caja`                       | Período, ventas leídas, cierre, errores y actualización por focus/temporizador                       | Lectura sales                   |
| `app/_components/kiosk.tsx`  | Vista activa y mensaje transversal de resultado                                                      | Ninguna                         |
| `app/_components/pwa.tsx`    | Estado de instalación y conectividad                                                                 | Service worker existente        |

No hay server state: no agregar caché de servidor, fetch remoto o librería de
consultas para representar IndexedDB. El snapshot en `useState` refleja lectura
asíncrona local y es intencional; IndexedDB sigue siendo la fuente de verdad.

El Context del carrito se mantiene: no hay evidencia que justifique sustituirlo.
`CartProvider` pertenece a venta, pero aplicación lo monta de forma estable por
encima de las vistas, conservando el comportamiento actual al navegar. No moverlo
dentro de un condicional que lo desmonte al entrar a catálogo, stock o caja.

`InventoryWorkspace` recibe `products`, `disabled`, `active`, `showSavedNotice`,
`onRefresh` y `onNotice`. `showSavedNotice` conserva la supresión del aviso de
guardado cuando la vista activa es venta, sin importar el estado de navegación.
Es propietario de `editor`, `receipt` y `waste`, actualmente presentes en Kiosk.
Si se mantiene montado al navegar, recibe `active`: oculta solo el contenido de
stock y preserva la vida de los diálogos; no introducir cierres automáticos nuevos.

**Reglas aplicadas:** [fstate-feature-scoped-stores](../../.agents/skills/feature-arch/references/fstate-feature-scoped-stores.md),
[fstate-lift-minimally](../../.agents/skills/feature-arch/references/fstate-lift-minimally.md),
[fstate-context-sparingly](../../.agents/skills/feature-arch/references/fstate-context-sparingly.md).

## 8. Comunicación y transacciones

- Inventario confirma una operación, llama `onRefresh` y publica el texto de
  resultado con `onNotice`; no importa catálogo o venta.
- Venta confirma checkout y llama `onRefresh`; catálogo recibe el nuevo snapshot
  cuando se muestra. Caja consulta las ventas al montarse, al recuperar foco y
  con su temporizador actual.
- `checkout.ts` conserva una única transacción readwrite sobre products y sales.
  No sustituirla por llamadas independientes a servicios de inventario y caja.
- `stock.ts` conserva la transacción conjunta products/waste y la idempotencia.
- La versión de IndexedDB, sus stores, índices y claves persistidas no cambian.
- `app/page.tsx` y `layout.tsx` siguen como Server Components; los controladores,
  formularios, Context y PWA mantienen su frontera cliente.

**Reglas aplicadas:** [fcomp-props-as-data-boundary](../../.agents/skills/feature-arch/references/fcomp-props-as-data-boundary.md),
[bound-interface-contracts](../../.agents/skills/feature-arch/references/bound-interface-contracts.md),
[fquery-colocate-with-feature](../../.agents/skills/feature-arch/references/fquery-colocate-with-feature.md).

## 9. Plan de migración ejecutado

Cada paso incluye actualización de imports afectados. Esfuerzo relativo: S pequeño,
M medio, L grande; no representa una estimación de horas.

| Paso | Acción concreta                                                                                                                                                                                                                                                                          | Esfuerzo |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1    | Separar `lib/domain.ts`: Product/SaleUnit, validación y unidades a `entities/product/model.ts`; CartLine/PaymentMethod/Sale/lineCents a `entities/sale/model.ts`; money/cents a `shared/lib/money.ts`; margen a `features/inventario/pricing.ts`; summarize a `features/caja/summary.ts` | M        |
| 2    | Separar `lib/storage.ts`: openDatabase/requestValue/transactionDone a `infrastructure/indexeddb.ts`; listProducts a `entities/product/list-products.ts`; saveProduct a `features/inventario/save-product.ts`                                                                             | M        |
| 3    | Mover `lib/product-search.ts` a `entities/product/search.ts` y crear los dos `entities/*/index.ts` con los exports enumerados                                                                                                                                                            | S        |
| 4    | Mover `lib/stock.ts` a `features/inventario/stock.ts`; separar `lib/sales.ts` entre `features/venta/checkout.ts`, `features/caja/list-sales.ts` y `shared/lib/date.ts` (startOfToday)                                                                                                    | M        |
| 5    | Mover `components/modal.tsx` a `shared/ui/modal.tsx`                                                                                                                                                                                                                                     | S        |
| 6    | Mover catalog.tsx a `features/catalogo`; pos.tsx, cart-context.tsx y weight-picker.tsx a `features/venta`; cashbook.tsx a `features/caja`, conservando sus nombres de archivo                                                                                                            | S        |
| 7    | Mover stock-entry.tsx, product-form.tsx, stock-receipt.tsx y waste-form.tsx a `features/inventario`; extraer `inventory-workspace.tsx` desde Kiosk con sus estados y callbacks                                                                                                           | M        |
| 8    | Mover kiosk.tsx, workspace-nav.tsx y pwa.tsx a `app/_components`; extraer la carga de productos a `app/_hooks/use-products.ts`; actualizar page.tsx y layout.tsx                                                                                                                         | M        |
| 9    | Crear los cuatro `features/*/index.ts` con la API pública indicada y conectar aplicación a esas APIs                                                                                                                                                                                     | S        |
| 10   | Separar `tests/domain.test.ts` en `features/inventario/pricing.test.ts`, `entities/product/model.test.ts` y `features/caja/summary.test.ts`; separar `tests/product-search.test.ts` en `entities/product/search.test.ts` y `tests/integration/product-persistence.test.ts`               | M        |
| 11   | Mover storage.test.ts, stock.test.ts, sales.test.ts, weight.test.ts y weight-migration.test.ts de tests a `tests/integration`; adaptar imports y `scripts/test.mjs` para descubrir tests de features, entities y tests/integration                                                       | M        |
| 12   | Extender `tests/e2e/pos.spec.ts` para verificar que navegar a otras vistas y volver conserva el carrito; mantener el resto de pruebas E2E y su ubicación                                                                                                                                 | S        |
| 13   | Incorporar límites de imports en `eslint.config.mjs` con validación de aliases, rutas relativas y reexports; documentar las excepciones de tests                                                                                                                                         | M        |
| 14   | Retirar los antiguos archivos de components/lib una vez migrados todos sus consumidores; actualizar rutas activas de README, AGENTS.md y documentación de verificación; conservar documentos históricos identificados como tales                                                         | S        |
| 15   | Verificar formato, límites, tipos, pruebas unitarias/integración, build de producción y Playwright en escritorio y móvil                                                                                                                                                                 | M        |

Total: 6 pasos S y 9 pasos M. La entrega se divide en dominio/persistencia,
funcionalidades/composición y controles/documentación. No mezclar cambios de
comportamiento, esquema de datos o rediseño visual con esta migración.

**Reglas aplicadas:** [test-colocate-with-feature](../../.agents/skills/feature-arch/references/test-colocate-with-feature.md),
[test-integration-at-app-layer](../../.agents/skills/feature-arch/references/test-integration-at-app-layer.md),
[struct-feature-self-contained](../../.agents/skills/feature-arch/references/struct-feature-self-contained.md).

## 10. Criterios de revisión humana

- [x] Cada funcionalidad reúne sus componentes, lógica y estado propio.
- [x] Los contextos tienen propietario y no se agrupan en una carpeta global.
- [x] Kiosk compone vistas; no controla directamente formularios de inventario.
- [x] Cada funcionalidad usa únicamente su API pública desde aplicación.
- [x] No existen imports directos entre funcionalidades ni dependencias ascendentes.
- [x] Los helpers genéricos no contienen reposición, checkout o fórmulas de negocio.
- [x] El carrito persiste al navegar entre vistas, como antes de la migración.
- [x] Alta/edición/reposición/merma continúan limitadas a inventario.
- [x] Las operaciones atómicas, IDs y registros históricos conservan su contrato.
- [x] La aplicación mantiene consulta y operación local sin internet.
- [x] No se han agregado rutas, dependencias de estado ni cambios visuales intencionales.
- [x] Las pruebas siguen cubriendo persistencia, concurrencia, peso y migración v1/v2.

**Reglas aplicadas:** [bound-feature-isolation](../../.agents/skills/feature-arch/references/bound-feature-isolation.md),
[test-feature-isolation](../../.agents/skills/feature-arch/references/test-feature-isolation.md),
[test-integration-at-app-layer](../../.agents/skills/feature-arch/references/test-integration-at-app-layer.md).

## 11. Decisiones pendientes y riesgos a revisar

La lista de cuatro funcionalidades y esta separación fueron aprobadas por el usuario.
La implementación conserva las decisiones descritas; los riesgos siguientes guían
la verificación de la migración y revisiones futuras.

1. **Persistencia:** separar archivos sin romper transacciones multistore. La
   infraestructura no debe imponer operaciones de negocio parciales.
2. **Ciclo de vida:** conservar carrito y comportamiento de diálogos durante cambios
   de vista; mover un Provider no es equivalente a mover su archivo.
3. **Capas de negocio comunes:** entities e infrastructure son decisiones explícitas
   para evitar dependencia entre funcionalidades y un shared indiscriminado.

Las preferencias de la skill sobre stores, reseteo al desmontar y consultas remotas
no se aplican mecánicamente: prevalecen RN-02, RN-03, RN-05 y RN-07 y el comportamiento
existente. El objetivo es mantenibilidad; mover archivos no promete mayor velocidad.

**Reglas aplicadas:** [bound-interface-contracts](../../.agents/skills/feature-arch/references/bound-interface-contracts.md),
[fstate-reset-on-unmount](../../.agents/skills/feature-arch/references/fstate-reset-on-unmount.md),
[struct-shared-layer](../../.agents/skills/feature-arch/references/struct-shared-layer.md).

## 12. Historial

Verificación de la implementación: ESLint (incluidos límites de arquitectura),
TypeScript, 11 pruebas de lógica/integración y build de producción aprobados.
Playwright: 19 escenarios aprobados, 1 omitido en escritorio por ser exclusivo
de navegación móvil. El formateo se verifica con `npm run format:check`.

La regla local `scripts/eslint-architecture.mjs` resuelve aliases y rutas relativas
para imports estáticos, reexports, imports dinámicos con literal y require con
literal. Las rutas calculadas dinámicamente no se resuelven estáticamente; no se
usan para importar módulos del proyecto. No introducirlas para eludir los límites.

| Fecha      | Cambio                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------- |
| 2026-09-24 | Análisis del código actual, confirmación de cuatro funcionalidades y propuesta de migración; sin mover código |

**Reglas aplicadas:** [proceso de propuesta](../../.agents/skills/feature-arch/references/_blueprint-process.md).
