import { Alert } from 'react-native';

// Alert con promesa: permite esperar la decisión del usuario con await.
export const confirmar = (titulo, mensaje, { si = 'Aceptar', no = 'Cancelar' } = {}) =>
  new Promise((resolve) => {
    Alert.alert(
      titulo,
      mensaje,
      [
        { text: no, style: 'cancel', onPress: () => resolve(false) },
        { text: si, onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
