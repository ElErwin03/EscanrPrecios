import * as catalogo from './catalogoLocal';
import * as cola from './colaSincronizacion';
import { sincronizar } from './sincronizacion';

// Cada cambio guarda el valor FINAL de existencia (no "+5"), así que un reenvío
// a Firebase nunca suma ni resta dos veces.

async function guardarCambios(codigo, cambios) {
  const clave = catalogo.claveProducto(codigo);
  if (!catalogo.buscar(clave)) throw new Error('Producto no encontrado');
  await cola.encolar('inventario', { codigo: clave, ...cambios }); // primero a disco
  catalogo.actualizarInventario(clave, cambios);
  sincronizar();
}

/** Suma lo que llegó a la existencia. Si el producto no tenía control, empieza en 0. Devuelve la nueva existencia. */
export async function agregarExistencia(codigo, cantidad) {
  const nuevo = (catalogo.buscar(codigo)?.stock ?? 0) + cantidad;
  await guardarCambios(codigo, { stock: nuevo });
  return nuevo;
}

/** Fija la existencia exacta (por ejemplo, después de contar). */
export const fijarExistencia = (codigo, stock) => guardarCambios(codigo, { stock });

/** Cantidad a partir de la cual avisar. null = usar el valor por defecto. */
export const fijarMinimo = (codigo, minimo) => guardarCambios(codigo, { stockMinimo: minimo });
