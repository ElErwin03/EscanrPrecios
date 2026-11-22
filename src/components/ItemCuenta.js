import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colores } from '../config/theme';
import { formatearMonto } from '../utils/dinero';

// memo: al escanear solo se vuelve a dibujar la fila que cambió, no toda la lista
function ItemCuenta({ item, onIncrementar, onDecrementar }) {
  return (
    <View style={estilos.fila}>
      <View style={estilos.info}>
        <Text style={estilos.nombre} numberOfLines={1}>{item.nombre}</Text>
        <Text style={estilos.detalle}>
          {item.cantidad} × {formatearMonto(item.precioCentavos)}
        </Text>
      </View>

      <View style={estilos.cantidad}>
        <TouchableOpacity style={estilos.btnCantidad} onPress={() => onDecrementar(item.codigo)} hitSlop={8}>
          <Text style={estilos.btnCantidadTexto}>−</Text>
        </TouchableOpacity>
        <Text style={estilos.cantidadTexto}>{item.cantidad}</Text>
        <TouchableOpacity style={estilos.btnCantidad} onPress={() => onIncrementar(item.codigo)} hitSlop={8}>
          <Text style={estilos.btnCantidadTexto}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={estilos.subtotal}>{formatearMonto(item.precioCentavos * item.cantidad)}</Text>
    </View>
  );
}

export default memo(ItemCuenta);

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', backgroundColor: colores.blanco, padding: 10, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  info: { flex: 1, marginRight: 8 },
  nombre: { fontSize: 16, fontWeight: '600', color: colores.texto },
  detalle: { fontSize: 12, color: colores.textoClaro, marginTop: 2 },
  cantidad: { flexDirection: 'row', alignItems: 'center', marginRight: 10 },
  btnCantidad: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#eceff1', alignItems: 'center', justifyContent: 'center' },
  btnCantidadTexto: { fontSize: 18, fontWeight: 'bold', color: colores.texto, lineHeight: 22 },
  cantidadTexto: { minWidth: 26, textAlign: 'center', fontSize: 15, fontWeight: 'bold', color: colores.texto },
  subtotal: { minWidth: 64, textAlign: 'right', fontSize: 16, fontWeight: 'bold', color: '#2e7d32' },
});
