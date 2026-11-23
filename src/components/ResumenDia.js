import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colores, radio } from '../config/theme';
import { formatearMonto } from '../utils/dinero';

export default function ResumenDia({ netoCentavos, devolucionesCentavos, numVentas, numDevoluciones, numArticulos, sinEnviar }) {
  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.etiqueta}>{numDevoluciones > 0 ? 'VENTA NETA (SIN DEVOLUCIONES)' : 'TOTAL VENDIDO'}</Text>
      <Text style={estilos.total}>{formatearMonto(netoCentavos)}</Text>
      <View style={estilos.fila}>
        <Dato valor={numVentas} texto={numVentas === 1 ? 'venta' : 'ventas'} />
        <Dato valor={numArticulos} texto={Math.abs(numArticulos) === 1 ? 'artículo' : 'artículos'} />
        {numDevoluciones > 0 && (
          <Dato valor={`−${formatearMonto(devolucionesCentavos)}`} texto={numDevoluciones === 1 ? 'devolución' : 'devoluciones'} color={colores.peligro} />
        )}
        {sinEnviar > 0 && <Dato valor={sinEnviar} texto="sin enviar" color={colores.advertencia} />}
      </View>
    </View>
  );
}

function Dato({ valor, texto, color = colores.texto }) {
  return (
    <View style={estilos.dato}>
      <Text style={[estilos.datoValor, { color }]}>{valor}</Text>
      <Text style={estilos.datoTexto}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { backgroundColor: colores.blanco, borderRadius: radio, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colores.borde, alignItems: 'center' },
  etiqueta: { fontSize: 12, fontWeight: 'bold', color: '#666', letterSpacing: 1 },
  total: { fontSize: 36, fontWeight: 'bold', color: colores.exitoOscuro, marginVertical: 2 },
  fila: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: 4 },
  dato: { alignItems: 'center', marginHorizontal: 12 },
  datoValor: { fontSize: 18, fontWeight: 'bold' },
  datoTexto: { fontSize: 12, color: colores.textoSuave },
});
