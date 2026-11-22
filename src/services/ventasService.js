import * as cola from './colaSincronizacion';
import { sincronizar } from './sincronizacion';

/**
 * Registra una venta terminada. Se guarda en el celular al instante y se envía a
 * Firebase (ventas/<id>) en cuanto haya internet. Lanza error si no se pudo guardar.
 */
export async function registrarVenta({ items, totalCentavos, recibidoCentavos, cambioCentavos }) {
  const ahora = new Date();
  await cola.encolar('venta', {
    fecha: ahora.toISOString(),
    timestamp: ahora.getTime(),
    total: totalCentavos / 100,
    recibido: recibidoCentavos / 100,
    cambio: cambioCentavos / 100,
    articulos: items.map((i) => ({
      codigo: i.codigo,
      nombre: i.nombre,
      precio: i.precioCentavos / 100,
      cantidad: i.cantidad,
    })),
  });
  sincronizar();
}
