import React, { useCallback, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { colores } from '../config/theme';
import { obtenerProducto, mensajeDeError } from '../services/productosService';
import { registrarVenta } from '../services/ventasService';
import { obtenerEstado } from '../services/sincronizacion';
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
  const [cobrando, setCobrando] = useState(false);

  // Se ejecuta por cada código leído. El escáner espera a que termine antes de aceptar otro.
  const manejarCodigo = useCallback(
    async (codigo) => {
      try {
        const producto = await obtenerProducto(codigo);
        if (producto) {
          agregar(producto);
          Vibration.vibrate(40);
          // Se vende igual (el conteo puede estar desactualizado), pero se avisa
          const sinExistencias = producto.stock != null && producto.stock <= 0;
          mostrar(
            sinExistencias
              ? `${producto.nombre} · ⚠️ sin existencias registradas`
              : `${producto.nombre}  ${formatearMonto(producto.precioCentavos)}`,
            sinExistencias ? 'alerta' : 'ok'
          );
        } else {
          Vibration.vibrate([0, 80, 60, 80]);
          const registrar = await confirmar(
            'Producto no encontrado',
            `El código ${codigo} no está registrado.` +
              (obtenerEstado().enLinea ? '' : '\n\n📴 Sin conexión: se guardará en el celular y se enviará después.') +
              '\n\n¿Quieres registrarlo?',
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

  const finalizarPago = async () => {
    if (cobrando) return;
    if (!alcanza) {
      Alert.alert('Monto insuficiente', 'El dinero recibido es menor al total a pagar.');
      return;
    }
    setCobrando(true);
    let bajos = [];
    try {
      // Se guarda en el celular al instante; se envía a Firebase cuando hay internet
      ({ bajos } = await registrarVenta({ items, totalCentavos, recibidoCentavos: efectivoCentavos, cambioCentavos }));
    } catch {
      setCobrando(false);
      Alert.alert('Error', 'No se pudo guardar la venta en el celular. Intenta de nuevo.');
      return;
    }
    const resumen =
      `Total cobrado: ${formatearMonto(totalCentavos)}\n` +
      `Efectivo recibido: ${formatearMonto(efectivoCentavos)}\n` +
      `Cambio devuelto: ${formatearMonto(cambioCentavos)}` +
      (obtenerEstado().enLinea ? '' : '\n\n📴 Guardada en el celular; se enviará al volver el internet.') +
      (bajos.length > 0
        ? '\n\n⚠️ Reabastecer pronto:\n' +
          bajos.map((b) => (b.estado === 'agotado' ? `• ${b.nombre}: AGOTADO` : `• ${b.nombre}: quedan ${b.stock}`)).join('\n')
        : '');
    limpiar();
    setPagaCon('');
    setCobrando(false);
    Alert.alert('¡Venta exitosa!', resumen);
  };

  const cancelarCuenta = async () => {
    const si = await confirmar(
      'Cancelar venta',
      `Se borrarán los ${totalArticulos} artículos de esta cuenta. No se cobra nada ni se descuenta del inventario.`,
      { si: 'Sí, cancelar', no: 'Seguir vendiendo' }
    );
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
          <TouchableOpacity onPress={cancelarCuenta} hitSlop={8} style={estilos.btnCancelar}>
            <Text style={estilos.btnCancelarTexto}>✕ Cancelar venta</Text>
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
  btnCancelar: { borderWidth: 1, borderColor: colores.peligro, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
  btnCancelarTexto: { fontSize: 12, fontWeight: 'bold', color: colores.peligro },
  lista: { flex: 1, paddingHorizontal: 12 },
  vacio: { textAlign: 'center', color: colores.textoClaro, marginTop: 20, fontSize: 14, fontStyle: 'italic' },
});
