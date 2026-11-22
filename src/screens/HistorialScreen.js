import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { colores } from '../config/theme';
import { useVentasLocales } from '../hooks/useVentasLocales';
import { useSincronizacion } from '../hooks/useSincronizacion';
import * as cola from '../services/colaSincronizacion';
import { pesosACentavos } from '../utils/dinero';
import { inicioDelDia, sumarDias, esMismoDia } from '../utils/fechas';
import SelectorDia from '../components/SelectorDia';
import ResumenDia from '../components/ResumenDia';
import FilaVenta from '../components/FilaVenta';

export default function HistorialScreen() {
  const [dia, setDia] = useState(() => inicioDelDia(Date.now()));
  const ventas = useVentasLocales();
  useSincronizacion(); // vuelve a dibujar cuando cambia el estado de envío
  const operaciones = cola.listar();

  // Ventas del día elegido, la más reciente primero
  const delDia = useMemo(() => {
    const fin = sumarDias(dia, 1);
    return ventas.filter((v) => v.timestamp >= dia && v.timestamp < fin).reverse();
  }, [ventas, dia]);

  // ¿Cada venta ya llegó a Firebase? Si sigue en la cola, no.
  const envios = useMemo(() => {
    const mapa = new Map();
    for (const op of operaciones) if (op.tipo === 'venta') mapa.set(op.id, op.fallo ? 'error' : 'pendiente');
    return mapa;
  }, [operaciones]);

  const resumen = useMemo(
    () => ({
      totalCentavos: delDia.reduce((s, v) => s + pesosACentavos(v.total), 0),
      numArticulos: delDia.reduce((s, v) => s + v.articulos.reduce((n, a) => n + a.cantidad, 0), 0),
      sinEnviar: delDia.filter((v) => envios.has(v.id)).length,
    }),
    [delDia, envios]
  );

  const anterior = useCallback(() => setDia((d) => sumarDias(d, -1)), []);
  const siguiente = useCallback(() => setDia((d) => (esMismoDia(d, Date.now()) ? d : sumarDias(d, 1))), []);

  const renderItem = useCallback(
    ({ item }) => <FilaVenta venta={item} envio={envios.get(item.id) ?? 'enviada'} />,
    [envios]
  );

  return (
    <View style={estilos.contenedor}>
      <FlatList
        data={delDia}
        keyExtractor={(v) => v.id}
        renderItem={renderItem}
        contentContainerStyle={estilos.contenido}
        initialNumToRender={12}
        windowSize={7}
        ListHeaderComponent={
          <>
            <SelectorDia dia={dia} onAnterior={anterior} onSiguiente={siguiente} />
            <ResumenDia numVentas={delDia.length} {...resumen} />
            {delDia.length > 0 && <Text style={estilos.subtitulo}>Ventas (la más reciente primero)</Text>}
          </>
        }
        ListEmptyComponent={<Text style={estilos.vacio}>No hay ventas registradas este día</Text>}
        ListFooterComponent={
          <Text style={estilos.nota}>Aquí aparecen las ventas hechas en este celular (últimos 30 días).</Text>
        }
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1 },
  contenido: { padding: 12 },
  subtitulo: { fontSize: 13, fontWeight: 'bold', color: '#444', marginBottom: 6 },
  vacio: { textAlign: 'center', color: colores.textoClaro, marginVertical: 24, fontSize: 14, fontStyle: 'italic' },
  nota: { textAlign: 'center', color: colores.textoClaro, fontSize: 11, marginTop: 8, marginBottom: 20 },
});
