import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Pantalla from './src/components/Pantalla';
import Pestanas from './src/components/Pestanas';
import BarraEstado from './src/components/BarraEstado';
import VentaScreen from './src/screens/VentaScreen';
import RegistroScreen from './src/screens/RegistroScreen';
import HistorialScreen from './src/screens/HistorialScreen';
import InventarioScreen from './src/screens/InventarioScreen';
import AvisoInventario from './src/components/AvisoInventario';
import { useCuenta } from './src/hooks/useCuenta';
import { useSincronizacion } from './src/hooks/useSincronizacion';
import { iniciar } from './src/services/sincronizacion';
import { colores } from './src/config/theme';

export default function App() {
  const [pestana, setPestana] = useState('venta');
  const [codigoPendiente, setCodigoPendiente] = useState('');
  const [filtroInventario, setFiltroInventario] = useState('todos');
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
    setFiltroInventario('todos');
    setPestana(id);
  }, []);

  // Desde la franja de aviso: abrir Inventario ya filtrado por "poco inventario"
  const verInventarioBajo = useCallback(() => {
    setFiltroInventario('bajo');
    setPestana('inventario');
  }, []);

  if (!listo) {
    return (
      <SafeAreaProvider>
        <Pantalla>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colores.primario} />
          </View>
        </Pantalla>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Pantalla>
        <StatusBar style="dark" />
        <Pestanas activa={pestana} onCambiar={cambiarPestana} />
        <BarraEstado />
        {pestana !== 'inventario' && <AvisoInventario onPress={verInventarioBajo} />}
        {pestana === 'venta' && <VentaScreen cuenta={cuenta} onRegistrarCodigo={registrarCodigo} />}
        {pestana === 'registro' && <RegistroScreen codigoInicial={codigoPendiente} />}
        {pestana === 'inventario' && <InventarioScreen filtroInicial={filtroInventario} />}
        {pestana === 'historial' && <HistorialScreen />}
      </Pantalla>
    </SafeAreaProvider>
  );
}
