import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colores } from '../config/theme';

// Banner flotante no bloqueante. Se coloca dentro de un contenedor con position relative.
export default function Aviso({ aviso }) {
  if (!aviso) return null;
  const esError = aviso.tipo === 'error';
  return (
    <View pointerEvents="none" style={[estilos.caja, { backgroundColor: esError ? colores.peligro : colores.exitoOscuro }]}>
      <Text style={estilos.texto} numberOfLines={2}>
        {aviso.texto}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: { position: 'absolute', left: 8, right: 8, bottom: 8, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, opacity: 0.95 },
  texto: { color: '#fff', fontWeight: '600', fontSize: 14, textAlign: 'center' },
});
