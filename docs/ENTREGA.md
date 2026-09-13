# Entrega local y publicación manual

Repositorio: `C:\Users\Agust\Desktop\pagokiosco`.
Origin: `https://github.com/Agus-Albarracin/pagokiosco.git`.
Estado: trabajo preparado localmente; sin push, PR, merge ni cambios en Projects.
Se consultó `git ls-remote --symref origin HEAD` y `git ls-remote --heads origin`:
ambas consultas terminaron correctamente sin referencias. No se ejecutó fetch.

## Ítems y ramas

Los PLAN son propuestas locales, no issues publicados. La rama final contiene
todo el MVP; los commits heredados son dependencias, no cambios propios de cada rama.

| Ítem | Rama | Base exacta | Dependencia |
|---|---|---|---|
| PLAN-01 | feat/inventario-local | master · 084bb25 | Base Next.js del repositorio |
| PLAN-02 | feat/consulta-ean | feat/inventario-local · 17d7353 | Completa el formulario y consulta catálogo local |
| PLAN-03 | feat/venta-caja | feat/consulta-ean · db30c78 | Usa catálogo y escáner para vender |
| PLAN-04 | feat/pwa-offline | feat/venta-caja · b49d816 | Precaché de la aplicación y todos sus flujos |

## Commits propios por rama

| Rama | Hash | Título exacto |
|---|---|---|
| feat/inventario-local | 96a5e69 | feat(inventory): define product rules and portable tests |
| feat/inventario-local | 41a4b83 | feat(inventory): persist atomic stock additions in IndexedDB |
| feat/inventario-local | 17d7353 | feat(inventory): add responsive catalog and pricing form |
| feat/consulta-ean | 59d8916 | feat(scanner): add validated Open Food Facts proxy |
| feat/consulta-ean | db30c78 | feat(scanner): integrate ZXing camera and manual lookup |
| feat/venta-caja | 58d6fa4 | feat(pos): record idempotent sales with atomic stock deduction |
| feat/venta-caja | a63242b | feat(pos): add cart, custom amounts and payment confirmation |
| feat/venta-caja | bfbb040 | feat(pos): add daily cash closure and period metrics |
| feat/venta-caja | b49d816 | test(pos): verify sales and cash closure on desktop and mobile |
| feat/pwa-offline | 94c0a56 | feat(pwa): generate install icons and versioned offline cache |
| feat/pwa-offline | 48f3302 | feat(pwa): add install lifecycle and offline browser coverage |
| feat/pwa-offline | HEAD al entregar | docs(pwa): document MVP operation, verification and branch delivery |

El hash del commit que contiene esta tabla se informa en la entrega final; puede
obtenerse con `git rev-parse feat/pwa-offline` al terminar esta sesión.

## Pushes pendientes, en orden

Desde cualquier directorio PowerShell, estos comandos usan la ruta absoluta. Primero
publicá la base inicial para que exista `master` en el remoto; luego sus dependientes.
No hay ramas sincronizadas ni comandos de push opcionales para trabajo ya publicado.

```powershell
# 1. Base inicial
git -C "C:\Users\Agust\Desktop\pagokiosco" push -u origin master
# 2. Inventario
git -C "C:\Users\Agust\Desktop\pagokiosco" push -u origin feat/inventario-local
# 3. Consulta y cámara
git -C "C:\Users\Agust\Desktop\pagokiosco" push -u origin feat/consulta-ean
# 4. POS y caja
git -C "C:\Users\Agust\Desktop\pagokiosco" push -u origin feat/venta-caja
# 5. PWA completa
git -C "C:\Users\Agust\Desktop\pagokiosco" push -u origin feat/pwa-offline
```

Si Git rechaza un push, revisá el motivo antes de reintentar. No se necesita force-push.

## Destinos de PR y orden de integración

1. `feat/inventario-local` → `master`.
2. `feat/consulta-ean` → `feat/inventario-local`.
3. `feat/venta-caja` → `feat/consulta-ean`.
4. `feat/pwa-offline` → `feat/venta-caja`.

Publicar no integra cambios. Revisar los PR en ese orden. Después de integrar una
base a master, verificar el diff de su dependiente antes de cambiar su destino a
master. No se crearon PR ni se marcaron ítems Done remotamente.

## Trabajo previo preservado

`AGENTS.md` conserva los cambios del usuario y `.agents/` conserva sus skills sin
seguimiento. No fueron absorbidos por los commits del MVP. Los artefactos generados
de Next, iconos, service worker y Playwright están ignorados.
