import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colores } from '../config/theme';
import { estadoStock } from '../utils/inventario';

const ESTILOS = {
  agotado: { texto: 'Agotado', fondo: '#ffebee', color: colores.peligro },
  bajo: { texto: 'Poco inventario', fondo: '#fff3e0', color: colores.advertencia },
  ok: { texto: 'En existencia', fondo: '#e8f5e9', color: colores.exitoOscuro },
  sinControl: { texto: 'Sin control', fondo: '#eceff1', color: colores.textoSuave },
};

export default function InsigniaStock({ producto }) {
  const e = ESTILOS[estadoStock(producto)];
  return (
    <View style={[estilos.caja, { backgroundColor: e.fondo }]}>
      <Text style={[estilos.texto, { color: e.color }]}>{e.texto}</Text>
    </View>
  );
}

export const colorDeStock = (producto) => ESTILOS[estadoStock(producto)].color;

const estilos = StyleSheet.create({
  caja: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 4 },
  texto: { fontSize: 11, fontWeight: 'bold' },
});
