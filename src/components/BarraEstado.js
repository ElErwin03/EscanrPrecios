import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSincronizacion } from '../hooks/useSincronizacion';
import { sincronizar } from '../services/sincronizacion';

// Franja de estado bajo las pestañas. Si todo está en orden y en línea, no se muestra.
export default function BarraEstado() {
  const { enLinea, sincronizando, pendientes, productosLocales, error } = useSincronizacion();

  const porEnviar = pendientes > 0 ? ` · ${pendientes} por enviar` : '';
  let texto = null;
  let fondo = '#e65100';

  if (!enLinea) {
    texto =
      productosLocales === 0
        ? '📴 Sin conexión y sin catálogo guardado. Abre la app con internet al menos una vez.'
        : `📴 Sin conexión · usando datos del celular${porEnviar}`;
  } else if (sincronizando) {
    texto = `🔄 Sincronizando…${porEnviar}`;
    fondo = '#1976d2';
  } else if (error) {
    texto = `⚠️ ${error} · toca para reintentar`;
    fondo = '#c62828';
  } else if (pendientes > 0) {
    texto = `⏳${porEnviar} · toca para enviar`;
    fondo = '#f9a825';
  }

  if (!texto) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={!enLinea || sincronizando}
      onPress={() => sincronizar({ descargar: true })}
      style={[estilos.barra, { backgroundColor: fondo }]}
    >
      <Text style={estilos.texto}>{texto}</Text>
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  barra: { paddingVertical: 6, paddingHorizontal: 12 },
  texto: { color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
