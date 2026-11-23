import * as catalogo from './catalogoLocal';
import * as cola from './colaSincronizacion';
import * as ventasLocal from './ventasLocal';
import { sincronizar } from './sincronizacion';
import { estadoStock } from '../utils/inventario';

/**
 * Registra una venta terminada. Se guarda en el celular al instante y se envía a
 * Firebase (ventas/<id>) en cuanto haya internet. Lanza error si no se pudo guardar.
 * También descuenta del inventario los productos que lo llevan.
 * Devuelve { bajos }: productos que quedaron agotados o con poco inventario por esta venta.
 */
export async function registrarVenta({ items, totalCentavos, recibidoCentavos, cambioCentavos }) {
  const ahora = new Date();
  const datos = {
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
  };

  // Existencias nuevas (usa la existencia ACTUAL del catálogo, no la del momento de escanear).
  // Nunca baja de 0. Los productos sin control de inventario no se tocan.
  const stockNuevo = {};
  const bajos = [];
  for (const item of items) {
    const producto = catalogo.buscar(item.codigo);
    if (!producto || producto.stock == null) continue;
    const nuevo = Math.max(0, producto.stock - item.cantidad);
    stockNuevo[producto.codigo] = nuevo;
    const estado = estadoStock({ ...producto, stock: nuevo });
    if (estado === 'agotado' || estado === 'bajo') bajos.push({ nombre: producto.nombre, stock: nuevo, estado });
  }

  // La cola es lo importante (si falla, se avisa). Lo demás es un extra.
  const operacion = await cola.encolar('venta', datos, { stock: stockNuevo });
  catalogo.aplicarStock(stockNuevo);
  try {
    await ventasLocal.guardar(operacion.id, datos);
  } catch {
    // la venta igual se enviará a Firebase
  }
  sincronizar();
  return { bajos };
}
