# EscanerPrecios – POS móvil para abarrotes (Tuxpan, Nayarit)

App React Native (Expo) que escanea códigos de barras, arma la cuenta, calcula el cambio y registra productos en Firebase Realtime Database.

## Estructura

```
App.js                      Raíz: pestañas + estado de la cuenta
src/
  config/      firebase.js (conexión) · theme.js (colores)
  services/    productosService · inventarioService · ventasService · ventasLocal (historial) · catalogoLocal (copia en el celular)
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

## Inventario

- Cada producto puede llevar control de existencias. Los productos sin existencia registrada **no se descuentan ni avisan**;
  al agregar existencias por primera vez empiezan a controlarse.
- Pestaña **Inventario**: lista con búsqueda, filtro "Poco inventario" y los productos más urgentes primero.
  Al tocar un producto: **Llegó mercancía** (suma piezas), **Corregir existencia** (conteo real) y **Avisar cuando queden pocas**
  (mínimo propio; por defecto 5).
- Cada venta finalizada descuenta las piezas vendidas (nunca baja de 0). Si un producto llega a su mínimo o se agota,
  la confirmación de venta lo avisa y aparece una franja naranja en todas las pantallas.
- **Cancelar venta**: el botón rojo de la pantalla Escanear borra la cuenta en curso sin cobrar ni tocar el inventario.
- Se guarda la existencia final (no "+5"), así que los reintentos de envío nunca descuentan dos veces.
  Limitación: si dos celulares venden el mismo producto a la vez, gana el último en sincronizar.

## Devoluciones

En la pestaña **Ventas**, toca una venta y elige **↩ Devolver artículos**. Puedes devolver todo o solo algunas piezas
(con − y +), y decidir si las piezas **regresan al inventario** (desactívalo si el producto está dañado).
- La venta original **no se modifica**: se crea un registro de devolución que apunta a ella (`devoluciones/<id>` en Firebase).
- Se reembolsa el precio al que se vendió, no el precio actual.
- No se puede devolver más de lo vendido ni la misma pieza dos veces.
- En el historial, la devolución cuenta en el día en que se hace, y el resumen muestra la **venta neta** (ventas − devoluciones).
- Funciona sin internet y se sincroniza igual que las ventas. Solo se pueden devolver ventas de los últimos 30 días.

## Historial de ventas

La pestaña **Ventas** muestra las ventas del día hechas en este celular: total vendido, número de ventas y
artículos, y cada venta con su hora y estado de envío (✔ enviada · ⏳ por enviar · ⚠️ error). Toca una venta
para ver sus productos. Con las flechas ‹ › se consultan días anteriores (se conservan 30 días).
Funciona sin internet.

## Requisitos

- **Node.js 22.13 o superior** (`node -v` para verlo) — lo exige Expo SDK 58 / React Native 0.88.
- Expo SDK 58 (React 19). Si usas Expo Go, debe ser la versión más reciente de la tienda.

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
productos/<codigo_de_barras>: { nombre: "Agua", precio: 10.5, stock: 24, stockMinimo: 5 }   (stock y stockMinimo son opcionales)
devoluciones/<id>: { tipo, ventaId, fecha, timestamp, total, repuesto, articulos: [...] }
ventas/<id>: { fecha, timestamp, total, recibido, cambio, articulos: [{ codigo, nombre, precio, cantidad }] }
```
