// Reglas de inventario compartidas por servicios y pantallas.
// stock == null significa "este producto no lleva control de inventario" (no descuenta ni avisa).

export const MINIMO_POR_DEFECTO = 5;

export const minimoEfectivo = (p) => p.stockMinimo ?? MINIMO_POR_DEFECTO;

/** 'sinControl' | 'agotado' | 'bajo' | 'ok' */
export function estadoStock(p) {
  if (p.stock == null) return 'sinControl';
  if (p.stock <= 0) return 'agotado';
  if (p.stock <= minimoEfectivo(p)) return 'bajo';
  return 'ok';
}

export const necesitaAviso = (p) => {
  const e = estadoStock(p);
  return e === 'agotado' || e === 'bajo';
};

// Solo enteros positivos (o cero). Devuelve null si el texto no es válido.
export function parsearCantidad(texto) {
  const limpio = String(texto ?? '').trim();
  return /^\d{1,6}$/.test(limpio) ? Number(limpio) : null;
}

// Extrae de un objeto solo los campos de inventario que vengan definidos
export function cambiosInventario(datos) {
  const cambios = {};
  if ('stock' in datos) cambios.stock = datos.stock;
  if ('stockMinimo' in datos) cambios.stockMinimo = datos.stockMinimo;
  return cambios;
}
