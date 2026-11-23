import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { colores, radio } from '../config/theme';
import { registrarDevolucion } from '../services/ventasService';
import { confirmar } from '../utils/dialogos';
import { articulosDevolvibles } from '../utils/devoluciones';
import { formatearMonto, pesosACentavos } from '../utils/dinero';
import { formatearDia, formatearHora } from '../utils/fechas';

export default function DetalleDevolucion({ venta, devueltos, onVolver }) {
  // Solo lo que aún se puede devolver
  const lineas = useMemo(() => articulosDevolvibles(venta, devueltos).filter((l) => l.disponible > 0), [venta, devueltos]);
  const [cantidades, setCantidades] = useState({});
  const [reponer, setReponer] = useState(true);
  const [procesando, setProcesando] = useState(false);

  const totalCentavos = lineas.reduce((s, l) => s + pesosACentavos(l.precio) * (cantidades[l.codigo] ?? 0), 0);
  const piezas = lineas.reduce((s, l) => s + (cantidades[l.codigo] ?? 0), 0);

  const cambiar = (codigo, delta, max) =>
    setCantidades((c) => ({ ...c, [codigo]: Math.min(max, Math.max(0, (c[codigo] ?? 0) + delta)) }));
  const devolverTodo = () => setCantidades(Object.fromEntries(lineas.map((l) => [l.codigo, l.disponible])));

  const confirmarDevolucion = async () => {
    if (piezas === 0 || procesando) return;
    const ok = await confirmar(
      'Confirmar devolución',
      `Devuelve ${formatearMonto(totalCentavos)} al cliente (${piezas} ${piezas === 1 ? 'pieza' : 'piezas'}).\n\n` +
        (reponer ? 'Las piezas regresan al inventario.' : 'Las piezas NO regresan al inventario.'),
      { si: 'Devolver dinero', no: 'Revisar' }
    );
    if (!ok) return;

    setProcesando(true);
    try {
      const r = await registrarDevolucion({ venta, cantidades, reponer });
      setProcesando(false);
      onVolver();
      Alert.alert(
        'Devolución registrada',
        `Devuelve ${formatearMonto(r.totalCentavos)} al cliente.` +
          (r.piezasRepuestas > 0 ? `\n\n📦 ${r.piezasRepuestas} ${r.piezasRepuestas === 1 ? 'pieza regresó' : 'piezas regresaron'} al inventario.` : '')
      );
    } catch {
      setProcesando(false);
      Alert.alert('Error', 'No se pudo registrar la devolución en el celular. Intenta de nuevo.');
    }
  };

  return (
    <View style={estilos.contenedor}>
      <ScrollView contentContainerStyle={estilos.contenido}>
        <TouchableOpacity onPress={onVolver} hitSlop={8} style={estilos.volver}>
          <Text style={estilos.volverTexto}>‹ Volver al historial</Text>
        </TouchableOpacity>

        <View style={estilos.tarjeta}>
          <Text style={estilos.titulo}>↩ Devolución</Text>
          <Text style={estilos.sub}>
            Venta del {formatearDia(venta.timestamp)} a las {formatearHora(venta.timestamp)} · {formatearMonto(pesosACentavos(venta.total))}
          </Text>
        </View>

        {lineas.length === 0 ? (
          <Text style={estilos.vacio}>Ya se devolvió todo lo de esta venta.</Text>
        ) : (
          <>
            <View style={estilos.tarjeta}>
              <View style={estilos.encabezado}>
                <Text style={estilos.seccion}>¿Qué devuelve el cliente?</Text>
                <TouchableOpacity onPress={devolverTodo} hitSlop={8}>
                  <Text style={estilos.enlace}>Devolver todo</Text>
                </TouchableOpacity>
              </View>
              {lineas.map((l) => {
                const n = cantidades[l.codigo] ?? 0;
                return (
                  <View key={l.codigo} style={estilos.linea}>
                    <View style={estilos.lineaInfo}>
                      <Text style={estilos.lineaNombre} numberOfLines={1}>{l.nombre}</Text>
                      <Text style={estilos.lineaDetalle}>
                        {formatearMonto(pesosACentavos(l.precio))} c/u · se pueden devolver {l.disponible}
                      </Text>
                    </View>
                    <View style={estilos.cantidad}>
                      <TouchableOpacity style={estilos.btnCantidad} onPress={() => cambiar(l.codigo, -1, l.disponible)} hitSlop={8}>
                        <Text style={estilos.btnCantidadTexto}>−</Text>
                      </TouchableOpacity>
                      <Text style={[estilos.cantidadTexto, n > 0 && estilos.cantidadActiva]}>{n}</Text>
                      <TouchableOpacity style={estilos.btnCantidad} onPress={() => cambiar(l.codigo, 1, l.disponible)} hitSlop={8}>
                        <Text style={estilos.btnCantidadTexto}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={[estilos.tarjeta, estilos.fila]}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={estilos.seccion}>Regresar piezas al inventario</Text>
                <Text style={estilos.ayuda}>Desactívalo si el producto está dañado o caducado.</Text>
              </View>
              <Switch value={reponer} onValueChange={setReponer} trackColor={{ true: colores.guardar }} />
            </View>

            <View style={[estilos.tarjeta, estilos.reembolso]}>
              <Text style={estilos.reembolsoEtiqueta}>DINERO A DEVOLVER AL CLIENTE</Text>
              <Text style={estilos.reembolsoMonto}>{formatearMonto(totalCentavos)}</Text>
              <TouchableOpacity
                style={[estilos.btnConfirmar, (piezas === 0 || procesando) && estilos.btnOff]}
                disabled={piezas === 0 || procesando}
                onPress={confirmarDevolucion}
              >
                <Text style={estilos.btnConfirmarTexto}>Confirmar devolución</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1 },
  contenido: { padding: 12, paddingBottom: 40 },
  volver: { marginBottom: 10 },
  volverTexto: { color: colores.primario, fontSize: 15, fontWeight: '600' },
  tarjeta: { backgroundColor: colores.blanco, borderRadius: radio, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colores.borde },
  titulo: { fontSize: 20, fontWeight: 'bold', color: colores.peligro },
  sub: { fontSize: 13, color: colores.textoSuave, marginTop: 4 },
  vacio: { textAlign: 'center', color: colores.textoClaro, marginTop: 20, fontStyle: 'italic' },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  seccion: { fontSize: 15, fontWeight: 'bold', color: colores.texto },
  enlace: { color: colores.primario, fontWeight: 'bold', fontSize: 13 },
  linea: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  lineaInfo: { flex: 1, marginRight: 8 },
  lineaNombre: { fontSize: 15, fontWeight: '600', color: colores.texto },
  lineaDetalle: { fontSize: 12, color: colores.textoClaro, marginTop: 2 },
  cantidad: { flexDirection: 'row', alignItems: 'center' },
  btnCantidad: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#eceff1', alignItems: 'center', justifyContent: 'center' },
  btnCantidadTexto: { fontSize: 20, fontWeight: 'bold', color: colores.texto, lineHeight: 24 },
  cantidadTexto: { minWidth: 32, textAlign: 'center', fontSize: 17, fontWeight: 'bold', color: colores.textoClaro },
  cantidadActiva: { color: colores.peligro },
  fila: { flexDirection: 'row', alignItems: 'center' },
  ayuda: { fontSize: 12, color: colores.textoSuave, marginTop: 2 },
  reembolso: { alignItems: 'center' },
  reembolsoEtiqueta: { fontSize: 12, fontWeight: 'bold', color: '#666', letterSpacing: 1 },
  reembolsoMonto: { fontSize: 36, fontWeight: 'bold', color: colores.peligro, marginVertical: 4 },
  btnConfirmar: { alignSelf: 'stretch', backgroundColor: colores.peligro, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 6 },
  btnOff: { opacity: 0.35 },
  btnConfirmarTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
