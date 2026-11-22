# EscanerPrecios – POS móvil para abarrotes (Tuxpan, Nayarit)

App React Native (Expo) que escanea códigos de barras, arma la cuenta, calcula el cambio y registra productos en Firebase Realtime Database.

## Estructura

```
App.js                      Raíz: pestañas + estado de la cuenta
src/
  config/      firebase.js (conexión) · theme.js (colores)
  services/    productosService.js (consultar/guardar, caché, timeout)
  hooks/       useCuenta.js (carrito) · useAviso.js (mensajes no bloqueantes)
  utils/       dinero.js (centavos, formato, parseo) · dialogos.js
  components/  EscanerCodigo · PanelCobro · ItemCuenta · Pestanas · Aviso · Pantalla
  screens/     VentaScreen · RegistroScreen
```

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
```
