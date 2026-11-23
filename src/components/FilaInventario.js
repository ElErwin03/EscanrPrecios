import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colores } from '../config/theme';
import { formatearMonto } from '../utils/dinero';
import InsigniaStock, { colorDeStock } from './InsigniaStock';

function FilaInventario({ producto, onPress }) {
  const tieneControl = producto.stock != null;
  return (
    <TouchableOpacity activeOpacity={0.8} style={estilos.fila} onPress={() => onPress(producto.codigo)}>
      <View style={estilos.info}>
        <Text style={estilos.nombre} numberOfLines={1}>{producto.nombre}</Text>
        <Text style={estilos.detalle} numberOfLines={1}>
          {producto.codigo} · {formatearMonto(producto.precioCentavos)}
        </Text>
        <InsigniaStock producto={producto} />
      </View>
      <View style={estilos.cantidad}>
        <Text style={[estilos.numero, { color: colorDeStock(producto) }]}>{tieneControl ? producto.stock : '—'}</Text>
        <Text style={estilos.unidad}>{tieneControl ? (producto.stock === 1 ? 'pieza' : 'piezas') : ''}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default memo(FilaInventario);

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', backgroundColor: colores.blanco, borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  info: { flex: 1, marginRight: 8 },
  nombre: { fontSize: 16, fontWeight: '600', color: colores.texto },
  detalle: { fontSize: 12, color: colores.textoClaro, marginTop: 2 },
  cantidad: { alignItems: 'center', minWidth: 60 },
  numero: { fontSize: 26, fontWeight: 'bold' },
  unidad: { fontSize: 11, color: colores.textoSuave },
});
