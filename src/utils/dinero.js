// Todo el dinero se maneja en CENTAVOS (enteros) para evitar errores de
// redondeo de los decimales (ej. 0.1 + 0.2 = 0.30000000000000004).

export const BILLETES_RAPIDOS = [50, 100, 200, 500];

export const pesosACentavos = (pesos) => Math.round(Number(pesos) * 100);

export const formatearMonto = (centavos) => `$${(centavos / 100).toFixed(2)}`;

// Convierte lo que escribe el usuario ("12", "12.5", "12,50") a centavos.
// Devuelve null si el texto no es un monto válido.
export function parsearMonto(texto) {
  const limpio = String(texto ?? '').trim().replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(limpio)) return null;
  return pesosACentavos(limpio);
}
