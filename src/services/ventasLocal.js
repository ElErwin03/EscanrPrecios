import { leerJSON, guardarJSON } from './almacen';
import { sumarDias } from '../utils/fechas';

// Registro de las ventas hechas en ESTE celular (para el historial, también sin internet).
// La cola de sincronización solo guarda lo pendiente; esto conserva el historial.

const CLAVE_DISCO = 'ventas:v1';
const DIAS_A_CONSERVAR = 30;

let ventas = []; // más antiguas primero
const oyentes = new Set();

const avisar = () => oyentes.forEach((f) => f());
export const suscribir = (f) => {
  oyentes.add(f);
  return () => oyentes.delete(f);
};

export async function cargar() {
  const guardadas = await leerJSON(CLAVE_DISCO, []);
  const limite = sumarDias(Date.now(), -DIAS_A_CONSERVAR);
  ventas = guardadas.filter((v) => v.timestamp >= limite);
  avisar();
}

// Devuelve siempre el mismo arreglo hasta que cambie (requisito de useSyncExternalStore)
export const listar = () => ventas;

export async function guardar(id, datos) {
  ventas = [...ventas, { id, ...datos }];
  avisar();
  await guardarJSON(CLAVE_DISCO, ventas);
}
