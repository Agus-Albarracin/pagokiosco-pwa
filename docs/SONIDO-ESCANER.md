# PLAN-08 · Sonido de lectura

- Repositorio: pagokiosco-pwa.
- Rama: `feat/sonido-escaneo`.
- Base: `feat/catalogo-agregar-stock` en `efd33e0`. Integra el sonido con los
  accesos actuales de Vender y Agregar stock y con el inicio automático de la cámara.
- Un pitido de 130 ms por código decodificado con ZXing. Confirma lectura,
  no existencia del producto, ingreso de stock ni confirmación de venta.
- No suena al escribir un EAN, abrir o cerrar la cámara, ni ante errores de lectura.
- Se genera localmente con Web Audio, sin descargas ni dependencias nuevas.
- Se prepara al tocar Escanear o Activar cámara, antes del trabajo asíncrono.
  Referencia: [Web Audio y gesto del usuario](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices#autoplay_policy).
- El sonido termina aunque se cierre el escáner al abrir el formulario. Se reutiliza
  un contexto de audio por página y se desconectan los nodos al terminar cada pitido.
- Si el audio no está disponible o está bloqueado, el escaneo sigue funcionando.

## Comprobación

La prueba de navegador decodifica un EAN con ZXing desde un MediaStream sintético
y verifica un oscilador por lectura, contexto activo y finalización tras cerrar
el escáner. También verifica lectura con audio no disponible y EAN manual silencioso.
La audibilidad, volumen y modo silencio requieren prueba en el teléfono de destino.

Resultado: build (incluye TypeScript), lint y 9 pruebas unitarias correctos.
Pasaron las 6 ejecuciones E2E seleccionadas de sonido y alta/reposición por escaneo
en Chromium y Pixel 7 emulado. No se repitió la suite completa.

## Publicación manual

Primero publicar las ramas anteriores si aún están pendientes:

```powershell
git -C "C:\Users\Agust\Desktop\pagokiosco" push -u origin feat/alta-por-escaneo
git -C "C:\Users\Agust\Desktop\pagokiosco" push -u origin feat/catalogo-agregar-stock
git -C "C:\Users\Agust\Desktop\pagokiosco" push -u origin feat/sonido-escaneo
```

PR: **Agregar pitido al reconocer un código de barras**.
Base inicial: `feat/catalogo-agregar-stock`; después de integrar esa dependencia,
revisar el diff y cambiar la base a `main`.
