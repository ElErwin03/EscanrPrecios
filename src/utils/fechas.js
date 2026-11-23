// Utilidades de fecha en español (hora local del celular)

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Timestamp de las 00:00 del día de `ts`. */
export function inicioDelDia(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Inicio del día `n` días después (o antes, si n es negativo). */
export function sumarDias(ts, n) {
  const d = new Date(ts);
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export const esMismoDia = (a, b) => inicioDelDia(a) === inicioDelDia(b);

/** "14:05" */
export function formatearHora(ts) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** "Hoy · Domingo 22 de noviembre" / "Ayer · ..." / "Sábado 21 de noviembre" */
export function formatearDia(ts, ahora = Date.now()) {
  const d = new Date(ts);
  const base = `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
  const texto = base[0].toUpperCase() + base.slice(1);
  if (esMismoDia(ts, ahora)) return `Hoy · ${texto}`;
  if (esMismoDia(ts, sumarDias(ahora, -1))) return `Ayer · ${texto}`;
  return texto;
}
