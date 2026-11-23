import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Pantalla from './src/components/Pantalla';
import Pestanas from './src/components/Pestanas';
import BarraEstado from './src/components/BarraEstado';
import VentaScreen from './src/screens/VentaScreen';
import RegistroScreen from './src/screens/RegistroScreen';
import HistorialScreen from './src/screens/HistorialScreen';
import { useCuenta } from './src/hooks/useCuenta';
import { useSincronizacion } from './src/hooks/useSincronizacion';
import { iniciar } from './src/services/sincronizacion';
import { colores } from './src/config/theme';

export default function App() {
  const [pestana, setPestana] = useState('venta');
  const [codigoPendiente, setCodigoPendiente] = useState('');
  const { listo } = useSincronizacion();

  // La cuenta vive aquí para no perder los productos al cambiar de pestaña
  const cuenta = useCuenta();

  // Carga el catálogo y la cola del celular y arranca la sincronización
  useEffect(() => {
    iniciar();
  }, []);

  // Desde Venta: "producto no encontrado" -> abrir Registro con el código ya capturado
  const registrarCodigo = useCallback((codigo) => {
    setCodigoPendiente(codigo);
    setPestana('registro');
  }, []);

  const cambiarPestana = useCallback((id) => {
    setCodigoPendiente('');
    setPestana(id);
  }, []);

  if (!listo) {
    return (
      <Pantalla>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colores.primario} />
        </View>
      </Pantalla>
    );
  }

  return (
    <Pantalla>
      <StatusBar style="dark" />
      <Pestanas activa={pestana} onCambiar={cambiarPestana} />
      <BarraEstado />
      {pestana === 'venta' && <VentaScreen cuenta={cuenta} onRegistrarCodigo={registrarCodigo} />}
      {pestana === 'registro' && <RegistroScreen codigoInicial={codigoPendiente} />}
      {pestana === 'historial' && <HistorialScreen />}
    </Pantalla>
  );
}
