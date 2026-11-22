import { leerJSON, guardarJSON } from './almacen';

// Copia de todos los productos en el celular. Las búsquedas se hacen aquí
// (instantáneo y sin internet); Firebase solo la mantiene actualizada.

const CLAVE_DISCO = 'catalogo:v1';
const RETRASO_GUARDADO_MS = 800;

let productos = new Map(); // clave -> { codigo, nombre, precioCentavos }
let ultimaDescarga = 0;
let temporizador = null;
const oyentes = new Set();

const avisar = () => oyentes.forEach((f) => f());
export const suscribir = (f) => {
  oyentes.add(f);
  return () => oyentes.delete(f);
};

// Firebase no acepta . # $ [ ] / en las claves
export const claveProducto = (codigo) => String(codigo).trim().replace(/[.#$[\]/]/g, '_');

export async function cargar() {
  const disco = await leerJSON(CLAVE_DISCO, { ultimaDescarga: 0, productos: {} });
  productos = new Map(Object.entries(disco.productos ?? {}));
  ultimaDescarga = disco.ultimaDescarga ?? 0;
  avisar();
}

async function persistir() {
  clearTimeout(temporizador);
  temporizador = null;
  try {
    await guardarJSON(CLAVE_DISCO, { ultimaDescarga, productos: Object.fromEntries(productos) });
  } catch {
    // Si falla, no pasa nada grave: los cambios pendientes también están en la cola
  }
}

// Guardado diferido: varios cambios seguidos = una sola escritura a disco
function persistirDiferido() {
  clearTimeout(temporizador);
  temporizador = setTimeout(persistir, RETRASO_GUARDADO_MS);
}

export const vaciar = () => (temporizador ? persistir() : Promise.resolve());

export const buscar = (codigo) => productos.get(claveProducto(codigo)) ?? null;
export const total = () => productos.size;
export const obtenerUltimaDescarga = () => ultimaDescarga;

export function guardar(producto) {
  productos.set(claveProducto(producto.codigo), { ...producto, codigo: claveProducto(producto.codigo) });
  persistirDiferido();
  avisar();
}

// Cambios hechos en el celular que aún no llegan a Firebase (tienen prioridad)
function aplicarPendientes(operaciones) {
  for (const op of operaciones) {
    if (op.tipo === 'producto') {
      const clave = claveProducto(op.datos.codigo);
      productos.set(clave, { ...op.datos, codigo: clave });
    }
  }
}

export function restaurarPendientes(operaciones) {
  aplicarPendientes(operaciones);
  avisar();
}

// Reemplaza el catálogo con el de Firebase, sin perder lo pendiente de enviar
export async function reemplazarDesdeServidor(nuevos, operacionesPendientes) {
  productos = nuevos;
  aplicarPendientes(operacionesPendientes);
  ultimaDescarga = Date.now();
  avisar();
  await persistir();
}
