# PagoKiosco

MVP de inventario y punto de venta para microcomercios. PWA mobile-first en español,
con datos locales y registro de ventas en pesos argentinos. No procesa pagos.

## Ejecutar

Requiere Node.js 20.9 o posterior y npm. Probado con Node.js 20.19.6.

```powershell
npm ci
npm run dev
```

Abrí http://localhost:3000. Para probar instalación y funcionamiento offline:

```powershell
npm run build
npm start
```

`npm run build` genera los iconos y el service worker para los chunks reales del
build. El registro offline está deshabilitado en desarrollo. En hosting usá
`npm run build` como comando de compilación; no omitas los pasos prebuild/postbuild.
No requiere variables de entorno ni claves. La cámara y la PWA requieren HTTPS o
localhost. Para un teléfono, usá un despliegue HTTPS; una IP de red local en HTTP
no equivale a localhost.

## Primera venta

1. Elegí **Nuevo producto**. Ingresá nombre, costo y stock inicial.
2. Elegí un margen (40% inicial) o escribí el precio final. El cálculo desde margen
   redondea hacia arriba a múltiplos de $50. Podés recordar el margen para próximos productos.
3. Usá un EAN de 8 o 13 dígitos, o dejá vacío el código para generar un SKU interno.
   **Escanear** usa `@zxing/library`; si el catálogo externo falla, completá el nombre manualmente.
4. En **Vender**, tocá productos para agregarlos. **Importe libre** permite registrar
   productos sueltos sin crear registros de inventario.
5. Revisá cantidades y elegí **Registrar venta**. Seleccioná efectivo o transferencia
   y confirmá. Solo entonces se guarda la venta y se descuenta stock.
6. En **Inventario → Editar**, ingresá unidades para reponer stock. Se suman al stock actual.
7. En **Caja**, consultá movimientos, períodos y **Cierre de caja**. El cierre suma
   el día calendario del dispositivo, separa medios y conserva todas las ventas.

## Sin conexión e instalación

Abrí la app una vez con internet y esperá **Lista para usar sin conexión**. Desde
ese momento podés recargar, crear/editar productos, vender y consultar caja sin red.
La consulta a Open Food Facts necesita internet; tu catálogo local y la entrada
manual continúan disponibles. Los recursos del escáner también quedan en caché.

Usá **Instalar app**, el aviso automático del navegador o su opción **Agregar a
pantalla de inicio**. En modo standalone/fullscreen no se ofrece instalar de nuevo.
Las actualizaciones se activan después de cerrar todas las pestañas de la versión
anterior y volver a abrir la aplicación con conexión.

## Datos y límites del MVP

- IndexedDB del navegador guarda productos y ventas. No hay cuentas ni sincronización,
  copias de seguridad automáticas o recuperación entre dispositivos. Borrar datos del
  sitio elimina los registros. Se recomienda un dispositivo habitual para el comercio.
- El carrito sin confirmar está en memoria: cambiar de vista lo conserva; recargar lo descarta.
- Stock por unidades enteras, sin lotes, devoluciones ni fraccionamiento por peso.
  Para venta por peso, ingresá el importe final como importe libre.
- El cierre es una consulta consolidada del día; no crea turnos ni borra movimientos.
- Horarios y días dependen del reloj y zona horaria del dispositivo.
- Costo cero admite precio manual; el margen inverso se define en 0% para evitar división por cero.
- El proxy sugiere nombres; nunca fija costos, precios ni stock. Los errores de upstream
  permiten carga manual. Las pruebas de API usan respuestas simuladas.
- Cámara física, instalación nativa y comportamiento específico de Safari/iOS
  necesitan comprobación manual en el dispositivo de destino.

## Verificar

```powershell
npm test
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright inicia y cierra su propio servidor en el puerto 3107. Verifica escritorio
y Pixel 7 emulado. Cinco pruebas de dominio/almacenamiento/proxy y doce escenarios
E2E cubren cálculos, concurrencia, rollback, persistencia, POS, fallback manual,
offline, cierre de cámara e instalación. Las capturas y trazas quedan en
`test-results/` y no se versionan.

## Documentación y entrega

- [Bitácora y decisiones de implementación](docs/IMPLEMENTACION.md)
- [Cobertura de reglas y comprobaciones manuales](docs/VERIFICACION.md)
- [Ramas, commits y publicación manual](docs/ENTREGA.md)

La aplicación completa está en `feat/pwa-offline`. Las ramas están apiladas por
sus dependencias y no se integraron a `master`. Los cambios previos de AGENTS.md y
las skills en .agents/ se conservaron fuera de los commits de implementación.
