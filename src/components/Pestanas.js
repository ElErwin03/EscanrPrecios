import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colores } from '../config/theme';

const PESTANAS = [
  { id: 'venta', titulo: 'Escanear Cuenta' },
  { id: 'registro', titulo: 'Nuevo Producto' },
];

export default function Pestanas({ activa, onCambiar }) {
  return (
    <View style={estilos.contenedor}>
      {PESTANAS.map((p) => {
        const esActiva = p.id === activa;
        return (
          <TouchableOpacity
            key={p.id}
            style={[estilos.boton, esActiva && estilos.botonActivo]}
            onPress={() => onCambiar(p.id)}
          >
            <Text style={[estilos.texto, esActiva && estilos.textoActivo]}>{p.titulo}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flexDirection: 'row', backgroundColor: colores.blanco, elevation: 2 },
  boton: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  botonActivo: { borderBottomColor: colores.primario },
  texto: { fontSize: 16, fontWeight: '600', color: colores.textoSuave },
  textoActivo: { color: colores.primario },
});
