import React, { useState } from 'react';
import { StyleSheet, Text, View, Button, ActivityIndicator, Alert, TextInput, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

// IMPORTAR CONFIGURACIÓN DE FIREBASE
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set } from 'firebase/database';

// OBJETOS FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyD8sSxCABWpwgPYcQ-QEfl-AKkqQAf4T-E",
  authDomain: "escanearprecios.firebaseapp.com",
  databaseURL: "https://escanearprecios-default-rtdb.firebaseio.com", 
  projectId: "escanearprecios",
  storageBucket: "escanearprecios.firebasestorage.app",
  messagingSenderId: "443648127078",
  appId: "1:443648127078:web:eaa752c88ac69fdc11fda7"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState('scan'); 
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estado para almacenar la lista de la cuenta
  const [listaCuenta, setListaCuenta] = useState([]);

  // NUEVO: Estado para el manejo del dinero recibido del cliente
  const [pagaCon, setPagaCon] = useState('');

  const [nuevoCodigo, setNuevoCodigo] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [guardando, setGuardando] = useState(false);

  if (!permission) {
    return <View style={styles.container}><ActivityIndicator size="large" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginBottom: 10 }}>Necesitamos permiso para usar la cámara</Text>
        <Button onPress={requestPermission} title="Conceder Permiso" />
      </View>
    );
  }

  // LÓGICA AL ESCANEAR: BUSCAR EN FIREBASE Y AGREGAR A LA CUENTA
  const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);
    setLoading(true);

    try {
      const productRef = ref(db, 'productos/' + data);
      const snapshot = await get(productRef);

      if (snapshot.exists()) {
        const productoEncontrado = snapshot.val();
        
        const nuevoItem = {
          id: `${data}-${Date.now()}`, 
          codigo: data,
          nombre: productoEncontrado.nombre,
          precio: parseFloat(productoEncontrado.precio)
        };

        setListaCuenta(prevProductos => [nuevoItem, ...prevProductos]);
        Alert.alert("Agregado", `${productoEncontrado.nombre} por $${nuevoItem.precio.toFixed(2)}`);
      } else {
        Alert.alert(
          "Producto no encontrado", 
          `El código ${data} no está registrado.\n\n¿Quieres registrarlo?`,
          [
            { text: "Cancelar", style: "cancel", onPress: () => setScanned(false) },
            { text: "Registrar", onPress: () => { setMode('register'); setNuevoCodigo(data); } }
          ]
        );
      }
    } catch (err) {
      Alert.alert("Error", "Ocurrió un problema al consultar la base de datos.");
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeForRegister = ({ data }) => {
    setScanned(true);
    setNuevoCodigo(data);
    Alert.alert("Código Capturado", `Se cargó el código: ${data}`);
  };

  // GUARDAR PRODUCTO NUEVO EN FIREBASE
  const guardarProducto = async () => {
    if (!nuevoCodigo || !nuevoNombre || !nuevoPrecio) {
      Alert.alert("Campos vacíos", "Por favor llena todos los campos o escanea un código.");
      return;
    }

    setGuardando(true);

    try {
      await set(ref(db, 'productos/' + nuevoCodigo), {
        nombre: nuevoNombre,
        precio: parseFloat(nuevoPrecio)
      });

      Alert.alert("¡Éxito!", "Producto registrado correctamente en Firebase.");
      setNuevoCodigo('');
      setNuevoNombre('');
      setNuevoPrecio('');
      setScanned(false);
    } catch (err) {
      Alert.alert("Error", "No se pudo guardar el producto.");
    } finally {
      setGuardando(false);
    }
  };

  // Calcular el total numérico de la cuenta
  const obtenerTotalNumerico = () => {
    return listaCuenta.reduce((suma, item) => suma + item.precio, 0);
  };

  // NUEVO: Calcular el cambio en tiempo real
  const calcularCambio = () => {
    const total = obtenerTotalNumerico();
    const efectivo = parseFloat(pagaCon);
    if (isNaN(efectivo) || efectivo < total) return "0.00";
    return (efectivo - total).toFixed(2);
  };

  // NUEVO: Lógica del Botón Procesar Pago Final
  const finalizarPago = () => {
    const total = obtenerTotalNumerico();
    const efectivo = parseFloat(pagaCon);

    if (isNaN(efectivo) || efectivo < total) {
      Alert.alert("Monto insuficiente", "El dinero recibido es menor al total a pagar.");
      return;
    }

    Alert.alert(
      "¡Venta Exitosa!",
      `Total cobrado: $${total.toFixed(2)}\nEfectivo recibido: $${efectivo.toFixed(2)}\nCambio devuelto: $${calcularCambio()}`,
      [
        { 
          text: "Aceptar", 
          onPress: () => {
            setListaCuenta([]);
            setPagaCon('');
            setScanned(false);
          } 
        }
      ]
    );
  };

  const borrarCuenta = () => {
    setListaCuenta([]);
    setPagaCon('');
    setScanned(false);
  };

  return (
    <View style={styles.container}>
      {/* Pestañas de Navegación */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, mode === 'scan' && styles.activeTab]} 
          onPress={() => { setMode('scan'); setScanned(false); }}
        >
          <Text style={[styles.tabText, mode === 'scan' && styles.activeTabText]}>Escanear Cuenta</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, mode === 'register' && styles.activeTab]} 
          onPress={() => { setMode('register'); setScanned(false); }}
        >
          <Text style={[styles.tabText, mode === 'register' && styles.activeTabText]}>Nuevo Producto</Text>
        </TouchableOpacity>
      </View>

      {/* MODO ESCANEAR / CARRITO */}
      {mode === 'scan' && (
        <View style={styles.contentContainer}>
          {/* Cámara de escaneo */}
          <View style={styles.cameraContainer}>
            {mode === 'scan' && !scanned && (
              <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={handleBarCodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "code128"] }}
              />
            )}
            {scanned && !loading && (
              <TouchableOpacity style={styles.btnReactivarCamara} onPress={() => setScanned(false)}>
                <Text style={styles.btnReactivarCamaraText}>Presiona para Escanear Siguiente</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading && <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 10 }} />}

          {/* Tarjeta del Total a Pagar */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>TOTAL A PAGAR:</Text>
            <Text style={styles.totalAmount}>${obtenerTotalNumerico().toFixed(2)}</Text>
          </View>

          {/* NUEVO: Panel de Caja Registradora (Efectivo y Cambio) */}
          {listaCuenta.length > 0 && (
            <View style={styles.cajaCobroContainer}>
              <View style={styles.rowCobro}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.labelCobro}>¿Con cuánto paga?</Text>
                  <TextInput
                    style={styles.inputCobro}
                    placeholder="Ej. 100"
                    keyboardType="numeric"
                    value={pagaCon}
                    onChangeText={setPagaCon}
                  />
                </View>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={styles.labelCobro}>Su Cambio:</Text>
                  <Text style={styles.txtCambio}>${calcularCambio()}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.btnPagar} onPress={finalizarPago}>
                <Text style={styles.btnPagarText}>✔ FINALIZAR PAGO</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Lista de productos agregados */}
          <Text style={styles.listaTitulo}>Productos en esta cuenta ({listaCuenta.length}):</Text>
          
          <FlatList
            data={listaCuenta}
            keyExtractor={(item) => item.id}
            style={styles.listaScroll}
            renderItem={({ item }) => (
              <View style={styles.itemCarrito}>
                <View>
                  <Text style={styles.itemNombre}>{item.nombre}</Text>
                  <Text style={styles.itemCodigo}>{item.codigo}</Text>
                </View>
                <Text style={styles.itemPrecio}>${item.precio.toFixed(2)}</Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.listaVaciaText}>Escanea un producto para iniciar la cuenta</Text>
            }
          />

          {/* Botón para resetear la transacción */}
          {listaCuenta.length > 0 && (
            <TouchableOpacity style={styles.btnLimpiar} onPress={borrarCuenta}>
              <Text style={styles.btnLimpiarText}>Cancelar Cuenta / Limpiar</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* MODO REGISTRAR NUEVO PRODUCTO */}
      {mode === 'register' && (
        <ScrollView contentContainerStyle={styles.contentContainer} style={{ width: '100%' }}>
          <Text style={styles.instructionText}>Paso 1: Enfoca el código</Text>
          <View style={[styles.cameraContainer, { height: 130 }]}>
            {mode === 'register' && !scanned && (
              <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={handleBarcodeForRegister}
                barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "code128"] }}
              />
            )}
            {scanned && (
              <TouchableOpacity style={styles.btnReactivarCamara} onPress={() => setScanned(false)}>
                <Text style={styles.btnReactivarCamaraText}>Volver a escanear código</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.instructionText, { marginTop: 15 }]}>Paso 2: Detalles</Text>
          <View style={styles.formCard}>
            <Text style={styles.label}>Código de Barras:</Text>
            <TextInput style={[styles.input, { backgroundColor: '#e0e0e0' }]} value={nuevoCodigo} onChangeText={setNuevoCodigo} editable={false} />

            <Text style={styles.label}>Nombre:</Text>
            <TextInput style={styles.input} value={nuevoNombre} onChangeText={setNuevoNombre} placeholder="Ej. Agua" />

            <Text style={styles.label}>Precio ($):</Text>
            <TextInput style={styles.input} value={nuevoPrecio} onChangeText={setNuevoPrecio} placeholder="Ej. 10" keyboardType="numeric" />

            {guardando ? (
              <ActivityIndicator size="large" color="#4CAF50" />
            ) : (
              <TouchableOpacity style={styles.submitButton} onPress={guardarProducto}>
                <Text style={styles.submitButtonText}>Guardar Producto</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 40 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', elevation: 2 },
  tabButton: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#2196F3' },
  tabText: { fontSize: 16, fontWeight: '600', color: '#777' },
  activeTabText: { color: '#2196F3' },
  contentContainer: { alignItems: 'center', paddingVertical: 15, flex: 1 },
  cameraContainer: { width: '85%', height: 160, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  
  totalContainer: { marginTop: 12, backgroundColor: '#fff', borderRadius: 12, width: '85%', padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0', elevation: 2 },
  totalLabel: { fontSize: 13, fontWeight: 'bold', color: '#666', letterSpacing: 1 },
  totalAmount: { fontSize: 34, fontWeight: 'bold', color: '#1b5e20', marginTop: 2 },
  
  // NUEVOS ESTILOS DEL MÓDULO DE COBRO
  cajaCobroContainer: { backgroundColor: '#fff', width: '85%', borderRadius: 12, padding: 12, marginTop: 10, borderWidth: 1, borderColor: '#b0bec5', elevation: 3 },
  rowCobro: { flexDirection: 'row', marginBottom: 10, alignItems: 'center' },
  labelCobro: { fontSize: 13, fontWeight: 'bold', color: '#455a64', marginBottom: 4 },
  inputCobro: { borderWidth: 1, borderColor: '#cfd8dc', borderRadius: 8, padding: 8, fontSize: 18, fontWeight: 'bold', backgroundColor: '#fafafa', color: '#333', textAlign: 'center' },
  txtCambio: { fontSize: 24, fontWeight: 'bold', color: '#e65100', marginTop: 2 },
  btnPagar: { backgroundColor: '#00c853', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  btnPagarText: { color: '#fff', fontSize: 15, fontWeight: 'bold', letterSpacing: 0.5 },

  listaTitulo: { width: '85%', fontSize: 14, fontWeight: 'bold', color: '#444', marginTop: 12, marginBottom: 5 },
  listaScroll: { width: '85%', flex: 1 },
  itemCarrito: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  itemNombre: { fontSize: 16, fontWeight: '600', color: '#333' },
  itemCodigo: { fontSize: 12, color: '#999', marginTop: 2 },
  itemPrecio: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32' },
  listaVaciaText: { textAlign: 'center', color: '#999', marginTop: 20, fontSize: 14, fontStyle: 'italic' },
  btnReactivarCamara: { backgroundColor: '#2196F3', padding: 15, borderRadius: 8, width: '90%', alignItems: 'center' },
  btnReactivarCamaraText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  btnLimpiar: { backgroundColor: '#d32f2f', width: '85%', padding: 10, borderRadius: 8, alignItems: 'center', marginVertical: 8 },
  btnLimpiarText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  
  instructionText: { width: '85%', fontSize: 13, fontWeight: 'bold', color: '#666' },
  formCard: { backgroundColor: '#fff', width: '85%', padding: 20, borderRadius: 12, marginTop: 10, marginBottom: 30 },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 12, fontSize: 16 },
  submitButton: { backgroundColor: '#4CAF50', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});