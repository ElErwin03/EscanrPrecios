import React, { memo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colores } from '../config/theme';
import { formatearMonto, pesosACentavos } from '../utils/dinero';
import { formatearHora } from '../utils/fechas';

const ESTADOS = {
  enviada: { texto: '✔ Enviada', color: colores.exitoOscuro },
  pendiente: { texto: '⏳ Por enviar', color: colores.advertencia },
  error: { texto: '⚠️ Error al enviar', color: colores.peligro },
};

// Toca la fila para ver los productos de la venta
function FilaVenta({ venta, envio }) {
  const [abierta, setAbierta] = useState(false);
  const estado = ESTADOS[envio];
  const numArticulos = venta.articulos.reduce((s, a) => s + a.cantidad, 0);

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => setAbierta((v) => !v)} style={estilos.tarjeta}>
      <View style={estilos.cabecera}>
        <View style={estilos.izquierda}>
          <Text style={estilos.hora}>{formatearHora(venta.timestamp)}</Text>
          <Text style={estilos.detalle}>
            {numArticulos} {numArticulos === 1 ? 'artículo' : 'artículos'} · <Text style={{ color: estado.color }}>{estado.texto}</Text>
          </Text>
        </View>
        <Text style={estilos.total}>{formatearMonto(pesosACentavos(venta.total))}</Text>
      </View>

      {abierta && (
        <View style={estilos.cuerpo}>
          {venta.articulos.map((a) => (
            <View key={a.codigo} style={estilos.linea}>
              <Text style={estilos.lineaNombre} numberOfLines={1}>
                {a.cantidad} × {a.nombre}
              </Text>
              <Text style={estilos.lineaMonto}>{formatearMonto(pesosACentavos(a.precio) * a.cantidad)}</Text>
            </View>
          ))}
          <View style={estilos.pago}>
            <Text style={estilos.pagoTexto}>Recibido {formatearMonto(pesosACentavos(venta.recibido))}</Text>
            <Text style={estilos.pagoTexto}>Cambio {formatearMonto(pesosACentavos(venta.cambio))}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default memo(FilaVenta);

const estilos = StyleSheet.create({
  tarjeta: { backgroundColor: colores.blanco, borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  izquierda: { flex: 1, marginRight: 8 },
  hora: { fontSize: 16, fontWeight: 'bold', color: colores.texto },
  detalle: { fontSize: 12, color: colores.textoSuave, marginTop: 2 },
  total: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32' },
  cuerpo: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#eee' },
  linea: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  lineaNombre: { flex: 1, fontSize: 14, color: colores.texto, marginRight: 8 },
  lineaMonto: { fontSize: 14, color: colores.texto },
  pago: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  pagoTexto: { fontSize: 12, color: colores.textoClaro },
});
