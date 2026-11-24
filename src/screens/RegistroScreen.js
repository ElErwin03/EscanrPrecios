import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, Vibration, View } from 'react-native';
import { colores, radio } from '../config/theme';
import { guardarProducto, obtenerProducto, mensajeDeError } from '../services/productosService';
import { useAviso } from '../hooks/useAviso';
import { confirmar } from '../utils/dialogos';
import { formatearMonto, parsearMonto } from '../utils/dinero';
import { obtenerEstado } from '../services/sincronizacion';
import EscanerCodigo from '../components/EscanerCodigo';
import Aviso from '../components/Aviso';

export default function RegistroScreen({ codigoInicial = '' }) {
  const [codigo, setCodigo] = useState(codigoInicial);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [guardando, setGuardando] = useState(false);
  const { aviso, mostrar } = useAviso();

  const refNombre = useRef(null);
  const refPrecio = useRef(null);

  const alEscanear = useCallback(
    (data) => {
      setCodigo(data);
      Vibration.vibrate(40);
      mostrar(`Código capturado: ${data}`);
      refNombre.current?.focus();
    },
    [mostrar]
  );

  const guardar = async () => {
    const codigoLimpio = codigo.trim();
    const nombreLimpio = nombre.trim();
    const precioCentavos = parsearMonto(precio);

    if (!codigoLimpio || !nombreLimpio || !precio.trim()) {
      Alert.alert('Campos vacíos', 'Por favor llena todos los campos o escanea un código.');
      return;
    }
    if (precioCentavos === null || precioCentavos <= 0) {
      Alert.alert('Precio inválido', 'Escribe un precio mayor a 0, por ejemplo 12 o 12.50');
      return;
    }

    setGuardando(true);
    try {
      // Evita sobrescribir sin querer un producto que ya existe
      const existente = await obtenerProducto(codigoLimpio, { soloLocal: true });
      if (existente) {
        const actualizar = await confirmar(
          'Producto ya registrado',
          `${existente.nombre} (${formatearMonto(existente.precioCentavos)}) ya usa este código.\n\n¿Quieres actualizarlo?`,
          { si: 'Actualizar' }
        );
        if (!actualizar) return;
      }

      await guardarProducto({ codigo: codigoLimpio, nombre: nombreLimpio, precioCentavos });
      mostrar(
        obtenerEstado().enLinea
          ? 'Producto guardado correctamente'
          : 'Guardado en el celular. Se enviará cuando haya internet.'
      );
      setCodigo('');
      setNombre('');
      setPrecio('');
    } catch (error) {
      Alert.alert('Error', mensajeDeError(error));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={estilos.contenedor} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
        <Text style={estilos.paso}>Paso 1: Enfoca el código</Text>
        <EscanerCodigo onCodigo={alEscanear} altura={130}>
          <Aviso aviso={aviso} />
        </EscanerCodigo>

        <Text style={[estilos.paso, { marginTop: 15 }]}>Paso 2: Detalles</Text>
        <View style={estilos.formulario}>
          <Text style={estilos.etiqueta}>Código de barras:</Text>
          <TextInput
            style={estilos.input}
            value={codigo}
            onChangeText={setCodigo}
            placeholder="Escanéalo o escríbelo"
            keyboardType="number-pad"
            returnKeyType="next"
            onSubmitEditing={() => refNombre.current?.focus()}
          />

          <Text style={estilos.etiqueta}>Nombre:</Text>
          <TextInput
            ref={refNombre}
            style={estilos.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej. Agua"
            returnKeyType="next"
            onSubmitEditing={() => refPrecio.current?.focus()}
          />

          <Text style={estilos.etiqueta}>Precio ($):</Text>
          <TextInput
            ref={refPrecio}
            style={estilos.input}
            value={precio}
            onChangeText={setPrecio}
            placeholder="Ej. 10"
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={guardar}
          />

          {guardando ? (
            <ActivityIndicator size="large" color={colores.guardar} />
          ) : (
            <TouchableOpacity style={estilos.btnGuardar} onPress={guardar}>
              <Text style={estilos.btnGuardarTexto}>Guardar Producto</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1 },
  contenido: { padding: 12 },
  paso: { fontSize: 13, fontWeight: 'bold', color: '#666', marginBottom: 6 },
  formulario: { backgroundColor: colores.blanco, padding: 20, borderRadius: radio, marginTop: 4, marginBottom: 30 },
  etiqueta: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 12, fontSize: 16 },
  btnGuardar: { backgroundColor: colores.guardar, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  btnGuardarTexto: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
