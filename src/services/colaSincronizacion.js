import { leerJSON, guardarJSON } from './almacen';

// Cola de operaciones pendientes de enviar a Firebase (ventas y productos nuevos).
// Se guarda en disco: sobrevive aunque cierres la app o se apague el celular.

const CLAVE_DISCO = 'cola:v1';

let operaciones = [];
const oyentes = new Set();

const avisar = () => oyentes.forEach((f) => f());
export const suscribir = (f) => {
  oyentes.add(f);
  return () => oyentes.delete(f);
};

export const nuevoId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export async function cargar() {
  operaciones = await leerJSON(CLAVE_DISCO, []);
  avisar();
}

export const listar = () => operaciones;
export const cantidad = () => operaciones.length;

/** Agrega una operación y la guarda en disco. Si no se puede guardar, lanza error. */
export async function encolar(tipo, datos, extra = {}) {
  const operacion = { id: nuevoId(), tipo, datos, ...extra, creado: Date.now() };
  operaciones = [...operaciones, operacion];
  avisar();
  try {
    await guardarJSON(CLAVE_DISCO, operaciones);
  } catch (error) {
    operaciones = operaciones.filter((o) => o.id !== operacion.id);
    avisar();
    throw error;
  }
  return operacion;
}

export async function quitar(id) {
  operaciones = operaciones.filter((o) => o.id !== id);
  avisar();
  await guardarJSON(CLAVE_DISCO, operaciones);
}

export async function marcarFallo(id, mensaje) {
  operaciones = operaciones.map((o) => (o.id === id ? { ...o, fallo: mensaje } : o));
  avisar();
  await guardarJSON(CLAVE_DISCO, operaciones);
}
