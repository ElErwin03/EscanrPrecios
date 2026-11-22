import AsyncStorage from '@react-native-async-storage/async-storage';

// Pequeño envoltorio de AsyncStorage para guardar/leer JSON en el celular.

export async function leerJSON(clave, defecto) {
  try {
    const texto = await AsyncStorage.getItem(clave);
    return texto ? JSON.parse(texto) : defecto;
  } catch {
    return defecto;
  }
}

// Si falla, el error se propaga (para no decir "guardado" cuando no lo está)
export async function guardarJSON(clave, valor) {
  await AsyncStorage.setItem(clave, JSON.stringify(valor));
}
