# Cobertura y verificación

## Reglas de AGENTS.md

| Regla     | Implementación                                              | Evidencia                                                |
| --------- | ----------------------------------------------------------- | -------------------------------------------------------- |
| RN-01.1   | ZXing JS `@zxing/library`, EAN-8/EAN-13, MediaStream        | Tipos, E2E de cierre de pistas; lectura física pendiente |
| RN-01.2   | Regex del proxy, 400 y error JSON estructurado              | `tests/proxy.test.ts`                                    |
| RN-01.3   | Grid táctil ≥48px de productos/SKU, teclado e importe libre | E2E POS desktop/móvil                                    |
| RN-02.1   | Endpoint v3, campos mínimos, User-Agent requerido           | Contrato simulado del proxy                              |
| RN-02.2   | Revalidación 86400 y cabecera de caché compartida           | Prueba de cabecera y revisión de Route Handler           |
| RN-02.3   | DTO mínimo local, proxy EAN/nombre, found:false             | Prueba de recorte y ausencia, revisión de saveProduct    |
| RN-03.1   | Formulario exige nombre, costo, margen y stock              | Validaciones y alta E2E                                  |
| RN-03.2   | Transacciones IndexedDB para ingresos y checkout            | Ingresos/ventas concurrentes y rollback                  |
| RN-04.1   | localStorage `app_config.default_margin`, fallback 40       | Revisión del formulario                                  |
| RN-04.2   | Input number step 0.1 y presets 30/40/50/60/100             | Revisión del formulario                                  |
| RN-04.3–5 | Precio desde margen, ceil $50 e inversa                     | `tests/domain.test.ts` y precio esperado en E2E          |
| RN-05.1   | React Context y líneas Qty × Nombre = Subtotal              | E2E POS sin imágenes en carrito                          |
| RN-05.2   | Confirmación EFECTIVO/TRANSFERENCIA                         | E2E de ambos medios y persistencia                       |
| RN-05.3   | Consolidación desde medianoche local por medio              | E2E de cierre con $1400 + $250 = $1650                   |
| RN-05.4   | Índice createdAt Unix, períodos 24h/7d/30d/365d             | Consulta acotada y período anual E2E                     |
| RN-06.1   | Service worker versionado y catálogo/ventas IndexedDB       | Recarga, alta, venta y cierre con red desactivada        |
| RN-06.2   | Beforeinstallprompt, bottom sheet y standalone/fullscreen   | Evento simulado, aceptación y supresión E2E              |
| RN-06.3   | Manifest fullscreen/portrait, colores y metadata            | Build, revisión de manifest y recursos generados         |

## Controles realizados

- `npm test`: 5 pruebas aprobadas (con múltiples aserciones por prueba).
- `npm run lint`: aprobado.
- `npm run typecheck`: aprobado.
- `npm run build`: aprobado, incluye generación de iconos y precaché.
- Playwright: 10 escenarios aprobados en una ejecución completa; después se añadieron
  y ejecutaron 2 escenarios de beforeinstallprompt, ambos aprobados. Total: 12.
- Capturas de POS en escritorio/Pixel 7 revisadas; sin overflow horizontal en caja.
- Sin despliegue ni push ejecutados. GitHub no devolvió ramas en `ls-remote --heads`.

## Comprobaciones manuales antes de usar en un comercio

1. En teléfono HTTPS, conceder cámara y leer EAN-8 y EAN-13 impresos con iluminación real.
2. Denegar permiso y comprobar que la entrada manual sigue disponible.
3. Instalar desde Chrome Android y Safari iOS; verificar orientación, icono y ausencia de aviso repetido.
4. Esperar preparación offline, activar modo avión, cerrar/reabrir y registrar una venta.
5. Cargar productos reales, verificar márgenes/precios y contrastar el cierre con operaciones conocidas.
6. Verificar la consulta real de Open Food Facts y su caché en el hosting elegido.

La emulación Pixel 7 comprueba viewport e interacción táctil, no sustituye hardware
ni el navegador nativo. Los eventos de instalación se simulan y los MediaStreams de
prueba se generan desde canvas; no se afirma validación física de códigos impresos.
