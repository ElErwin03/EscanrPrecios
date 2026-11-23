import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colores } from '../config/theme';
import { esMismoDia, formatearDia } from '../utils/fechas';

// Flechas para moverse entre días. No deja avanzar más allá de hoy.
export default function SelectorDia({ dia, onAnterior, onSiguiente }) {
  const esHoy = esMismoDia(dia, Date.now());
  return (
    <View style={estilos.fila}>
      <TouchableOpacity style={estilos.flecha} onPress={onAnterior} hitSlop={8}>
        <Text style={estilos.flechaTexto}>‹</Text>
      </TouchableOpacity>
      <Text style={estilos.titulo}>{formatearDia(dia)}</Text>
      <TouchableOpacity style={[estilos.flecha, esHoy && estilos.flechaOff]} onPress={onSiguiente} disabled={esHoy} hitSlop={8}>
        <Text style={estilos.flechaTexto}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  titulo: { fontSize: 16, fontWeight: 'bold', color: colores.texto },
  flecha: { width: 40, height: 40, borderRadius: 20, backgroundColor: colores.blanco, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colores.borde },
  flechaOff: { opacity: 0.3 },
  flechaTexto: { fontSize: 24, color: colores.primario, lineHeight: 28 },
});
