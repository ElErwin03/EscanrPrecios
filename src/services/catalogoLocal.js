import { leerJSON, guardarJSON } from './almacen';
import { pesosACentavos } from '../utils/dinero';
import { cambiosInventario } from '../utils/inventario';

// Copia de todos los productos en el celular. Las búsquedas se hacen aquí
// (instantáneo y sin internet); Firebase solo la mantiene actualizada.
// Producto: { codigo, nombre, precioCentavos, stock (número | null), stockMinimo (número | null) }

const CLAVE_DISCO = 'catalogo:v1';
const RETRASO_GUARDADO_MS = 800;

let productos = new Map(); // clave -> producto
let lista = null; // copia en arreglo, se reutiliza hasta que algo cambie
let ultimaDescarga = 0;
let temporizador = null;
const oyentes = new Set();

function cambiado() {
  lista = null;
  oyentes.forEach((f) => f());
}
export const suscribir = (f) => {
  oyentes.add(f);
  return () => oyentes.delete(f);
};

// Firebase no acepta . # $ [ ] / en las claves
export const claveProducto = (codigo) => String(codigo).trim().replace(/[.#$[\]/]/g, '_');

/** Convierte lo que hay en Firebase a un producto. Devuelve null si está incompleto. */
export function desdeFirebase(clave, datos) {
  const precioCentavos = pesosACentavos(datos?.precio);
  if (!datos?.nombre || Number.isNaN(precioCentavos)) return null;
  return {
    codigo: clave,
    nombre: datos.nombre,
    precioCentavos,
    stock: Number.isFinite(datos.stock) ? datos.stock : null,
    stockMinimo: Number.isFinite(datos.stockMinimo) ? datos.stockMinimo : null,
  };
}

export async function cargar() {
  const disco = await leerJSON(CLAVE_DISCO, { ultimaDescarga: 0, productos: {} });
  productos = new Map(Object.entries(disco.productos ?? {}));
  ultimaDescarga = disco.ultimaDescarga ?? 0;
  cambiado();
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

// Mismo arreglo hasta que cambie el catálogo (requisito de useSyncExternalStore)
export function listar() {
  if (!lista) lista = [...productos.values()];
  return lista;
}

/** Crea o actualiza un producto. Conserva su inventario si ya lo tenía. */
export function guardar(producto) {
  const clave = claveProducto(producto.codigo);
  productos.set(clave, { ...productos.get(clave), ...producto, codigo: clave });
  persistirDiferido();
  cambiado();
}

/** Cambia existencia y/o mínimo de aviso de un producto. */
export function actualizarInventario(codigo, cambios) {
  const clave = claveProducto(codigo);
  const actual = productos.get(clave);
  if (!actual) return;
  productos.set(clave, { ...actual, ...cambiosInventario(cambios) });
  persistirDiferido();
  cambiado();
}

/** Aplica las existencias nuevas calculadas por una venta: { codigo: existenciaNueva } */
export function aplicarStock(mapa) {
  for (const [codigo, stock] of Object.entries(mapa)) {
    const actual = productos.get(claveProducto(codigo));
    if (actual) productos.set(claveProducto(codigo), { ...actual, stock });
  }
  persistirDiferido();
  cambiado();
}

// Cambios hechos en el celular que aún no llegan a Firebase (tienen prioridad, en orden)
function aplicarPendientes(operaciones) {
  for (const op of operaciones) {
    if (op.tipo === 'producto') {
      const clave = claveProducto(op.datos.codigo);
      productos.set(clave, { ...productos.get(clave), ...op.datos, codigo: clave });
    } else if (op.tipo === 'precio') {
      const clave = claveProducto(op.datos.codigo);
      const actual = productos.get(clave);
      if (actual) productos.set(clave, { ...actual, precioCentavos: op.datos.precioCentavos });
    } else if (op.tipo === 'inventario') {
      const clave = claveProducto(op.datos.codigo);
      const actual = productos.get(clave);
      if (actual) productos.set(clave, { ...actual, ...cambiosInventario(op.datos) });
    } else if ((op.tipo === 'venta' || op.tipo === 'devolucion') && op.stock) {
      for (const [codigo, stock] of Object.entries(op.stock)) {
        const actual = productos.get(claveProducto(codigo));
        if (actual) productos.set(claveProducto(codigo), { ...actual, stock });
      }
    }
  }
}

export function restaurarPendientes(operaciones) {
  aplicarPendientes(operaciones);
  cambiado();
}

// Reemplaza el catálogo con el de Firebase, sin perder lo pendiente de enviar
export async function reemplazarDesdeServidor(nuevos, operacionesPendientes) {
  productos = nuevos;
  aplicarPendientes(operacionesPendientes);
  ultimaDescarga = Date.now();
  cambiado();
  await persistir();
}
