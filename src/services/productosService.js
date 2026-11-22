import { ref, get, set } from 'firebase/database';
import { db } from '../config/firebase';
import { pesosACentavos } from '../utils/dinero';

const TIEMPO_ESPERA_MS = 8000; // sin internet, Firebase puede quedarse esperando para siempre
const VIDA_CACHE_MS = 5 * 60 * 1000;

// Caché en memoria: un producto ya escaneado no vuelve a consultarse a Firebase
const cache = new Map();

class ErrorProductos extends Error {
  constructor(tipo, mensaje) {
    super(mensaje);
    this.tipo = tipo;
  }
}

// Firebase no acepta . # $ [ ] / en las claves
const claveProducto = (codigo) => String(codigo).trim().replace(/[.#$[\]/]/g, '_');

function conTiempoLimite(promesa) {
  let temporizador;
  const limite = new Promise((_, rechazar) => {
    temporizador = setTimeout(
      () => rechazar(new ErrorProductos('timeout', 'Sin conexión o conexión muy lenta.')),
      TIEMPO_ESPERA_MS
    );
  });
  return Promise.race([promesa, limite]).finally(() => clearTimeout(temporizador));
}

export function mensajeDeError(error) {
  if (error instanceof ErrorProductos) return error.message;
  return 'Ocurrió un problema con la base de datos.';
}

/** Busca un producto por código. Devuelve null si no existe. */
export async function obtenerProducto(codigo, { forzar = false } = {}) {
  const clave = claveProducto(codigo);

  const enCache = cache.get(clave);
  if (!forzar && enCache && Date.now() - enCache.guardadoEn < VIDA_CACHE_MS) {
    return enCache.producto;
  }

  const snapshot = await conTiempoLimite(get(ref(db, `productos/${clave}`)));
  if (!snapshot.exists()) return null;

  const datos = snapshot.val();
  const precioCentavos = pesosACentavos(datos.precio);
  if (!datos.nombre || Number.isNaN(precioCentavos)) {
    throw new ErrorProductos('datos', `El producto ${codigo} tiene datos incompletos en la base de datos.`);
  }

  const producto = { codigo: String(codigo).trim(), nombre: datos.nombre, precioCentavos };
  cache.set(clave, { producto, guardadoEn: Date.now() });
  return producto;
}

/** Crea o actualiza un producto. */
export async function guardarProducto({ codigo, nombre, precioCentavos }) {
  const clave = claveProducto(codigo);
  await conTiempoLimite(set(ref(db, `productos/${clave}`), { nombre, precio: precioCentavos / 100 }));
  cache.set(clave, {
    producto: { codigo: String(codigo).trim(), nombre, precioCentavos },
    guardadoEn: Date.now(),
  });
}
