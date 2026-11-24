import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colores } from '../config/theme';

// Contenedor base: respeta la barra de estado, el notch y los botones de Android
// (Android dibuja la app de borde a borde, así que hay que dejar esos márgenes).
export default function Pantalla({ children }) {
  return <SafeAreaView style={estilos.pantalla}>{children}</SafeAreaView>;
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
});
