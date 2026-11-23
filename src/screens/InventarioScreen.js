import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colores } from '../config/theme';
import { useProductos } from '../hooks/useProductos';
import { estadoStock, necesitaAviso } from '../utils/inventario';
import FilaInventario from '../components/FilaInventario';
import DetalleInventario from '../components/DetalleInventario';

const PRIORIDAD = { agotado: 0, bajo: 1, ok: 2, sinControl: 3 };

// minúsculas y sin acentos, para buscar "jabon" y encontrar "Jabón"
const normalizar = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function InventarioScreen({ filtroInicial = 'todos' }) {
  const productos = useProductos();
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState(filtroInicial); // 'todos' | 'bajo'
  const [seleccionado, setSeleccionado] = useState(null); // código

  // Primero lo más urgente (agotados, luego pocos), después por nombre
  const lista = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return productos
      .filter((p) => (filtro === 'todos' || necesitaAviso(p)) && (!q || normalizar(p.nombre).includes(q) || p.codigo.includes(q)))
      .sort((a, b) => {
        const d = PRIORIDAD[estadoStock(a)] - PRIORIDAD[estadoStock(b)];
        if (d !== 0) return d;
        const na = a.nombre.toLowerCase();
        const nb = b.nombre.toLowerCase();
        return na < nb ? -1 : na > nb ? 1 : 0;
      });
  }, [productos, busqueda, filtro]);

  const resumen = useMemo(() => {
    let agotados = 0;
    let bajos = 0;
    for (const p of productos) {
      const e = estadoStock(p);
      if (e === 'agotado') agotados += 1;
      else if (e === 'bajo') bajos += 1;
    }
    return { agotados, bajos };
  }, [productos]);

  const abrir = useCallback((codigo) => setSeleccionado(codigo), []);
  const renderItem = useCallback(({ item }) => <FilaInventario producto={item} onPress={abrir} />, [abrir]);

  const producto = seleccionado ? productos.find((p) => p.codigo === seleccionado) : null;
  if (producto) return <DetalleInventario producto={producto} onVolver={() => setSeleccionado(null)} />;

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.cabecera}>
        <TextInput style={estilos.buscador} value={busqueda} onChangeText={setBusqueda} placeholder="🔍 Buscar por nombre o código" clearButtonMode="while-editing" />
        <View style={estilos.filtros}>
          <Chip texto="Todos" activo={filtro === 'todos'} onPress={() => setFiltro('todos')} />
          <Chip
            texto={`Poco inventario (${resumen.agotados + resumen.bajos})`}
            activo={filtro === 'bajo'}
            alerta
            onPress={() => setFiltro('bajo')}
          />
        </View>
        {(resumen.agotados > 0 || resumen.bajos > 0) && (
          <Text style={estilos.resumen}>
            {resumen.agotados} agotado{resumen.agotados === 1 ? '' : 's'} · {resumen.bajos} con pocas piezas
          </Text>
        )}
      </View>

      <FlatList
        data={lista}
        keyExtractor={(p) => p.codigo}
        renderItem={renderItem}
        contentContainerStyle={estilos.lista}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={15}
        windowSize={7}
        ListEmptyComponent={
          <Text style={estilos.vacio}>
            {productos.length === 0
              ? 'Aún no hay productos. Regístralos en la pestaña Registrar.'
              : filtro === 'bajo' && !busqueda
              ? '✅ Todo en orden: no hay productos con poco inventario'
              : 'Sin resultados'}
          </Text>
        }
      />
    </View>
  );
}

function Chip({ texto, activo, onPress, alerta }) {
  return (
    <TouchableOpacity onPress={onPress} style={[estilos.chip, activo && (alerta ? estilos.chipAlerta : estilos.chipActivo)]}>
      <Text style={[estilos.chipTexto, activo && estilos.chipTextoActivo]}>{texto}</Text>
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1 },
  cabecera: { padding: 12, paddingBottom: 4 },
  buscador: { backgroundColor: colores.blanco, borderWidth: 1, borderColor: colores.borde, borderRadius: 8, padding: 10, fontSize: 15 },
  filtros: { flexDirection: 'row', marginTop: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: colores.blanco, borderWidth: 1, borderColor: colores.borde, marginRight: 8 },
  chipActivo: { backgroundColor: colores.primario, borderColor: colores.primario },
  chipAlerta: { backgroundColor: colores.advertencia, borderColor: colores.advertencia },
  chipTexto: { fontSize: 13, fontWeight: '600', color: colores.textoSuave },
  chipTextoActivo: { color: '#fff' },
  resumen: { fontSize: 12, color: colores.textoSuave, marginTop: 8 },
  lista: { padding: 12, paddingTop: 8 },
  vacio: { textAlign: 'center', color: colores.textoClaro, marginTop: 30, fontSize: 14, fontStyle: 'italic' },
});
