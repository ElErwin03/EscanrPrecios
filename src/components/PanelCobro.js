import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colores, radio } from '../config/theme';
import { BILLETES_RAPIDOS, formatearMonto } from '../utils/dinero';

export default function PanelCobro({ totalCentavos, hayProductos, pagaCon, onCambiarPagaCon, cambioCentavos, onPagar }) {
  return (
    <View style={estilos.panel}>
      <View style={estilos.totalFila}>
        <Text style={estilos.totalEtiqueta}>TOTAL A PAGAR</Text>
        <Text style={estilos.totalMonto}>{formatearMonto(totalCentavos)}</Text>
      </View>

      {hayProductos && (
        <>
          <View style={estilos.fila}>
            <View style={estilos.columna}>
              <Text style={estilos.etiqueta}>¿Con cuánto paga?</Text>
              <TextInput
                style={estilos.input}
                placeholder="Ej. 100"
                keyboardType="decimal-pad"
                value={pagaCon}
                onChangeText={onCambiarPagaCon}
              />
            </View>
            <View style={[estilos.columna, estilos.centrado]}>
              <Text style={estilos.etiqueta}>Su cambio:</Text>
              <Text style={estilos.cambio}>{formatearMonto(cambioCentavos)}</Text>
            </View>
          </View>

          <View style={estilos.chips}>
            <TouchableOpacity style={estilos.chip} onPress={() => onCambiarPagaCon((totalCentavos / 100).toFixed(2))}>
              <Text style={estilos.chipTexto}>Exacto</Text>
            </TouchableOpacity>
            {BILLETES_RAPIDOS.map((b) => (
              <TouchableOpacity key={b} style={estilos.chip} onPress={() => onCambiarPagaCon(String(b))}>
                <Text style={estilos.chipTexto}>${b}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={estilos.btnPagar} onPress={onPagar}>
            <Text style={estilos.btnPagarTexto}>✔ FINALIZAR PAGO</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  panel: { backgroundColor: colores.blanco, borderTopLeftRadius: radio, borderTopRightRadius: radio, padding: 12, elevation: 8, borderTopWidth: 1, borderColor: colores.borde },
  totalFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  totalEtiqueta: { fontSize: 13, fontWeight: 'bold', color: '#666', letterSpacing: 1 },
  totalMonto: { fontSize: 32, fontWeight: 'bold', color: colores.exitoOscuro },
  fila: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  columna: { flex: 1, marginRight: 10 },
  centrado: { alignItems: 'center', justifyContent: 'center', marginRight: 0 },
  etiqueta: { fontSize: 13, fontWeight: 'bold', color: '#455a64', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#cfd8dc', borderRadius: 8, padding: 8, fontSize: 18, fontWeight: 'bold', backgroundColor: '#fafafa', color: colores.texto, textAlign: 'center' },
  cambio: { fontSize: 24, fontWeight: 'bold', color: colores.advertencia },
  chips: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  chip: { flex: 1, marginHorizontal: 2, paddingVertical: 8, borderRadius: 8, backgroundColor: '#e3f2fd', alignItems: 'center' },
  chipTexto: { color: '#1565c0', fontWeight: 'bold', fontSize: 13 },
  btnPagar: { backgroundColor: colores.exito, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  btnPagarTexto: { color: '#fff', fontSize: 15, fontWeight: 'bold', letterSpacing: 0.5 },
});
