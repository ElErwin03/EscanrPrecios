# EscanerPrecios – POS móvil para abarrotes (Tuxpan, Nayarit)

App React Native (Expo) que escanea códigos de barras, arma la cuenta, calcula el cambio y registra productos en Firebase Realtime Database.

## Estructura

```
App.js                      Raíz: pestañas + estado de la cuenta
src/
  config/      firebase.js (conexión) · theme.js (colores)
  services/    productosService · ventasService · ventasLocal (historial) · catalogoLocal (copia en el celular)
               colaSincronizacion (pendientes) · sincronizacion (motor offline/online)
  hooks/       useCuenta.js (carrito) · useAviso.js (mensajes no bloqueantes)
  utils/       dinero.js (centavos, formato, parseo) · dialogos.js
  components/  EscanerCodigo · PanelCobro · ItemCuenta · Pestanas · Aviso · Pantalla
  screens/     VentaScreen · RegistroScreen
```

## Modo offline

- Todos los productos se guardan en el celular; escanear y cobrar **no necesita internet**.
- Ventas y productos nuevos hechos sin conexión quedan en una cola guardada en el celular
  (sobrevive aunque cierres la app) y se envían a Firebase solos cuando vuelve el internet.
- Se sincroniza al reconectar, al volver a la app y cada 5 minutos. Una franja de color bajo las pestañas
  muestra el estado (toca para forzar la sincronización).
- La primera vez hay que abrir la app **con internet** para descargar el catálogo.

## Historial de ventas

La pestaña **Ventas** muestra las ventas del día hechas en este celular: total vendido, número de ventas y
artículos, y cada venta con su hora y estado de envío (✔ enviada · ⏳ por enviar · ⚠️ error). Toca una venta
para ver sus productos. Con las flechas ‹ › se consultan días anteriores (se conservan 30 días).
Funciona sin internet.

## Ejecutar en VS Code

```bash
npm install
npm start          # escanea el QR con Expo Go
```

Opcional: copia `.env.example` a `.env.local` para usar otra configuración de Firebase.

## Exportar APK

```bash
npm install -g eas-cli
eas login
npm run build:apk  # genera un .apk instalable (te pedirá el id del paquete, ej. com.tuusuario.escanerprecios)
```

## Formato de datos en Firebase

```
productos/<codigo_de_barras>: { nombre: "Agua", precio: 10.5 }
ventas/<id>: { fecha, timestamp, total, recibido, cambio, articulos: [{ codigo, nombre, precio, cantidad }] }
```
