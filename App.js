import React, { useCallback, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import Pantalla from './src/components/Pantalla';
import Pestanas from './src/components/Pestanas';
import VentaScreen from './src/screens/VentaScreen';
import RegistroScreen from './src/screens/RegistroScreen';
import { useCuenta } from './src/hooks/useCuenta';

export default function App() {
  const [pestana, setPestana] = useState('venta');
  const [codigoPendiente, setCodigoPendiente] = useState('');

  // La cuenta vive aquí para no perder los productos al cambiar de pestaña
  const cuenta = useCuenta();

  // Desde Venta: "producto no encontrado" -> abrir Registro con el código ya capturado
  const registrarCodigo = useCallback((codigo) => {
    setCodigoPendiente(codigo);
    setPestana('registro');
  }, []);

  const cambiarPestana = useCallback((id) => {
    setCodigoPendiente('');
    setPestana(id);
  }, []);

  return (
    <Pantalla>
      <StatusBar style="dark" />
      <Pestanas activa={pestana} onCambiar={cambiarPestana} />
      {pestana === 'venta' ? (
        <VentaScreen cuenta={cuenta} onRegistrarCodigo={registrarCodigo} />
      ) : (
        <RegistroScreen codigoInicial={codigoPendiente} />
      )}
    </Pantalla>
  );
}
