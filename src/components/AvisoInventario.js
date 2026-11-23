import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useProductos } from '../hooks/useProductos';
import { estadoStock, necesitaAviso } from '../utils/inventario';

// Franja permanente (mientras haya productos por reabastecer) para ir directo al inventario
export default function AvisoInventario({ onPress }) {
  const productos = useProductos();
  const { total, agotados } = useMemo(() => {
    const lista = productos.filter(necesitaAviso);
    return { total: lista.length, agotados: lista.filter((p) => estadoStock(p) === 'agotado').length };
  }, [productos]);

  if (total === 0) return null;

  const detalle = agotados > 0 ? ` (${agotados} agotado${agotados === 1 ? '' : 's'})` : '';
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={estilos.barra}>
      <Text style={estilos.texto}>
        📦 {total} {total === 1 ? 'producto' : 'productos'} con poco inventario{detalle} · toca para ver
      </Text>
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  barra: { backgroundColor: '#fff3e0', paddingVertical: 6, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#ffe0b2' },
  texto: { color: '#e65100', fontSize: 12, fontWeight: '700', textAlign: 'center' },
});
