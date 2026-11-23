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

function FilaDevolucion({ devolucion, envio }) {
  const [abierta, setAbierta] = useState(false);
  const estado = ESTADOS[envio];
  const piezas = devolucion.articulos.reduce((s, a) => s + a.cantidad, 0);

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => setAbierta((v) => !v)} style={estilos.tarjeta}>
      <View style={estilos.cabecera}>
        <View style={estilos.izquierda}>
          <Text style={estilos.titulo}>↩ Devolución · {formatearHora(devolucion.timestamp)}</Text>
          <Text style={estilos.detalle}>
            {piezas} {piezas === 1 ? 'artículo' : 'artículos'} · <Text style={{ color: estado.color }}>{estado.texto}</Text>
          </Text>
        </View>
        <Text style={estilos.total}>−{formatearMonto(pesosACentavos(devolucion.total))}</Text>
      </View>

      {abierta && (
        <View style={estilos.cuerpo}>
          {devolucion.articulos.map((a) => (
            <View key={a.codigo} style={estilos.linea}>
              <Text style={estilos.lineaNombre} numberOfLines={1}>
                {a.cantidad} × {a.nombre}
              </Text>
              <Text style={estilos.lineaMonto}>{formatearMonto(pesosACentavos(a.precio) * a.cantidad)}</Text>
            </View>
          ))}
          <Text style={estilos.nota}>
            {devolucion.repuesto ? 'Las piezas regresaron al inventario' : 'Las piezas no regresaron al inventario'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default memo(FilaDevolucion);

const estilos = StyleSheet.create({
  tarjeta: { backgroundColor: '#fff5f5', borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#ffcdd2' },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  izquierda: { flex: 1, marginRight: 8 },
  titulo: { fontSize: 15, fontWeight: 'bold', color: colores.peligro },
  detalle: { fontSize: 12, color: colores.textoSuave, marginTop: 2 },
  total: { fontSize: 18, fontWeight: 'bold', color: colores.peligro },
  cuerpo: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#ffcdd2' },
  linea: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  lineaNombre: { flex: 1, fontSize: 14, color: colores.texto, marginRight: 8 },
  lineaMonto: { fontSize: 14, color: colores.texto },
  nota: { fontSize: 12, color: colores.textoClaro, marginTop: 6 },
});
