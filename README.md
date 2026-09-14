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
No requiere variables de entorno ni claves. La instalación PWA requiere HTTPS o
localhost. Para un teléfono, usá un despliegue HTTPS; una IP de red local en HTTP
no equivale a localhost.

## Primera venta

1. Entrá en **Agregar stock** y buscá por **marca o nombre del producto**.
   Si todavía no existe, elegí **Crear producto** y completá nombre y marca opcional.
2. Elegí un margen (40% inicial) o escribí el precio final. El cálculo desde margen
   redondea hacia arriba a múltiplos de $50. Podés recordar el margen para próximos productos.
3. Completá costo y stock inicial y guardá. No hace falta ingresar códigos:
   se genera un identificador interno automáticamente.
4. En **Vender**, buscá por marca o producto y tocá un resultado para agregarlo. **Importe libre** permite registrar
   productos sueltos sin crear registros de inventario.
5. Revisá cantidades y elegí **Registrar venta**. Seleccioná efectivo o transferencia
   y confirmá. Solo entonces se guarda la venta y se descuenta stock.
6. Para reponer, buscá el producto en **Agregar stock**, elegí **Agregar stock**
   en el resultado y confirmá las unidades; se suman sin cambiar el nombre, marca o precio.
7. En **Caja**, consultá movimientos, períodos y **Cierre de caja**. El cierre suma
   el día calendario del dispositivo, separa medios y conserva todas las ventas.

**Catálogo** es de solo consulta: muestra productos, precios y disponibilidad.
Las altas y reposiciones se realizan únicamente en **Agregar stock**; para editar
nombre, marca, costo, margen o precio, buscá el producto allí y elegí **Editar datos**.
Vender y Catálogo no crean productos. La búsqueda admite palabras parciales,
tildes, mayúsculas y palabras en cualquier orden, como `agui cafe` para Café de Águila.
En el celular, deslizá la navegación hacia ambos lados
para acceder a **Vender, Catálogo, Agregar stock y Caja**.

El scanner fue retirado: la aplicación no solicita cámara ni consulta catálogos externos.

## Sin conexión e instalación

Abrí la app una vez con internet y esperá **Lista para usar sin conexión**. Desde
ese momento podés recargar, crear/editar productos, vender y consultar caja sin red.
La búsqueda utiliza exclusivamente los productos guardados en este dispositivo.

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
- La marca es opcional. Los productos anteriores conservan sus identificadores,
  precios y stock, aunque todavía no tengan marca.
- Instalación nativa y comportamiento específico de Safari/iOS
  necesitan comprobación manual en el dispositivo de destino.

## Verificar

```powershell
npm test
npm run lint
npm run build
npm run typecheck
npx playwright install chromium
npm run test:e2e
```

Playwright inicia y cierra su propio servidor en el puerto 3107. Verifica escritorio
y Pixel 7 emulado. Las pruebas cubren cálculos, concurrencia, rollback,
persistencia, búsqueda local por marca y nombre, POS, offline, instalación,
reposición y navegación táctil. La prueba de gesto se omite en escritorio.
Las verificaciones de esta modificación están pendientes de ejecución;
ver el estado y las decisiones en [Búsqueda local](docs/BUSQUEDA-LOCAL.md).
Las capturas y trazas quedan en
`test-results/` y no se versionan.

## Documentación y entrega

- [Reglas de negocio vigentes](AGENTS.md)
- [Búsqueda local: implementación, comprobaciones y entrega](docs/BUSQUEDA-LOCAL.md)
- [Bitácora histórica de implementación](docs/IMPLEMENTACION.md)

La rama de esta modificación es `feat/busqueda-marca-producto`, sobre
`perf/fotogramas-escaneo` (`ff879c9`). Las guías anteriores del scanner describen
funciones retiradas y no son instrucciones de uso de la versión actual.
