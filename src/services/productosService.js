import { ref, get } from 'firebase/database';
import { db } from '../config/firebase';
import { pesosACentavos } from '../utils/dinero';
import { ErrorRed, conTiempoLimite, mensajeDeError } from '../utils/red';
import * as catalogo from './catalogoLocal';
import * as cola from './colaSincronizacion';
import { obtenerEstado, sincronizar } from './sincronizacion';

export { mensajeDeError };

/**
 * Busca un producto. Primero en el catálogo del celular (instantáneo, sin internet).
 * Si no está y hay conexión, pregunta a Firebase por si otro celular lo registró hace poco.
 * Devuelve null si no existe.
 */
export async function obtenerProducto(codigo, { soloLocal = false } = {}) {
  const local = catalogo.buscar(codigo);
  if (local || soloLocal || !obtenerEstado().enLinea) return local;

  const clave = catalogo.claveProducto(codigo);
  const snapshot = await conTiempoLimite(get(ref(db, `productos/${clave}`)), 5000);
  if (!snapshot.exists()) return null;

  const datos = snapshot.val();
  const precioCentavos = pesosACentavos(datos.precio);
  if (!datos.nombre || Number.isNaN(precioCentavos)) {
    throw new ErrorRed('datos', `El producto ${codigo} tiene datos incompletos en la base de datos.`);
  }
  const producto = { codigo: clave, nombre: datos.nombre, precioCentavos };
  catalogo.guardar(producto);
  return producto;
}

/** Guarda en el celular al instante y lo envía a Firebase en cuanto haya internet. */
export async function guardarProducto({ codigo, nombre, precioCentavos }) {
  const producto = { codigo: catalogo.claveProducto(codigo), nombre, precioCentavos };
  await cola.encolar('producto', producto); // primero a la cola (disco): es lo que no se puede perder
  catalogo.guardar(producto);
  sincronizar();
}
