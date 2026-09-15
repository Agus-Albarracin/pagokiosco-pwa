# Technical Business Rules Spec: PagoKiosco PWA (v2.1)

## Contexto del Sistema
* **Proyecto:** PagoKiosco - PWA Mobile-First para gestión de inventario y punto de venta (POS) en microcomercios.
* **Módulo:** Catálogo local con búsqueda por nombre y marca, Local First Storage, Event-Driven POS Workflow, Metriquiado y PWA Web App Manifest.
* **Filosofía UX/UI:** Mobile-First, Zero-Learning-Curve (patrones de interacción UI/UX analógos a fintechs como Mercado Pago). Operación sin pasarela de pagos ni procesamiento monetario real (Zero-Gateway / Audit-Only).

---

## RN-01: Identificación y búsqueda local de productos
* **RN-01.1 (Búsqueda principal):** La entrada principal será un buscador escrito por nombre de producto o marca, sobre el catálogo local del comercio. Debe aceptar palabras parciales, combinaciones de palabras en cualquier orden e ignorar mayúsculas, tildes y espacios adicionales. La búsqueda funciona sin conexión.
* **RN-01.2 (Sin escaneo ni catálogos externos):** El scanner queda fuera del producto, incluso como opción secundaria. No se solicitará acceso a la cámara ni se utilizarán ZXing, GS1 u Open Food Facts para identificar o dar de alta productos. No se exige código EAN/GTIN.
* **RN-01.3 (Identificador interno):** Cada producto conserva un identificador estable. Por compatibilidad, la clave persistida `ean` puede contener identificadores antiguos o un SKU interno generado automáticamente para las nuevas altas. No se renumeran productos ni ventas existentes.
* **RN-01.4 (Flujo por sección):** Vender permite buscar y seleccionar productos existentes para el carrito; Catálogo solo muestra precios y disponibilidad; Agregar stock concentra altas, edición y reposición. Una búsqueda sin resultados en Vender o Catálogo no crea productos.
* **RN-01.5 (Productos sueltos / Custom Entry):** Para ítems a granel o productos sueltos (ej. panadería):
  * **Quick-Access Grid:** Interfaz táctil basada en CSS Grid con componentes de alto contraste (`min-height: 48px` para target táctil) vinculados a los SKUs internos preconfigurados.
  * **Arbitrary Nominal Entry:** Teclado numérico virtual para inyección directa de montos dinámicos (`custom_amount`) al estado global del carrito sin requerir persistencia previa en catálogo.

## RN-02: Catálogo local y esquema mínimo
* **RN-02.1 (Fuente de datos):** IndexedDB es la fuente del catálogo de cada dispositivo. Las búsquedas y altas no consultan servicios externos ni requieren conexión. Una base en la nube y la sincronización entre dispositivos quedan fuera del alcance actual.
* **RN-02.2 (Resultados):** Los resultados muestran nombre, marca si existe, precio y disponibilidad. No se inventan datos de productos ausentes ni se guardan resultados vacíos.
* **RN-02.3 (Esquema mínimo):** `{ ean: String, nombre: String, marca?: String, costo: Number, margen: Number, precioVenta: Number, stock: Number, updatedAt: ISOString }`. `marca` es opcional y admite hasta 80 caracteres. Los registros anteriores sin marca siguen siendo válidos y buscables. No se almacenan imágenes, nutrición ni alérgenos.

## RN-03: Gestión de Inventario y Local-First Persistence
* **RN-03.1 (Mutation Payload):** El formulario de alta/edición exigirá estrictamente los siguientes atributos del DTO: `nombre`, `costo`, `margen`, `stock`[cite: 3, 4].
* **RN-03.2 (Atomic Stock Mutation):**
  * **Ingreso:** Operación incremental de adición sobre el registro local IndexedDB (`stock = stock + input_units`).
  * **Egreso (Venta):** Decremento atómico del atributo `stock` post-confirmación de la transacción (`stock = stock - cart_units`).

## RN-04: Algoritmo Financiero y Calculadora de Rentabilidad
* **RN-04.1 (Stateful Margin Default):** El parámetro `margen` inicial se resolverá desde la clave `app_config.default_margin` persistida en `localStorage` (fallback hardcodeado: **40.00**)[cite: 3, 4].
* **RN-04.2 (Numeric Free Input & Quick Presets):** El estado del margen admitirá asignación directa vía `HTMLInputElement` (`type="number"`, `step="0.1"`) o a través de los *preset handlers* predefinidos (`[30, 40, 50, 60, 100]`)[cite: 3, 4].
* **RN-04.3 (Cálculo de Precio Bruto):**
  $$\text{PrecioBruto} = \text{Costo} \times \left(1 + \frac{\text{Margen}}{100}\right)$$
* **RN-04.4 (Redondeo Comercial / Ceil Step):** Aplicación de redondeo ceil cuantitativo escalonado a la unidad comercial de $50:
  $$\text{PrecioVenta} = \left\lceil \frac{\text{PrecioBruto}}{50} \right\rceil \times 50$$[cite: 3, 4]
* **RN-04.5 (Recálculo Margin Inverse Kinematics):** Si se detecta un evento `onChange` directo sobre `precioVenta`, el estado `margen` se recalculará dinámicamente:
  $$\text{Margen} = \left( \frac{\text{PrecioVenta} - \text{Costo}}{\text{Costo}} \right) \times 100$$

## RN-05: Workflow Pos-Checkout, Cierre de Caja y Agregación Métricas
* **RN-05.1 (Lightweight Cart State):** El estado del carrito (React Context / Zustand) renderizará únicamente componentes planos sin assets multimedia: `[Qty] x [Nombre] = [Subtotal]`.
* **RN-05.2 (Payment Method Tagging):** La confirmación del checkout interceptará el evento de cierre clasificando la transacción en una enumeración unívoca: `PaymentMethodEnum { CASH = 'EFECTIVO', TRANSFER = 'TRANSFERENCIA' }`.
* **RN-05.3 (Daily Cash Closure Consolidation):** La función de "Cierre de Caja" ejecutará una consulta agregada (`SUM`) sobre las transacciones del día actual filtradas por marca de tiempo (`createdAt >= startOfDay`), generando la salida:
  * $\sum \text{Monto}_{\text{CASH}}$
  * $\sum \text{Monto}_{\text{TRANSFER}}$
  * $\text{TotalGeneral} = \sum \text{Monto}_{\text{CASH}} + \sum \text{Monto}_{\text{TRANSFER}}$
* **RN-05.4 (Time Series Metrics Engine):** Indexación de ventas por timestamps Unix para consultas analíticas simplificadas en intervalos relacionales: Diario (24h), Semanal (7d), Mensual (30d) y Anual (365d).

## RN-06: Arquitectura PWA, Web App Manifest y Standalone UX
* **RN-06.1 (Zero-Store PWA Deployment):** Distribución basada en estándares W3C PWA, Service Workers (estrategia Cache-First para assets estáticos) e IndexedDB para capacidades Full-Offline.
* **RN-06.2 (A2HS - Add to Home Screen Lifecycle):**
  * La app escuchará el evento del navegador `beforeinstallprompt` y evaluará si la media query `(display-mode: standalone)` retorna `false`.
  * Si la condición se cumple (no está instalada), desplegará un componente Bottom-Sheet modal interactivo invitando al usuario a anclar la aplicación.
  * Si `(display-mode: standalone)` es `true`, el listener suprimirá cualquier banner o prompt de instalación.
* **RN-06.3 (Full-Screen Layout Configuration):** El archivo `manifest.json` y los metadatos de Next.js (`layout.jsx`) forzarán el modo Inmersivo:
  ```json
  {
    "display": "fullscreen",
    "orientation": "portrait",
    "theme_color": "#1a365d",
    "background_color": "#fdfbf7"
  }
  ```
