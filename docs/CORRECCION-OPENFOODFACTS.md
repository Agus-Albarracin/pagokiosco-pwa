# PLAN-05 · Evitar productos falsamente ausentes en Open Food Facts

- Repositorio: Agus-Albarracin/pagokiosco-pwa.
- Rama: `fix/openfoodfacts-v3`.
- Base: `origin/main` en `a7c78cd`, con el MVP integrado mediante los PR 1–4.
- Prioridad: alta. El escaneo encontraba el código pero descartaba respuestas válidas.
- Aceptación: reconocer éxito v3, distinguir ausencia de fallo y probar el código reportado.

## Causa y respuesta comprobada

La consulta real de `7798113302458` devuelve HTTP 200, `status: "success"`,
`result.id: "product_found"` y el nombre **Manaos pomelo blanco zero**.
La comparación original `data.status !== 1` trataba esa respuesta como una ausencia.
La prueba anterior simulaba el formato numérico antiguo y no detectó la diferencia.

La [referencia oficial de cambios de API](https://github.com/openfoodfacts/openfoodfacts-server/blob/main/docs/api/ref-api-and-product-schema-change-log.md)
documenta que v3 cambió la estructura de estado, errores y advertencias.
Se conserva una fixture mínima de la respuesta real en tests/fixtures.

## Corrección

- Interpretar estados textuales de éxito de v3 y conservar compatibilidad con `1`.
- Aplicar RN-02.3 al resultado normalizado del proveedor: la ausencia es `0`, HTTP 404
  o `failure/product_not_found`; un fallo inesperado devuelve 502 sin caché.
- Exigir un objeto producto antes de emitir found:true y mantener el DTO EAN/nombre.
- Usar `version=3` en la consulta del cliente para evitar negativos guardados con la
  URL anterior. La revalidación del proveedor permanece en 24 horas.
- Mantener el alta manual cuando el producto falta o el servicio no está disponible.
- AGENTS.md conserva las modificaciones previas del usuario; esta nota documenta
  cómo se adapta su contrato al formato real de la API.

## Publicación

Verificaciones aprobadas: `npm test` (8 pruebas), lint, tipos, build y 4 escenarios
de navegador relacionados con consulta exitosa/fallback, en Chromium y Pixel 7 emulado.
El proveedor real se consultó para capturar la respuesta de Manaos; las pruebas
automáticas usan esa fixture y respuestas simuladas para ser reproducibles.

La corrección necesita publicar la rama, integrar un PR hacia `main` y desplegar.
En la PWA instalada, cerrar todas las pestañas de la versión anterior y volver a
abrir con conexión permite activar el build corregido. Volver a consultar el código.
No se modifica ni se borra el inventario local.
