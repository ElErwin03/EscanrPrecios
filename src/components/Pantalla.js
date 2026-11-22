import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Platform } from 'react-native';
import { colores } from '../config/theme';

// Contenedor base: respeta la barra de estado en Android y el notch en iOS
export default function Pantalla({ children }) {
  return <SafeAreaView style={estilos.pantalla}>{children}</SafeAreaView>;
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colores.fondo,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});
