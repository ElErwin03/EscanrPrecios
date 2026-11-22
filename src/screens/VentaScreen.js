import React, { useCallback, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { colores } from '../config/theme';
import { obtenerProducto, mensajeDeError } from '../services/productosService';
import { useAviso } from '../hooks/useAviso';
import { confirmar } from '../utils/dialogos';
import { formatearMonto, parsearMonto } from '../utils/dinero';
import EscanerCodigo from '../components/EscanerCodigo';
import Aviso from '../components/Aviso';
import ItemCuenta from '../components/ItemCuenta';
import PanelCobro from '../components/PanelCobro';

export default function VentaScreen({ cuenta, onRegistrarCodigo }) {
  const { items, totalCentavos, totalArticulos, agregar, incrementar, decrementar, limpiar } = cuenta;
  const { aviso, mostrar } = useAviso();
  const [pagaCon, setPagaCon] = useState('');

  // Se ejecuta por cada código leído. El escáner espera a que termine antes de aceptar otro.
  const manejarCodigo = useCallback(
    async (codigo) => {
      try {
        const producto = await obtenerProducto(codigo);
        if (producto) {
          agregar(producto);
          Vibration.vibrate(40);
          mostrar(`${producto.nombre}  ${formatearMonto(producto.precioCentavos)}`);
        } else {
          Vibration.vibrate([0, 80, 60, 80]);
          const registrar = await confirmar(
            'Producto no encontrado',
            `El código ${codigo} no está registrado.\n\n¿Quieres registrarlo?`,
            { si: 'Registrar' }
          );
          if (registrar) onRegistrarCodigo(codigo);
        }
      } catch (error) {
        Vibration.vibrate([0, 80, 60, 80]);
        mostrar(mensajeDeError(error), 'error');
      }
    },
    [agregar, onRegistrarCodigo, mostrar]
  );

  // El cobro se calcula a partir del estado (no se guarda aparte): siempre es coherente
  const efectivoCentavos = parsearMonto(pagaCon);
  const alcanza = efectivoCentavos !== null && efectivoCentavos >= totalCentavos;
  const cambioCentavos = alcanza ? efectivoCentavos - totalCentavos : 0;

  const finalizarPago = () => {
    if (!alcanza) {
      Alert.alert('Monto insuficiente', 'El dinero recibido es menor al total a pagar.');
      return;
    }
    const resumen =
      `Total cobrado: ${formatearMonto(totalCentavos)}\n` +
      `Efectivo recibido: ${formatearMonto(efectivoCentavos)}\n` +
      `Cambio devuelto: ${formatearMonto(cambioCentavos)}`;
    limpiar();
    setPagaCon('');
    Alert.alert('¡Venta exitosa!', resumen);
  };

  const cancelarCuenta = async () => {
    const si = await confirmar('Cancelar cuenta', '¿Quieres borrar todos los productos de esta cuenta?', { si: 'Borrar' });
    if (si) {
      limpiar();
      setPagaCon('');
    }
  };

  const renderItem = useCallback(
    ({ item }) => <ItemCuenta item={item} onIncrementar={incrementar} onDecrementar={decrementar} />,
    [incrementar, decrementar]
  );

  return (
    <KeyboardAvoidingView style={estilos.contenedor} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={estilos.camara}>
        <EscanerCodigo onCodigo={manejarCodigo} altura={150}>
          <Aviso aviso={aviso} />
        </EscanerCodigo>
      </View>

      <View style={estilos.encabezadoLista}>
        <Text style={estilos.listaTitulo}>Productos en esta cuenta ({totalArticulos})</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={cancelarCuenta} hitSlop={8}>
            <Text style={estilos.btnLimpiar}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        style={estilos.lista}
        data={items}
        keyExtractor={(item) => item.codigo}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        windowSize={7}
        removeClippedSubviews
        ListEmptyComponent={<Text style={estilos.vacio}>Escanea un producto para iniciar la cuenta</Text>}
      />

      <PanelCobro
        totalCentavos={totalCentavos}
        hayProductos={items.length > 0}
        pagaCon={pagaCon}
        onCambiarPagaCon={setPagaCon}
        cambioCentavos={cambioCentavos}
        onPagar={finalizarPago}
      />
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1 },
  camara: { paddingHorizontal: 12, paddingTop: 12 },
  encabezadoLista: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, marginTop: 12, marginBottom: 6 },
  listaTitulo: { fontSize: 14, fontWeight: 'bold', color: '#444' },
  btnLimpiar: { fontSize: 14, fontWeight: 'bold', color: colores.peligro },
  lista: { flex: 1, paddingHorizontal: 12 },
  vacio: { textAlign: 'center', color: colores.textoClaro, marginTop: 20, fontSize: 14, fontStyle: 'italic' },
});
