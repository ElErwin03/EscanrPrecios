import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Button, Linking, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colores, radio } from '../config/theme';

const TIPOS_CODIGO = ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'];

/**
 * Cámara que se queda encendida (no se desmonta entre escaneos, que es lo lento).
 * - Ignora lecturas repetidas mientras el mismo código siga frente a la cámara.
 * - No acepta otro código hasta que termine `onCodigo` (consulta, alertas, etc.).
 * - Muestra el visor en lugar de bloquear la pantalla.
 */
export default function EscanerCodigo({ onCodigo, altura = 150, pausaMs = 1500, children }) {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [procesando, setProcesando] = useState(false);

  const ocupado = useRef(false);
  const ultimo = useRef({ codigo: null, t: 0 });
  const onCodigoRef = useRef(onCodigo);
  onCodigoRef.current = onCodigo; // siempre la versión más reciente, sin recrear el handler

  const alDetectar = useCallback(
    async ({ data }) => {
      if (ocupado.current) return;

      const ahora = Date.now();
      if (data === ultimo.current.codigo && ahora - ultimo.current.t < pausaMs) {
        ultimo.current.t = ahora; // sigue frente a la cámara: no repetir
        return;
      }

      ocupado.current = true;
      ultimo.current = { codigo: data, t: ahora };
      setProcesando(true);
      try {
        await onCodigoRef.current(data);
      } finally {
        ocupado.current = false;
        ultimo.current.t = Date.now();
        setProcesando(false);
      }
    },
    [pausaMs]
  );

  if (!permiso) {
    return (
      <View style={[estilos.contenedor, { height: altura }]}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!permiso.granted) {
    return (
      <View style={[estilos.contenedor, estilos.sinPermiso, { height: altura }]}>
        <Text style={estilos.textoPermiso}>Necesitamos permiso para usar la cámara</Text>
        <Button
          title={permiso.canAskAgain ? 'Conceder permiso' : 'Abrir ajustes'}
          onPress={permiso.canAskAgain ? pedirPermiso : () => Linking.openSettings()}
        />
      </View>
    );
  }

  return (
    <View style={[estilos.contenedor, { height: altura }]}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={alDetectar}
        barcodeScannerSettings={{ barcodeTypes: TIPOS_CODIGO }}
      />
      <View pointerEvents="none" style={estilos.visor} />
      {procesando && (
        <View pointerEvents="none" style={estilos.cargando}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      )}
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { width: '100%', borderRadius: radio, overflow: 'hidden', backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  sinPermiso: { backgroundColor: colores.blanco, borderWidth: 1, borderColor: colores.borde, padding: 12 },
  textoPermiso: { textAlign: 'center', marginBottom: 10, color: colores.texto },
  visor: { position: 'absolute', width: '70%', height: '55%', borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)', borderRadius: 8 },
  cargando: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 16, padding: 6 },
});
