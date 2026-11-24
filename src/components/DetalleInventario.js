import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { colores, radio } from '../config/theme';
import { useAviso } from '../hooks/useAviso';
import { agregarExistencia, fijarExistencia, fijarMinimo } from '../services/inventarioService';
import { cambiarPrecio } from '../services/productosService';
import { confirmar } from '../utils/dialogos';
import { formatearMonto, parsearMonto } from '../utils/dinero';
import { MINIMO_POR_DEFECTO, minimoEfectivo, parsearCantidad } from '../utils/inventario';
import Aviso from './Aviso';
import InsigniaStock, { colorDeStock } from './InsigniaStock';

export default function DetalleInventario({ producto, onVolver }) {
  const [llego, setLlego] = useState('');
  const [conteo, setConteo] = useState('');
  const [minimo, setMinimo] = useState('');
  const [precio, setPrecio] = useState('');
  const { aviso, mostrar } = useAviso(2500);

  const tieneControl = producto.stock != null;
  const llegoNum = parsearCantidad(llego);
  const nuevoPrecio = parsearMonto(precio);
  const diferencia = nuevoPrecio ? nuevoPrecio - producto.precioCentavos : 0;
  const porcentaje = Math.round((diferencia / producto.precioCentavos) * 100);

  const ejecutar = async (accion, mensajeOk) => {
    try {
      await accion();
      mostrar(mensajeOk);
    } catch {
      Alert.alert('Error', 'No se pudo guardar el cambio en el celular. Intenta de nuevo.');
    }
  };

  const guardarPrecio = async () => {
    if (nuevoPrecio === null || nuevoPrecio <= 0) {
      Alert.alert('Precio inválido', 'Escribe un precio mayor a 0, por ejemplo 20 o 20.50');
      return;
    }
    if (nuevoPrecio === producto.precioCentavos) {
      Alert.alert('Sin cambios', 'El producto ya tiene ese precio.');
      return;
    }
    // Protege contra errores de dedo (18 -> 180): pide confirmar los cambios grandes
    if (Math.abs(porcentaje) > 50) {
      const ok = await confirmar(
        '¿El precio es correcto?',
        `Cambiará de ${formatearMonto(producto.precioCentavos)} a ${formatearMonto(nuevoPrecio)} (${porcentaje > 0 ? '+' : ''}${porcentaje}%).`,
        { si: 'Sí, guardar', no: 'Corregir' }
      );
      if (!ok) return;
    }
    ejecutar(async () => {
      await cambiarPrecio(producto.codigo, nuevoPrecio);
      setPrecio('');
    }, `Precio actualizado: ${formatearMonto(nuevoPrecio)}`);
  };

  const agregar = () => {
    if (llegoNum === null || llegoNum <= 0) {
      Alert.alert('Cantidad inválida', 'Escribe cuántas piezas llegaron (un número entero mayor a 0).');
      return;
    }
    ejecutar(async () => {
      const nuevo = await agregarExistencia(producto.codigo, llegoNum);
      setLlego('');
      return nuevo;
    }, `+${llegoNum} agregadas · ahora hay ${(producto.stock ?? 0) + llegoNum}`);
  };

  const corregir = () => {
    const n = parsearCantidad(conteo);
    if (n === null) {
      Alert.alert('Cantidad inválida', 'Escribe la existencia real contada (un número entero, 0 o más).');
      return;
    }
    ejecutar(async () => {
      await fijarExistencia(producto.codigo, n);
      setConteo('');
    }, `Existencia corregida: ${n}`);
  };

  const guardarMinimo = () => {
    const vacio = minimo.trim() === '';
    const n = vacio ? null : parsearCantidad(minimo);
    if (!vacio && n === null) {
      Alert.alert('Cantidad inválida', 'Escribe un número entero, o deja vacío para usar el valor por defecto.');
      return;
    }
    ejecutar(async () => {
      await fijarMinimo(producto.codigo, n);
      setMinimo('');
    }, n === null ? `Aviso a las ${MINIMO_POR_DEFECTO} piezas (por defecto)` : `Se avisará cuando queden ${n} o menos`);
  };

  return (
    <KeyboardAvoidingView style={estilos.contenedor} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={onVolver} hitSlop={8} style={estilos.volver}>
          <Text style={estilos.volverTexto}>‹ Volver al inventario</Text>
        </TouchableOpacity>

        <View style={estilos.tarjeta}>
          <Text style={estilos.nombre}>{producto.nombre}</Text>
          <Text style={estilos.codigo}>
            {producto.codigo} · {formatearMonto(producto.precioCentavos)}
          </Text>
          <View style={estilos.existencia}>
            <Text style={[estilos.numeroGrande, { color: colorDeStock(producto) }]}>{tieneControl ? producto.stock : '—'}</Text>
            <Text style={estilos.existenciaTexto}>{tieneControl ? 'piezas en existencia' : 'sin control de inventario'}</Text>
            <InsigniaStock producto={producto} />
          </View>
          {!tieneControl && (
            <Text style={estilos.ayuda}>Al agregar existencias empezarás a controlar este producto: se descontará en cada venta.</Text>
          )}
        </View>

        <View style={estilos.tarjeta}>
          <Text style={estilos.seccion}>💲 Cambiar precio</Text>
          <Text style={estilos.ayuda}>
            Precio actual: {formatearMonto(producto.precioCentavos)}. Las ventas ya hechas conservan el precio al que se vendieron.
          </Text>
          <TextInput style={estilos.input} value={precio} onChangeText={setPrecio} placeholder="Nuevo precio. Ej. 20.50" keyboardType="decimal-pad" />
          {nuevoPrecio > 0 && diferencia !== 0 && (
            <Text style={[estilos.vista, diferencia > 0 && { color: colores.advertencia }]}>
              {diferencia > 0 ? '▲ Sube' : '▼ Baja'} {formatearMonto(Math.abs(diferencia))} ({diferencia > 0 ? '+' : ''}{porcentaje}%)
            </Text>
          )}
          <TouchableOpacity style={[estilos.boton, { backgroundColor: colores.primario }]} onPress={guardarPrecio}>
            <Text style={estilos.botonTexto}>Guardar precio</Text>
          </TouchableOpacity>
        </View>

        <View style={estilos.tarjeta}>
          <Text style={estilos.seccion}>📥 Llegó mercancía</Text>
          <TextInput style={estilos.input} value={llego} onChangeText={setLlego} placeholder="¿Cuántas piezas llegaron? Ej. 24" keyboardType="number-pad" />
          {llegoNum > 0 && (
            <Text style={estilos.vista}>Quedará en: {(producto.stock ?? 0) + llegoNum} piezas</Text>
          )}
          <TouchableOpacity style={[estilos.boton, { backgroundColor: colores.guardar }]} onPress={agregar}>
            <Text style={estilos.botonTexto}>Agregar al inventario</Text>
          </TouchableOpacity>
        </View>

        <View style={estilos.tarjeta}>
          <Text style={estilos.seccion}>🧮 Corregir existencia (conteo real)</Text>
          <TextInput style={estilos.input} value={conteo} onChangeText={setConteo} placeholder="Piezas que hay realmente" keyboardType="number-pad" />
          <TouchableOpacity style={[estilos.boton, { backgroundColor: colores.primario }]} onPress={corregir}>
            <Text style={estilos.botonTexto}>Corregir existencia</Text>
          </TouchableOpacity>
        </View>

        <View style={estilos.tarjeta}>
          <Text style={estilos.seccion}>🔔 Avisar cuando queden pocas</Text>
          <Text style={estilos.ayuda}>
            Avisa cuando queden {minimoEfectivo(producto)} o menos{producto.stockMinimo == null ? ' (valor por defecto)' : ''}.
          </Text>
          <TextInput style={estilos.input} value={minimo} onChangeText={setMinimo} placeholder={`Nuevo mínimo (vacío = ${MINIMO_POR_DEFECTO})`} keyboardType="number-pad" />
          <TouchableOpacity style={[estilos.boton, { backgroundColor: colores.advertencia }]} onPress={guardarMinimo}>
            <Text style={estilos.botonTexto}>Guardar aviso</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Aviso aviso={aviso} />
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1 },
  contenido: { padding: 12, paddingBottom: 60 },
  volver: { marginBottom: 10 },
  volverTexto: { color: colores.primario, fontSize: 15, fontWeight: '600' },
  tarjeta: { backgroundColor: colores.blanco, borderRadius: radio, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colores.borde },
  nombre: { fontSize: 20, fontWeight: 'bold', color: colores.texto },
  codigo: { fontSize: 13, color: colores.textoClaro, marginTop: 2 },
  existencia: { alignItems: 'center', marginTop: 10 },
  numeroGrande: { fontSize: 48, fontWeight: 'bold' },
  existenciaTexto: { fontSize: 13, color: colores.textoSuave },
  ayuda: { fontSize: 12, color: colores.textoSuave, marginTop: 6, marginBottom: 6 },
  seccion: { fontSize: 15, fontWeight: 'bold', color: colores.texto, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, fontSize: 16, marginBottom: 8, backgroundColor: '#fafafa' },
  vista: { fontSize: 13, color: colores.exitoOscuro, fontWeight: '600', marginBottom: 8 },
  boton: { paddingVertical: 11, borderRadius: 8, alignItems: 'center' },
  botonTexto: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
