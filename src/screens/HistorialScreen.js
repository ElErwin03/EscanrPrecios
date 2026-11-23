import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { colores } from '../config/theme';
import { useVentasLocales } from '../hooks/useVentasLocales';
import { useSincronizacion } from '../hooks/useSincronizacion';
import * as cola from '../services/colaSincronizacion';
import { devueltoPorVenta, esDevolucion, estadoDevolucion, resumirDia } from '../utils/devoluciones';
import { inicioDelDia, sumarDias, esMismoDia } from '../utils/fechas';
import SelectorDia from '../components/SelectorDia';
import ResumenDia from '../components/ResumenDia';
import FilaVenta from '../components/FilaVenta';
import FilaDevolucion from '../components/FilaDevolucion';
import DetalleDevolucion from '../components/DetalleDevolucion';

export default function HistorialScreen() {
  const [dia, setDia] = useState(() => inicioDelDia(Date.now()));
  const [devolviendoId, setDevolviendoId] = useState(null);
  const movimientos = useVentasLocales(); // ventas y devoluciones de este celular
  useSincronizacion(); // vuelve a dibujar cuando cambia el estado de envío
  const operaciones = cola.listar();

  // Qué piezas de cada venta ya se devolvieron (de cualquier día)
  const devueltos = useMemo(() => devueltoPorVenta(movimientos), [movimientos]);

  // Movimientos del día elegido, el más reciente primero
  const delDia = useMemo(() => {
    const fin = sumarDias(dia, 1);
    return movimientos.filter((m) => m.timestamp >= dia && m.timestamp < fin).reverse();
  }, [movimientos, dia]);

  // ¿Ya llegó a Firebase? Si sigue en la cola, no.
  const envios = useMemo(() => {
    const mapa = new Map();
    for (const op of operaciones) {
      if (op.tipo === 'venta' || op.tipo === 'devolucion') mapa.set(op.id, op.fallo ? 'error' : 'pendiente');
    }
    return mapa;
  }, [operaciones]);

  const resumen = useMemo(
    () => ({ ...resumirDia(delDia), sinEnviar: delDia.filter((m) => envios.has(m.id)).length }),
    [delDia, envios]
  );

  const anterior = useCallback(() => setDia((d) => sumarDias(d, -1)), []);
  const siguiente = useCallback(() => setDia((d) => (esMismoDia(d, Date.now()) ? d : sumarDias(d, 1))), []);
  const abrirDevolucion = useCallback((id) => setDevolviendoId(id), []);

  const renderItem = useCallback(
    ({ item }) =>
      esDevolucion(item) ? (
        <FilaDevolucion devolucion={item} envio={envios.get(item.id) ?? 'enviada'} />
      ) : (
        <FilaVenta
          venta={item}
          envio={envios.get(item.id) ?? 'enviada'}
          estadoDevolucion={estadoDevolucion(item, devueltos)}
          onDevolver={abrirDevolucion}
        />
      ),
    [envios, devueltos, abrirDevolucion]
  );

  const ventaADevolver = devolviendoId ? movimientos.find((m) => m.id === devolviendoId && !esDevolucion(m)) : null;
  if (ventaADevolver) {
    return <DetalleDevolucion venta={ventaADevolver} devueltos={devueltos} onVolver={() => setDevolviendoId(null)} />;
  }

  return (
    <View style={estilos.contenedor}>
      <FlatList
        data={delDia}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={estilos.contenido}
        initialNumToRender={12}
        windowSize={7}
        ListHeaderComponent={
          <>
            <SelectorDia dia={dia} onAnterior={anterior} onSiguiente={siguiente} />
            <ResumenDia {...resumen} />
            {delDia.length > 0 && <Text style={estilos.subtitulo}>Movimientos (el más reciente primero)</Text>}
          </>
        }
        ListEmptyComponent={<Text style={estilos.vacio}>No hay ventas registradas este día</Text>}
        ListFooterComponent={
          <Text style={estilos.nota}>
            Aquí aparecen las ventas y devoluciones hechas en este celular (últimos 30 días). Una devolución cuenta en el día en que se hace.
          </Text>
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
